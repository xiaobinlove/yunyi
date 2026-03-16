import type {
  ClientInsertInput,
  ClientUpdateInput,
  ContactRecord,
  ContactSettingRecord,
  ContactSettingUpsertInput,
  MassGroupTaskItemRecord,
  MassGroupTaskRecord,
  MassSendTaskReceiverRecord,
  MassSendTaskRecord,
  QuickReplyInsertInput,
  QuickReplyUpdateInput,
} from "../database/entities";
import { createMainDatabaseRepositories, type MainDatabaseRepositories } from "../database/repositories";
import { openSqliteDatabase, type SqliteDatabase, type SqliteReadStatement } from "../database/sqlite";

type DatabaseBridgePayload =
  | {
      action: "connection:open";
      databasePath: string;
      options?: Record<string, unknown>;
    }
  | {
      action: "connection:close";
      connectionId: number;
    }
  | {
      action: "connection:exec";
      connectionId: number;
      sql: string;
    }
  | {
      action: "connection:pragma";
      connectionId: number;
      command: string;
      options?: Record<string, unknown>;
    }
  | {
      action: "statement:run" | "statement:all" | "statement:get";
      connectionId: number;
      sql: string;
      params?: unknown[];
      pluck?: boolean;
    }
  | {
      action: "transaction:begin" | "transaction:commit" | "transaction:rollback";
      connectionId: number;
    };

interface DatabaseConnectionRecord {
  database: SqliteDatabase;
  repositories: MainDatabaseRepositories;
  ownerWebContentsId: number;
}

const CONTACT_BY_KEY_SQL = "SELECT * FROM contact WHERE appId = ? AND account = ? AND contactId = ?;";
const CONTACT_SETTING_BY_KEY_SQL = "SELECT * FROM contact_setting WHERE appId = ? AND account = ? AND contactId = ?;";
const CONTACT_SETTING_SELECT_ALL_SQL = "SELECT * FROM contact_setting;";
const CONTACT_SETTING_DELETE_BY_ACCOUNT_SQL = "DELETE FROM contact_setting WHERE appId = ? AND account = ?;";
const CLIENT_SELECT_ALL_SQL = "SELECT * FROM client;";
const CLIENT_PINNED_BY_APP_ID_SQL = "SELECT * FROM client WHERE appId = ? AND topOrder >= 0 ORDER BY topOrder DESC;";
const CLIENT_UNPINNED_BY_APP_ID_SQL = "SELECT * FROM client WHERE appId = ? AND topOrder < 0 ORDER BY `order` DESC;";
const CLIENT_MAX_ORDER_SQL = "SELECT MAX(`order`) FROM client WHERE appId = ?;";
const CLIENT_MAX_TOP_ORDER_SQL = "SELECT MAX(topOrder) FROM client WHERE appId = ?;";
const QUICK_REPLY_GROUP_SELECT_ALL_SQL = "SELECT * FROM quick_reply_group;";
const QUICK_REPLY_SELECT_ALL_SQL = "SELECT * FROM quick_reply;";
const QUICK_REPLY_GROUP_DELETE_SQL = "DELETE FROM quick_reply_group WHERE title = ?;";
const QUICK_REPLY_GROUP_RENAME_SQL = "UPDATE quick_reply_group SET title = ? WHERE title = ?;";
const QUICK_REPLY_DELETE_BY_GROUP_SQL = "DELETE FROM quick_reply WHERE `group` = ?;";
const QUICK_REPLY_UPDATE_GROUP_SQL = "UPDATE quick_reply SET `group` = ? WHERE `group` = ?;";
const MASS_SEND_TASK_SELECT_ALL_SQL = "SELECT * FROM mass_send_task;";
const MASS_SEND_TASK_BY_APP_ID_SQL = "SELECT * FROM mass_send_task WHERE appId = ?;";
const MASS_SEND_TASK_WAITING_SQL = "SELECT * FROM mass_send_task WHERE taskStatus = 'waiting' ORDER BY startTime ASC;";
const MASS_SEND_TASK_RECEIVER_BY_TASK_ID_SQL = "SELECT * FROM mass_send_task_receiver WHERE taskId = ?;";
const MASS_SEND_TASK_RECEIVER_STATUS_UPDATE_SQL =
  "UPDATE mass_send_task_receiver SET status = ?, errorMsg = ? WHERE taskId = ? AND appId = ? AND clientId = ? AND account = ? AND contactId = ?;";
