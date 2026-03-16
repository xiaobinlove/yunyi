type BetterSqliteDatabase = {
  close(): void;
  exec(sql: string): unknown;
  pragma(command: string, options?: Record<string, unknown>): unknown;
  prepare(sql: string): {
    run(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
    get(...params: unknown[]): unknown;
    pluck(toggle?: boolean): {
      get(...params: unknown[]): unknown;
      all(...params: unknown[]): unknown[];
    };
  };
};

type BetterSqliteReadStatement = {
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
};

type BetterSqliteFactory = (filename: string, options?: Record<string, unknown>) => BetterSqliteDatabase;

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
  database: BetterSqliteDatabase;
  ownerWebContentsId: number;
}

interface ContactSettingRecord {
  appId: string;
  account: string;
  contactId: string;
  transSetting: string;
}

const createDatabase = require("better-sqlite3") as BetterSqliteFactory;

const CONTACT_SETTING_UPSERT_SQL = `
  INSERT INTO contact_setting (appId, account, contactId, transSetting)
  VALUES ($appId, $account, $contactId, $transSetting)
  ON CONFLICT(appId, account, contactId)
  DO UPDATE SET transSetting = excluded.transSetting;
`;

const CONTACT_BY_KEY_SQL = "SELECT * FROM contact WHERE appId = ? AND account = ? AND contactId = ?;";

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, " ").trim().toLowerCase();
}

function isContactSettingUpsert(sql: string): boolean {
  return normalizeSql(sql).startsWith("insert or replace into contact_setting(");
}

function isContactLookup(sql: string): boolean {
  return normalizeSql(sql) === CONTACT_BY_KEY_SQL.toLowerCase();
}

function isContactSettingRecord(value: unknown): value is ContactSettingRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return ["appId", "account", "contactId", "transSetting"].every((key) => typeof record[key] === "string");
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
        return this.getConnection(payload.connectionId).exec(payload.sql);
      case "connection:pragma":
        return this.getConnection(payload.connectionId).pragma(payload.command, payload.options);
      case "statement:run":
      case "statement:all":
      case "statement:get":
        return this.executeStatement(payload);
      case "transaction:begin":
        this.getConnection(payload.connectionId).exec("BEGIN");
        return null;
      case "transaction:commit":
        this.getConnection(payload.connectionId).exec("COMMIT");
        return null;
      case "transaction:rollback":
        this.getConnection(payload.connectionId).exec("ROLLBACK");
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
    const database = createDatabase(databasePath, options);
    const connectionId = this.nextConnectionId++;
    this.connections.set(connectionId, { database, ownerWebContentsId });
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

  private getConnection(connectionId: number): BetterSqliteDatabase {
    const record = this.connections.get(connectionId);
    if (!record) {
      throw new Error(`Unknown database connection: ${connectionId}`);
    }

    return record.database;
  }

  private executeStatement(
    payload: Extract<DatabaseBridgePayload, { action: "statement:run" | "statement:all" | "statement:get" }>
  ): unknown {
    const params = payload.params ?? [];
    const database = this.getConnection(payload.connectionId);

    switch (payload.action) {
      case "statement:run":
        return this.executeRunStatement(database, payload.sql, params);
      case "statement:all":
        return this.executeReadStatement(database, payload.sql, params, payload.pluck === true, "all");
      case "statement:get":
        return this.executeReadStatement(database, payload.sql, params, payload.pluck === true, "get");
      default:
        return null;
    }
  }

  private executeRunStatement(database: BetterSqliteDatabase, sql: string, params: unknown[]): unknown {
    if (isContactSettingUpsert(sql) && isContactSettingRecord(params[0])) {
      return database.prepare(CONTACT_SETTING_UPSERT_SQL).run(params[0]);
    }

    return database.prepare(sql).run(...params);
  }

  private executeReadStatement(
    database: BetterSqliteDatabase,
    sql: string,
    params: unknown[],
    pluck: boolean,
    method: "all" | "get"
  ): unknown {
    const statement = this.getPreparedReadStatement(database, sql, pluck);
    const result = method === "all" ? statement.all(...params) : statement.get(...params);

    if (!pluck && isContactLookup(sql)) {
      return this.attachContactSetting(database, result, params);
    }

    return result;
  }

  private getPreparedReadStatement(
    database: BetterSqliteDatabase,
    sql: string,
    pluck: boolean
  ): BetterSqliteReadStatement {
    const statement = database.prepare(sql);
    return pluck ? statement.pluck(true) : statement;
  }

  private attachContactSetting(database: BetterSqliteDatabase, result: unknown, params: unknown[]): unknown {
    const [appId, account, contactId] = params;
    if (typeof appId !== "string" || typeof account !== "string" || typeof contactId !== "string") {
      return result;
    }

    const setting = database
      .prepare("SELECT transSetting FROM contact_setting WHERE appId = ? AND account = ? AND contactId = ?;")
      .get(appId, account, contactId) as { transSetting?: string } | undefined;

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
}
