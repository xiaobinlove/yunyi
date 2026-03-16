import type { MassSendTaskReceiverInsertInput, MassSendTaskReceiverRecord, MassSendTaskRecord } from "../entities";
import type { SqliteDatabase } from "../sqlite";

function formatSqliteTimestamp(date: Date): string {
  const part = (value: number): string => String(value).padStart(2, "0");
  return [
    `${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())}`,
    `${part(date.getHours())}:${part(date.getMinutes())}:${part(date.getSeconds())}`,
  ].join(" ");
}

export class MassSendTaskRepository {
  constructor(private readonly database: SqliteDatabase) {}

  insertTask(task: MassSendTaskRecord): unknown {
    return this.database
      .prepare(
        `
          INSERT INTO mass_send_task (
            id,
            appId,
            accounts,
            contactSelectType,
            contacts,
            taskName,
            taskContents,
            isTransBeforeSend,
            messageInterval,
            sessionInterval,
            taskStatus,
            totalNum,
            sentNum,
            startTime,
            endTime,
            errorMsg
          ) VALUES (
            $id,
            $appId,
            $accounts,
            $contactSelectType,
            $contacts,
            $taskName,
            $taskContents,
            $isTransBeforeSend,
            $messageInterval,
            $sessionInterval,
            $taskStatus,
            $totalNum,
            $sentNum,
            $startTime,
            $endTime,
            $errorMsg
          );
        `
      )
      .run(task);
  }

  insertReceiver(receiver: MassSendTaskReceiverInsertInput): unknown {
    return this.database
      .prepare(
        `
          INSERT INTO mass_send_task_receiver (
            taskId,
            appId,
            clientId,
            account,
            contactId,
            status,
            startTime,
            endTime,
            errorMsg
          ) VALUES (
            $taskId,
            $appId,
            $clientId,
            $account,
            $contactId,
            $status,
            $startTime,
            $endTime,
            $errorMsg
          );
        `
      )
      .run({
        ...receiver,
        startTime: receiver.startTime ?? null,
        endTime: receiver.endTime ?? null,
        errorMsg: receiver.errorMsg ?? null,
      });
  }

  listAll(): MassSendTaskRecord[] {
    return this.database.prepare<MassSendTaskRecord>("SELECT * FROM mass_send_task;").all();
  }

  listByAppId(appId: string): MassSendTaskRecord[] {
    return this.database.prepare<MassSendTaskRecord>("SELECT * FROM mass_send_task WHERE appId = ?;").all(appId);
  }

  listWaiting(): MassSendTaskRecord[] {
    return this.database
      .prepare<MassSendTaskRecord>("SELECT * FROM mass_send_task WHERE taskStatus = 'waiting' ORDER BY startTime ASC;")
      .all();
  }

  listReceiversByTaskId(taskId: string): MassSendTaskReceiverRecord[] {
    return this.database
      .prepare<MassSendTaskReceiverRecord>("SELECT * FROM mass_send_task_receiver WHERE taskId = ?;")
      .all(taskId);
  }

  updateReceiverStatus(
    taskId: string,
    appId: string,
    clientId: string,
    account: string,
    contactId: string,
    status: string,
    errorMsg?: string
  ): void {
    this.database.transaction(() => {
      this.database
        .prepare(
          "UPDATE mass_send_task_receiver SET status = ?, errorMsg = ? WHERE taskId = ? AND appId = ? AND clientId = ? AND account = ? AND contactId = ?;"
        )
        .run(status, errorMsg ?? "", taskId, appId, clientId, account, contactId);
      this.syncTaskProgress(taskId);
    })();
  }

  updateReceiversError(appId: string, clientId: string, errorMsg: string): void {
    this.database.transaction(() => {
      const tasks = this.database
        .prepare<Pick<MassSendTaskRecord, "id">>(
          "SELECT * FROM mass_send_task WHERE appId = ? AND accounts LIKE ? AND (taskStatus = 'running' OR taskStatus = 'paused');"
        )
        .all(appId, `%${clientId}%`);

      this.database
        .prepare(
          "UPDATE mass_send_task_receiver SET status = ?, errorMsg = ? WHERE appId = ? AND clientId = ? AND (status = 'waiting' OR status = 'running');"
        )
        .run("error", errorMsg, appId, clientId);

      for (const task of tasks) {
        this.syncTaskProgress(task.id);
      }
    })();
  }

  updateTaskStatus(taskId: string, status: string): void {
    const task = this.database.prepare<MassSendTaskRecord>("SELECT * FROM mass_send_task WHERE id = ?;").get(taskId);
    if (!task || ["done", "canceled", "error"].includes(task.taskStatus)) {
      return;
    }

    this.database.prepare("UPDATE mass_send_task SET taskStatus = ? WHERE id = ?;").run(status, taskId);
  }

  cancelRunningOrPaused(): void {
    this.database
      .prepare("UPDATE mass_send_task SET taskStatus = 'canceled' WHERE taskStatus = 'running' OR taskStatus = 'paused';")
      .run();
  }

  deleteTasksByIds(taskIds: readonly string[]): unknown {
    if (taskIds.length === 0) {
      return null;
    }

    if (taskIds.length === 1) {
      return this.database.prepare("DELETE FROM mass_send_task WHERE id = ?;").run(taskIds[0]);
    }

    return this.database
      .prepare(`DELETE FROM mass_send_task WHERE id IN (${taskIds.map(() => "?").join(", ")});`)
      .run(taskIds);
  }

  deleteReceiversByTaskIds(taskIds: readonly string[]): unknown {
    if (taskIds.length === 0) {
      return null;
    }

    if (taskIds.length === 1) {
      return this.database.prepare("DELETE FROM mass_send_task_receiver WHERE taskId = ?;").run(taskIds[0]);
    }

    return this.database
      .prepare(`DELETE FROM mass_send_task_receiver WHERE taskId IN (${taskIds.map(() => "?").join(", ")});`)
      .run(taskIds);
  }

  private syncTaskProgress(taskId: string): void {
    const finishedCount =
      (this.database
        .prepare(
          "SELECT COUNT(1) FROM mass_send_task_receiver WHERE taskId = ? AND (status = 'done' OR status = 'error');"
        )
        .pluck(true)
        .get(taskId) as number | undefined) ?? 0;

    this.database.prepare("UPDATE mass_send_task SET sentNum = ? WHERE id = ?;").run(finishedCount, taskId);

    const totalCount =
      (this.database.prepare("SELECT COUNT(1) FROM mass_send_task_receiver WHERE taskId = ?;").pluck(true).get(taskId) as
        | number
        | undefined) ?? 0;

    if (totalCount <= finishedCount) {
      this.database
        .prepare("UPDATE mass_send_task SET taskStatus = 'done', endTime = ? WHERE id = ?;")
        .run(formatSqliteTimestamp(new Date()), taskId);
      return;
    }

    this.database.prepare("UPDATE mass_send_task SET taskStatus = 'running' WHERE id = ?;").run(taskId);
  }
}