const MASS_SEND_TASK_RECEIVER_ERROR_SQL =
  "UPDATE mass_send_task_receiver SET status = ?, errorMsg = ? WHERE appId = ? AND clientId = ? AND (status = 'waiting' OR status = 'running');";
const MASS_SEND_TASK_STATUS_UPDATE_SQL = "UPDATE mass_send_task SET taskStatus = $taskStatus WHERE id = $id;";
const MASS_SEND_TASK_CANCEL_RUNNING_SQL =
  "UPDATE mass_send_task SET taskStatus = 'canceled' WHERE taskStatus = 'running' OR taskStatus = 'paused';";
const MASS_GROUP_TASK_BY_APP_ID_SQL = "SELECT * FROM mass_group_task WHERE appId = ?;";
const MASS_GROUP_TASK_ITEM_BY_TASK_ID_SQL = "SELECT * FROM mass_group_task_item WHERE taskId = ?;";
const MASS_GROUP_TASK_ITEM_STATUS_SELECT_SQL =
  "SELECT * FROM mass_group_task_item WHERE taskId = ? AND appId = ? AND clientId = ? AND account = ? AND groupId = ? AND (status = 'waiting' OR status = 'running');";
const MASS_GROUP_TASK_ITEM_STATUS_UPDATE_SQL = "UPDATE mass_group_task_item SET status = ?, errorMsg = ? WHERE id = ?;";
const MASS_GROUP_TASK_ITEM_ERROR_SQL =
  "UPDATE mass_group_task_item SET status = ?, errorMsg = ? WHERE appId = ? AND clientId = ? AND (status = 'waiting' OR status = 'running');";
const MASS_GROUP_TASK_STATUS_UPDATE_SQL = "UPDATE mass_group_task SET taskStatus = $taskStatus WHERE id = $id;";
const MASS_GROUP_TASK_CANCEL_RUNNING_SQL =
  "UPDATE mass_group_task SET taskStatus = 'canceled' WHERE taskStatus = 'running' OR taskStatus = 'paused';";

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, " ").trim().toLowerCase();
}

function isContactUpsert(sql: string): boolean {
  return normalizeSql(sql).startsWith("insert or replace into contact(");
}

function isContactSettingUpsert(sql: string): boolean {
  return normalizeSql(sql).startsWith("insert or replace into contact_setting(");
}

function isContactLookup(sql: string): boolean {
  return normalizeSql(sql) === CONTACT_BY_KEY_SQL.toLowerCase();
}

function isContactSettingLookup(sql: string): boolean {
  return normalizeSql(sql) === CONTACT_SETTING_BY_KEY_SQL.toLowerCase();
}

function isContactSettingSelectAll(sql: string): boolean {
  return normalizeSql(sql) === CONTACT_SETTING_SELECT_ALL_SQL.toLowerCase();
}

function isContactSettingDeleteByAccount(sql: string): boolean {
  return normalizeSql(sql) === CONTACT_SETTING_DELETE_BY_ACCOUNT_SQL.toLowerCase();
}

function isClientInsert(sql: string): boolean {
  const normalizedSql = normalizeSql(sql);
  return normalizedSql.startsWith("insert into client (") || normalizedSql.startsWith("insert into client(");
}

function isClientUpdateById(sql: string): boolean {
  const normalizedSql = normalizeSql(sql);
  return normalizedSql.startsWith("update client set") && normalizedSql.includes("where id = $id;");
}

function isClientDeleteById(sql: string): boolean {
  const normalizedSql = normalizeSql(sql);
  return normalizedSql === "delete from client where id = ?;" || normalizedSql.startsWith("delete from client where id in (");
}

function isClientSelectAll(sql: string): boolean {
  return normalizeSql(sql) === CLIENT_SELECT_ALL_SQL.toLowerCase();
}

function isClientPinnedByAppId(sql: string): boolean {
  return normalizeSql(sql) === CLIENT_PINNED_BY_APP_ID_SQL.toLowerCase();
}

