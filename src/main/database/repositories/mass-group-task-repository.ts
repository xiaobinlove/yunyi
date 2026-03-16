import type { MassGroupTaskItemInsertInput, MassGroupTaskItemRecord, MassGroupTaskRecord } from "../entities";
import type { SqliteDatabase } from "../sqlite";

function formatSqliteTimestamp(date: Date): string {
  const part = (value: number): string => String(value).padStart(2, "0");
  return [
    `${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())}`,
    `${part(date.getHours())}:${part(date.getMinutes())}:${part(date.getSeconds())}`,
  ].join(" ");
}

export class MassGroupTaskRepository {
  constructor(private readonly database: SqliteDatabase) {}

  insertTask(task: MassGroupTaskRecord): unknown {
    return this.database
      .prepare(
        `
          INSERT INTO mass_group_task (
            id,
            appId,
            accounts,
            groupIds,
            taskType,
            taskName,
            joinInterval,
            cloneNum,
            cloneInterval,
            taskStatus,
            totalNum,
            doneNum,
            startTime,
            endTime,
            errorMsg
          ) VALUES (
            $id,
            $appId,
            $accounts,
            $groupIds,
            $taskType,
            $taskName,
            $joinInterval,
            $cloneNum,
            $cloneInterval,
            $taskStatus,
            $totalNum,
            $doneNum,
            $startTime,
            $endTime,
            $errorMsg
          );
        `
      )
      .run(task);
  }

  insertItem(item: MassGroupTaskItemInsertInput): unknown {
    return this.database
      .prepare(
        `
          INSERT INTO mass_group_task_item (
            taskId,
            appId,
            clientId,
            account,
            groupId,
            status,
            startTime,
            endTime,
            errorMsg
          ) VALUES (
            $taskId,
            $appId,
            $clientId,
            $account,
            $groupId,
            $status,
            $startTime,
            $endTime,
            $errorMsg
          );
        `
      )
      .run({
        ...item,
        startTime: item.startTime ?? null,
        endTime: item.endTime ?? null,
        errorMsg: item.errorMsg ?? null,
      });
  }

  listByAppId(appId: string): MassGroupTaskRecord[] {
    return this.database.prepare<MassGroupTaskRecord>("SELECT * FROM mass_group_task WHERE appId = ?;").all(appId);
  }

  listItemsByTaskId(taskId: string): MassGroupTaskItemRecord[] {
    return this.database
      .prepare<MassGroupTaskItemRecord>("SELECT * FROM mass_group_task_item WHERE taskId = ?;")
      .all(taskId);
  }

  updateItemStatus(
    taskId: string,
    appId: string,
    clientId: string,
    account: string,
    groupId: string,
    status: string,
    errorMsg?: string
  ): void {
    this.database.transaction(() => {
      const item = this.database
        .prepare<MassGroupTaskItemRecord>(
          "SELECT * FROM mass_group_task_item WHERE taskId = ? AND appId = ? AND clientId = ? AND account = ? AND groupId = ? AND (status = 'waiting' OR status = 'running');"
        )
        .get(taskId, appId, clientId, account, groupId);

      if (!item) {
        return;
      }

      this.database
        .prepare("UPDATE mass_group_task_item SET status = ?, errorMsg = ? WHERE id = ?;")
        .run(status, errorMsg ?? "", item.id);
      this.syncTaskProgress(taskId);
    })();
  }

  updateItemsError(appId: string, clientId: string, errorMsg: string): void {
    this.database.transaction(() => {
      const tasks = this.database
        .prepare<Pick<MassGroupTaskRecord, "id">>(
          "SELECT * FROM mass_group_task WHERE appId = ? AND accounts LIKE ? AND (taskStatus = 'running' OR taskStatus = 'paused');"
        )
        .all(appId, `%${clientId}%`);

      this.database
        .prepare(
          "UPDATE mass_group_task_item SET status = ?, errorMsg = ? WHERE appId = ? AND clientId = ? AND (status = 'waiting' OR status = 'running');"
        )
        .run("error", errorMsg, appId, clientId);

      for (const task of tasks) {
        this.syncTaskProgress(task.id);
      }
    })();
  }

  updateTaskStatus(taskId: string, status: string): void {
    const task = this.database.prepare<MassGroupTaskRecord>("SELECT * FROM mass_group_task WHERE id = ?;").get(taskId);
    if (!task || ["done", "canceled", "error"].includes(task.taskStatus)) {
      return;
    }

    this.database.prepare("UPDATE mass_group_task SET taskStatus = ? WHERE id = ?;").run(status, taskId);
  }

  cancelRunningOrPaused(): void {
    this.database
      .prepare("UPDATE mass_group_task SET taskStatus = 'canceled' WHERE taskStatus = 'running' OR taskStatus = 'paused';")
      .run();
  }

  deleteTasksByIds(taskIds: readonly string[]): unknown {
    if (taskIds.length === 0) {
      return null;
    }

    if (taskIds.length === 1) {
      return this.database.prepare("DELETE FROM mass_group_task WHERE id = ?;").run(taskIds[0]);
    }

    return this.database
      .prepare(`DELETE FROM mass_group_task WHERE id IN (${taskIds.map(() => "?").join(", ")});`)
      .run(taskIds);
  }

  deleteItemsByTaskIds(taskIds: readonly string[]): unknown {
    if (taskIds.length === 0) {
      return null;
    }

    if (taskIds.length === 1) {
      return this.database.prepare("DELETE FROM mass_group_task_item WHERE taskId = ?;").run(taskIds[0]);
    }

    return this.database
      .prepare(`DELETE FROM mass_group_task_item WHERE taskId IN (${taskIds.map(() => "?").join(", ")});`)
      .run(taskIds);
  }

  private syncTaskProgress(taskId: string): void {
    const finishedCount =
      (this.database
        .prepare(
          "SELECT COUNT(1) FROM mass_group_task_item WHERE taskId = ? AND (status = 'done' OR status = 'error');"
        )
        .pluck(true)
        .get(taskId) as number | undefined) ?? 0;

    this.database.prepare("UPDATE mass_group_task SET doneNum = ? WHERE id = ?;").run(finishedCount, taskId);

    const totalCount =
      (this.database.prepare("SELECT COUNT(1) FROM mass_group_task_item WHERE taskId = ?;").pluck(true).get(taskId) as
        | number
        | undefined) ?? 0;

    if (totalCount <= finishedCount) {
      this.database
        .prepare("UPDATE mass_group_task SET taskStatus = 'done', endTime = ? WHERE id = ?;")
        .run(formatSqliteTimestamp(new Date()), taskId);
      return;
    }

    this.database.prepare("UPDATE mass_group_task SET taskStatus = 'running' WHERE id = ?;").run(taskId);
  }
}
