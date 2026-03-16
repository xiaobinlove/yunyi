import type { ContactRecord, ContactSettingRecord, ContactSettingUpsertInput } from "../database/entities";
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

    if (!pluck && isContactLookup(sql)) {
      const [appId, account, contactId] = params;
      if (typeof appId === "string" && typeof account === "string" && typeof contactId === "string") {
        const contact = repositories.contacts.findByKey(appId, account, contactId);
        const setting = repositories.contactSettings.findByKey(appId, account, contactId);
        return mergeContactSetting(contact, setting);
      }
    }

    if (!pluck && isContactSettingLookup(sql)) {
      const [appId, account, contactId] = params;
      if (typeof appId === "string" && typeof account === "string" && typeof contactId === "string") {
        return repositories.contactSettings.findByKey(appId, account, contactId);
      }
    }

    if (!pluck && method === "all" && isContactSettingSelectAll(sql)) {
      return repositories.contactSettings.listAll();
    }

    const statement = this.getPreparedReadStatement(database, sql, pluck);
    return method === "all" ? statement.all(...params) : statement.get(...params);
  }

  private getPreparedReadStatement(database: SqliteDatabase, sql: string, pluck: boolean): SqliteReadStatement {
    const statement = database.prepare(sql);
    return pluck ? statement.pluck(true) : statement;
  }
}