function isClientUnpinnedByAppId(sql: string): boolean {
  return normalizeSql(sql) === CLIENT_UNPINNED_BY_APP_ID_SQL.toLowerCase();
}

function isClientMaxOrder(sql: string): boolean {
  return normalizeSql(sql) === CLIENT_MAX_ORDER_SQL.toLowerCase();
}

function isClientMaxTopOrder(sql: string): boolean {
  return normalizeSql(sql) === CLIENT_MAX_TOP_ORDER_SQL.toLowerCase();
}

function isClientUpdateTopOrder(sql: string): boolean {
  return normalizeSql(sql) === "update client set toporder = ? where id = ?;";
}

function isClientUpdateOrder(sql: string): boolean {
  return normalizeSql(sql) === "update client set `order` = ? where id = ?;";
}

function isQuickReplyGroupInsert(sql: string): boolean {
  return normalizeSql(sql).startsWith("insert into quick_reply_group (");
}

function isQuickReplyInsert(sql: string): boolean {
  return normalizeSql(sql).startsWith("insert into quick_reply (");
}

function isQuickReplyUpdateById(sql: string): boolean {
  const normalizedSql = normalizeSql(sql);
  return normalizedSql.startsWith("update quick_reply set") && normalizedSql.includes("where id = $id;");
}

function isQuickReplyDeleteById(sql: string): boolean {
  const normalizedSql = normalizeSql(sql);
  return normalizedSql === "delete from quick_reply where id = ?;" || normalizedSql.startsWith("delete from quick_reply where id in (");
}

function isQuickReplyGroupDelete(sql: string): boolean {
  return normalizeSql(sql) === QUICK_REPLY_GROUP_DELETE_SQL.toLowerCase();
}

function isQuickReplyGroupRename(sql: string): boolean {
  return normalizeSql(sql) === QUICK_REPLY_GROUP_RENAME_SQL.toLowerCase();
}

function isQuickReplyDeleteByGroup(sql: string): boolean {
  return normalizeSql(sql) === QUICK_REPLY_DELETE_BY_GROUP_SQL.toLowerCase();
}

function isQuickReplyUpdateGroup(sql: string): boolean {
  return normalizeSql(sql) === QUICK_REPLY_UPDATE_GROUP_SQL.toLowerCase();
}

function isQuickReplyGroupSelectAll(sql: string): boolean {
  return normalizeSql(sql) === QUICK_REPLY_GROUP_SELECT_ALL_SQL.toLowerCase();
}

function isQuickReplySelectAll(sql: string): boolean {
  return normalizeSql(sql) === QUICK_REPLY_SELECT_ALL_SQL.toLowerCase();
}

function isMassSendTaskSelectAll(sql: string): boolean {
  return normalizeSql(sql) === MASS_SEND_TASK_SELECT_ALL_SQL.toLowerCase();
}

function isMassSendTaskByAppId(sql: string): boolean {
  return normalizeSql(sql) === MASS_SEND_TASK_BY_APP_ID_SQL.toLowerCase();
}

function isMassSendTaskWaiting(sql: string): boolean {
  return normalizeSql(sql) === MASS_SEND_TASK_WAITING_SQL.toLowerCase();
}

function isMassSendTaskReceiverByTaskId(sql: string): boolean {
  return normalizeSql(sql) === MASS_SEND_TASK_RECEIVER_BY_TASK_ID_SQL.toLowerCase();
}

function isMassSendTaskReceiverStatusUpdate(sql: string): boolean {
  return normalizeSql(sql) === MASS_SEND_TASK_RECEIVER_STATUS_UPDATE_SQL.toLowerCase();
}

function isMassSendTaskReceiverErrorUpdate(sql: string): boolean {
  return normalizeSql(sql) === MASS_SEND_TASK_RECEIVER_ERROR_SQL.toLowerCase();
}

function isMassSendTaskStatusUpdate(sql: string): boolean {
  return normalizeSql(sql) === MASS_SEND_TASK_STATUS_UPDATE_SQL.toLowerCase();
}

function isMassSendTaskCancelRunning(sql: string): boolean {
  return normalizeSql(sql) === MASS_SEND_TASK_CANCEL_RUNNING_SQL.toLowerCase();
}

function isMassGroupTaskByAppId(sql: string): boolean {
  return normalizeSql(sql) === MASS_GROUP_TASK_BY_APP_ID_SQL.toLowerCase();
}

function isMassGroupTaskItemByTaskId(sql: string): boolean {
  return normalizeSql(sql) === MASS_GROUP_TASK_ITEM_BY_TASK_ID_SQL.toLowerCase();
}

function isMassGroupTaskItemStatusSelect(sql: string): boolean {
  return normalizeSql(sql) === MASS_GROUP_TASK_ITEM_STATUS_SELECT_SQL.toLowerCase();
}

function isMassGroupTaskItemStatusUpdate(sql: string): boolean {
  return normalizeSql(sql) === MASS_GROUP_TASK_ITEM_STATUS_UPDATE_SQL.toLowerCase();
}

function isMassGroupTaskItemErrorUpdate(sql: string): boolean {
  return normalizeSql(sql) === MASS_GROUP_TASK_ITEM_ERROR_SQL.toLowerCase();
}

function isMassGroupTaskStatusUpdate(sql: string): boolean {
  return normalizeSql(sql) === MASS_GROUP_TASK_STATUS_UPDATE_SQL.toLowerCase();
}

function isMassGroupTaskCancelRunning(sql: string): boolean {
  return normalizeSql(sql) === MASS_GROUP_TASK_CANCEL_RUNNING_SQL.toLowerCase();
}

function toStringArrayParam(value: unknown): string[] | null {
  const values = Array.isArray(value) ? value : [value];
  return values.every((item) => typeof item === "string") ? (values as string[]) : null;
}

function toNumberArrayParam(value: unknown): number[] | null {
  const values = Array.isArray(value) ? value : [value];
  const normalizedValues = values.map((item) =>
    typeof item === "number" ? item : typeof item === "string" ? Number(item) : Number.NaN
  );
  return normalizedValues.every((item) => Number.isFinite(item)) ? normalizedValues : null;
}

function isNullableString(value: unknown): value is string | null | undefined {
  return value === null || value === undefined || typeof value === "string";
}

function toClientInsertInput(value: unknown): ClientInsertInput | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.id !== "string" || typeof record.appId !== "string" || typeof record.createTime !== "string") {
    return null;
  }

  const order = typeof record.order === "number" ? record.order : Number(record.order);
  const topOrder = typeof record.topOrder === "number" ? record.topOrder : Number(record.topOrder);
  const disabled = typeof record.disabled === "number" ? record.disabled : Number(record.disabled);
  if (![order, topOrder, disabled].every((item) => Number.isFinite(item))) {
    return null;
  }

  const nullableStringFields = [
    "name",
    "group",
    "website",
    "userid",
    "username",
    "avatar",
    "transSetting",
    "proxySetting",
    "agentSetting",
  ] as const;
  if (nullableStringFields.some((field) => !isNullableString(record[field]))) {
    return null;
  }

  return {
    id: record.id,
    appId: record.appId,
    name: (record.name as string | null | undefined) ?? null,
    group: (record.group as string | null | undefined) ?? null,
    order,
    topOrder,
    disabled,
    website: (record.website as string | null | undefined) ?? null,
    userid: (record.userid as string | null | undefined) ?? null,
    username: (record.username as string | null | undefined) ?? null,
    avatar: (record.avatar as string | null | undefined) ?? null,
    transSetting: (record.transSetting as string | null | undefined) ?? null,
    proxySetting: (record.proxySetting as string | null | undefined) ?? null,
    agentSetting: (record.agentSetting as string | null | undefined) ?? null,
    createTime: record.createTime,
  };
}

function toClientUpdateInput(value: unknown): ClientUpdateInput | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.id !== "string") {
    return null;
  }

  const output: ClientUpdateInput = { id: record.id };
  const nullableStringFields = [
    "appId",
    "name",
    "group",
    "userid",
    "username",
    "avatar",
    "transSetting",
    "proxySetting",
    "agentSetting",
    "website",
  ] as const;
  const numericFields = ["order", "topOrder", "disabled"] as const;

  for (const field of nullableStringFields) {
    const fieldValue = record[field];
    if (fieldValue === undefined) {
      continue;
    }
    if (!isNullableString(fieldValue)) {
      return null;
    }
    output[field] = fieldValue;
  }

  for (const field of numericFields) {
    const fieldValue = record[field];
    if (fieldValue === undefined) {
      continue;
    }
    const normalizedValue = typeof fieldValue === "number" ? fieldValue : Number(fieldValue);
    if (!Number.isFinite(normalizedValue)) {
      return null;
    }
    output[field] = normalizedValue;
  }

  return output;
}

function toContactRecord(value: unknown): ContactRecord | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const rawId = record.id;
  const id = typeof rawId === "number" ? rawId : typeof rawId === "string" ? Number(rawId) : Number.NaN;
  if (!Number.isFinite(id)) {
    return null;
  }

  const requiredStringFields = ["appId", "account", "contactId"] as const;
  if (requiredStringFields.some((field) => typeof record[field] !== "string")) {
    return null;
  }

  const optionalStringFields = ["nickname", "country", "gender", "level", "remark"] as const;
  for (const field of optionalStringFields) {
    if (record[field] !== null && record[field] !== undefined && typeof record[field] !== "string") {
      return null;
    }
  }

  return {
    id,
    appId: record.appId as string,
    account: record.account as string,
    contactId: record.contactId as string,
    nickname: (record.nickname as string | null | undefined) ?? null,
    country: (record.country as string | null | undefined) ?? null,
    gender: (record.gender as string | null | undefined) ?? null,
    level: (record.level as string | null | undefined) ?? null,
    remark: (record.remark as string | null | undefined) ?? null,
  };
}

function toContactSettingUpsertInput(value: unknown): ContactSettingUpsertInput | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (!["appId", "account", "contactId", "transSetting"].every((field) => typeof record[field] === "string")) {
    return null;
  }

  return {
    appId: record.appId as string,
    account: record.account as string,
    contactId: record.contactId as string,
    transSetting: record.transSetting as string,
  };
}

function toQuickReplyInsertInput(value: unknown): QuickReplyInsertInput | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (!["group", "title", "content"].every((field) => typeof record[field] === "string")) {
    return null;
  }

  return {
    group: record.group as string,
    title: record.title as string,
    content: record.content as string,
  };
}

function toQuickReplyUpdateInput(value: unknown): QuickReplyUpdateInput | null {
  const record = toQuickReplyInsertInput(value);
  if (!record || !value || typeof value !== "object") {
    return null;
  }

  const rawId = (value as Record<string, unknown>).id;
  const id = typeof rawId === "number" ? rawId : typeof rawId === "string" ? Number(rawId) : Number.NaN;
  if (!Number.isFinite(id)) {
    return null;
  }

  return {
    id,
    ...record,
  };
}

function toTaskStatusUpdate(value: unknown): { id: string; taskStatus: string } | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  return typeof record.id === "string" && typeof record.taskStatus === "string"
    ? { id: record.id, taskStatus: record.taskStatus }
    : null;
}

function mergeContactSetting(result: unknown, setting: ContactSettingRecord | null): unknown {
  if (!setting?.transSetting) {
    return result;
  }

  if (Array.isArray(result)) {
    return result.map((row) => (row && typeof row === "object" ? { ...row, transSetting: setting.transSetting } : row));
  }

  if (result && typeof result === "object") {
    return { ...result, transSetting: setting.transSetting };
  }

  return result;
}

function wrapReadResultForMethod<T>(value: T | null, method: "all" | "get"): T | T[] | null {
  if (method === "get") {
    return value;
  }

  return value ? [value] : [];
}

export class RendererDatabaseBridgeService {
  private nextConnectionId = 1;
  private readonly connections = new Map<number, DatabaseConnectionRecord>();
  private readonly trackedOwners = new Set<number>();

  handle(ownerWebContentsId: number, payload: DatabaseBridgePayload): unknown {
    switch (payload.action) {
      case "connection:open":
        return this.openConnection(ownerWebContentsId, payload.databasePath, payload.options);
      case "connection:close":
        this.closeConnection(payload.connectionId);
        return null;
      case "connection:exec":
        return this.getConnectionRecord(payload.connectionId).database.exec(payload.sql);
      case "connection:pragma":
        return this.getConnectionRecord(payload.connectionId).database.pragma(payload.command, payload.options);
      case "statement:run":
      case "statement:all":
      case "statement:get":
        return this.executeStatement(payload);
      case "transaction:begin":
        this.getConnectionRecord(payload.connectionId).database.exec("BEGIN");
        return null;
      case "transaction:commit":
        this.getConnectionRecord(payload.connectionId).database.exec("COMMIT");
        return null;
      case "transaction:rollback":
        this.getConnectionRecord(payload.connectionId).database.exec("ROLLBACK");
        return null;
      default:
        return null;
    }
  }

  markOwnerTracked(ownerWebContentsId: number): boolean {
    if (this.trackedOwners.has(ownerWebContentsId)) {
      return false;
    }

    this.trackedOwners.add(ownerWebContentsId);
    return true;
  }

  closeConnectionsForOwner(ownerWebContentsId: number): void {
    const ownedConnectionIds = [...this.connections.entries()]
      .filter(([, record]) => record.ownerWebContentsId === ownerWebContentsId)
      .map(([connectionId]) => connectionId);

    for (const connectionId of ownedConnectionIds) {
      this.closeConnection(connectionId);
    }

    this.trackedOwners.delete(ownerWebContentsId);
  }

  private openConnection(
    ownerWebContentsId: number,
    databasePath: string,
    options?: Record<string, unknown>
  ): number {
    const database = openSqliteDatabase(databasePath, options);
    const connectionId = this.nextConnectionId++;
    this.connections.set(connectionId, {
      database,
      repositories: createMainDatabaseRepositories(database),
      ownerWebContentsId,
    });
    return connectionId;
  }

  private closeConnection(connectionId: number): void {
    const record = this.connections.get(connectionId);
    if (!record) {
      return;
    }

    record.database.close();
    this.connections.delete(connectionId);
  }

  private getConnectionRecord(connectionId: number): DatabaseConnectionRecord {
    const record = this.connections.get(connectionId);
    if (!record) {
      throw new Error(`Unknown database connection: ${connectionId}`);
    }

    return record;
  }

  private executeStatement(
    payload: Extract<DatabaseBridgePayload, { action: "statement:run" | "statement:all" | "statement:get" }>
  ): unknown {
    const params = payload.params ?? [];
    const connection = this.getConnectionRecord(payload.connectionId);

    switch (payload.action) {
      case "statement:run":
        return this.executeRunStatement(connection, payload.sql, params);
      case "statement:all":
        return this.executeReadStatement(connection, payload.sql, params, payload.pluck === true, "all");
      case "statement:get":
        return this.executeReadStatement(connection, payload.sql, params, payload.pluck === true, "get");
      default:
        return null;
    }
  }

  private executeRunStatement(connection: DatabaseConnectionRecord, sql: string, params: unknown[]): unknown {
    const { database, repositories } = connection;

    if (isClientInsert(sql)) {
      const record = toClientInsertInput(params[0]);
      if (record) {
        return repositories.clients.insert(record);
      }
    }

    if (isClientUpdateById(sql)) {
      const record = toClientUpdateInput(params[0]);
      if (record) {
        return repositories.clients.update(record);
      }
    }

    if (isClientDeleteById(sql)) {
      const ids = toStringArrayParam(params[0]);
      if (ids) {
        return repositories.clients.deleteByIds(ids);
      }
    }

    if (isClientUpdateTopOrder(sql)) {
      const [topOrder, id] = params;
      const normalizedTopOrder = typeof topOrder === "number" ? topOrder : Number(topOrder);
      if (Number.isFinite(normalizedTopOrder) && typeof id === "string") {
        return repositories.clients.updateTopOrder(id, normalizedTopOrder);
      }
    }

    if (isClientUpdateOrder(sql)) {
      const [order, id] = params;
      const normalizedOrder = typeof order === "number" ? order : Number(order);
      if (Number.isFinite(normalizedOrder) && typeof id === "string") {
        return repositories.clients.updateOrder(id, normalizedOrder);
      }
    }

    if (isContactUpsert(sql)) {
      const record = toContactRecord(params[0]);
      if (record) {
        return repositories.contacts.upsert(record);
      }
    }

    if (isContactSettingUpsert(sql)) {
      const record = toContactSettingUpsertInput(params[0]);
      if (record) {
        return repositories.contactSettings.upsert(record);
      }
    }

    if (isContactSettingDeleteByAccount(sql)) {
      const [appId, account] = params;
      if (typeof appId === "string" && typeof account === "string") {
        return repositories.contactSettings.deleteByAccount(appId, account);
      }
    }

    if (isQuickReplyGroupInsert(sql)) {
      const [title] = params;
      if (typeof title === "object" && title !== null && typeof (title as Record<string, unknown>).title === "string") {
        return repositories.quickReplies.insertGroup({ title: (title as Record<string, unknown>).title as string });
      }
    }

    if (isQuickReplyInsert(sql)) {
      const record = toQuickReplyInsertInput(params[0]);
      if (record) {
        return repositories.quickReplies.insertReply(record);
      }
    }

    if (isQuickReplyUpdateById(sql)) {
      const record = toQuickReplyUpdateInput(params[0]);
      if (record) {
        return repositories.quickReplies.updateReply(record);
      }
    }

    if (isQuickReplyDeleteById(sql)) {
      const ids = toNumberArrayParam(params[0]);
      if (ids) {
        return repositories.quickReplies.deleteRepliesByIds(ids);
      }
    }

    if (isQuickReplyGroupDelete(sql)) {
      const [title] = params;
      if (typeof title === "string") {
        return repositories.quickReplies.deleteGroupByTitle(title);
      }
    }

    if (isQuickReplyGroupRename(sql)) {
      const [nextTitle, previousTitle] = params;
      if (typeof nextTitle === "string" && typeof previousTitle === "string") {
        return repositories.quickReplies.updateGroupTitle(nextTitle, previousTitle);
      }
    }

    if (isQuickReplyDeleteByGroup(sql)) {
      const [group] = params;
      if (typeof group === "string") {
        return repositories.quickReplies.deleteRepliesByGroup(group);
      }
    }

    if (isQuickReplyUpdateGroup(sql)) {
      const [nextGroup, previousGroup] = params;
      if (typeof nextGroup === "string" && typeof previousGroup === "string") {
        return repositories.quickReplies.updateReplyGroup(nextGroup, previousGroup);
      }
    }

    if (isMassSendTaskReceiverStatusUpdate(sql)) {
      const [status, errorMsg, taskId, appId, clientId, account, contactId] = params;
      if (
        typeof status === "string" &&
        typeof taskId === "string" &&
        typeof appId === "string" &&
        typeof clientId === "string" &&
        typeof account === "string" &&
        typeof contactId === "string"
      ) {
        repositories.massSendTasks.updateReceiverStatus(taskId, appId, clientId, account, contactId, status, typeof errorMsg === "string" ? errorMsg : undefined);
        return null;
      }
    }

    if (isMassSendTaskReceiverErrorUpdate(sql)) {
      const [, errorMsg, appId, clientId] = params;
      if (typeof errorMsg === "string" && typeof appId === "string" && typeof clientId === "string") {
        repositories.massSendTasks.updateReceiversError(appId, clientId, errorMsg);
        return null;
      }
    }

    if (isMassSendTaskStatusUpdate(sql)) {
      const record = toTaskStatusUpdate(params[0]);
      if (record) {
        repositories.massSendTasks.updateTaskStatus(record.id, record.taskStatus);
        return null;
      }
    }

    if (isMassSendTaskCancelRunning(sql)) {
      repositories.massSendTasks.cancelRunningOrPaused();
      return null;
    }

    if (isMassGroupTaskItemErrorUpdate(sql)) {
      const [, errorMsg, appId, clientId] = params;
      if (typeof errorMsg === "string" && typeof appId === "string" && typeof clientId === "string") {
        repositories.massGroupTasks.updateItemsError(appId, clientId, errorMsg);
        return null;
      }
    }

    if (isMassGroupTaskStatusUpdate(sql)) {
      const record = toTaskStatusUpdate(params[0]);
      if (record) {
        repositories.massGroupTasks.updateTaskStatus(record.id, record.taskStatus);
        return null;
      }
    }

    if (isMassGroupTaskCancelRunning(sql)) {
      repositories.massGroupTasks.cancelRunningOrPaused();
      return null;
    }

    return database.prepare(sql).run(...params);
  }

  private executeReadStatement(
    connection: DatabaseConnectionRecord,
    sql: string,
    params: unknown[],
    pluck: boolean,
    method: "all" | "get"
  ): unknown {
    const { database, repositories } = connection;

    if (method === "get" && isClientMaxOrder(sql)) {
      const [appId] = params;
      if (typeof appId === "string") {
        return repositories.clients.getMaxOrder(appId);
      }
    }

    if (method === "get" && isClientMaxTopOrder(sql)) {
      const [appId] = params;
      if (typeof appId === "string") {
        return repositories.clients.getMaxTopOrder(appId);
      }
    }

    if (!pluck && method === "all" && isClientSelectAll(sql)) {
      return repositories.clients.listAll();
    }

    if (!pluck && method === "all" && isClientPinnedByAppId(sql)) {
      const [appId] = params;
      if (typeof appId === "string") {
        return repositories.clients.listPinnedByAppId(appId);
      }
    }

    if (!pluck && method === "all" && isClientUnpinnedByAppId(sql)) {
      const [appId] = params;
      if (typeof appId === "string") {
        return repositories.clients.listUnpinnedByAppId(appId);
      }
    }

    if (!pluck && isContactLookup(sql)) {
      const [appId, account, contactId] = params;
      if (typeof appId === "string" && typeof account === "string" && typeof contactId === "string") {
        const contact = repositories.contacts.findByKey(appId, account, contactId);
        const setting = repositories.contactSettings.findByKey(appId, account, contactId);
        return wrapReadResultForMethod(mergeContactSetting(contact, setting) as ContactRecord | null, method);
      }
    }

    if (!pluck && isContactSettingLookup(sql)) {
      const [appId, account, contactId] = params;
      if (typeof appId === "string" && typeof account === "string" && typeof contactId === "string") {
        return wrapReadResultForMethod(repositories.contactSettings.findByKey(appId, account, contactId), method);
      }
    }

    if (!pluck && method === "all" && isContactSettingSelectAll(sql)) {
      return repositories.contactSettings.listAll();
    }

    if (!pluck && method === "all" && isQuickReplyGroupSelectAll(sql)) {
      return repositories.quickReplies.listGroups();
    }

    if (!pluck && method === "all" && isQuickReplySelectAll(sql)) {
      return repositories.quickReplies.listReplies();
    }

    if (!pluck && method === "all" && isMassSendTaskSelectAll(sql)) {
      return repositories.massSendTasks.listAll();
    }

    if (!pluck && method === "all" && isMassSendTaskByAppId(sql)) {
      const [appId] = params;
      if (typeof appId === "string") {
        return repositories.massSendTasks.listByAppId(appId);
      }
    }

    if (!pluck && method === "all" && isMassSendTaskWaiting(sql)) {
      return repositories.massSendTasks.listWaiting();
    }

    if (!pluck && method === "all" && isMassSendTaskReceiverByTaskId(sql)) {
      const [taskId] = params;
      if (typeof taskId === "string") {
        return repositories.massSendTasks.listReceiversByTaskId(taskId);
      }
    }

    if (!pluck && method === "all" && isMassGroupTaskByAppId(sql)) {
      const [appId] = params;
      if (typeof appId === "string") {
        return repositories.massGroupTasks.listByAppId(appId);
      }
    }

    if (!pluck && method === "all" && isMassGroupTaskItemByTaskId(sql)) {
      const [taskId] = params;
      if (typeof taskId === "string") {
        return repositories.massGroupTasks.listItemsByTaskId(taskId);
      }
    }

    const statement = this.getPreparedReadStatement(database, sql, pluck);
    return method === "all" ? statement.all(...params) : statement.get(...params);
  }

  private getPreparedReadStatement(database: SqliteDatabase, sql: string, pluck: boolean): SqliteReadStatement {
    const statement = database.prepare(sql);
    return pluck ? statement.pluck(true) : statement;
  }
}
