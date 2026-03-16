import { ipcRenderer } from "electron";

type DatabaseSyncPayload =
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

type DatabaseSyncResponse =
  | {
      ok: true;
      value: unknown;
    }
  | {
      ok: false;
      error: {
        message: string;
        stack?: string;
      };
    };

type ModuleLoad = (request: string, parent: unknown, isMain: boolean) => unknown;

const PRELOAD_BRIDGE_MARK = Symbol.for("yunyi.preload.databaseBridgeInstalled");
const globalState = globalThis as Record<PropertyKey, unknown>;

function sendDatabaseSync(payload: DatabaseSyncPayload): unknown {
  const response = ipcRenderer.sendSync("database-sync", payload) as DatabaseSyncResponse;
  if (response.ok) {
    return response.value;
  }

  const error = new Error(response.error.message);
  if (response.error.stack) {
    error.stack = response.error.stack;
  }
  throw error;
}

class BetterSqliteStatementProxy {
  constructor(
    private readonly connectionId: number,
    private readonly sql: string,
    private readonly pluckMode = false
  ) {}

  run(...params: unknown[]): unknown {
    return sendDatabaseSync({
      action: "statement:run",
      connectionId: this.connectionId,
      sql: this.sql,
      params,
      pluck: this.pluckMode,
    });
  }

  all(...params: unknown[]): unknown[] {
    return sendDatabaseSync({
      action: "statement:all",
      connectionId: this.connectionId,
      sql: this.sql,
      params,
      pluck: this.pluckMode,
    }) as unknown[];
  }

  get(...params: unknown[]): unknown {
    return sendDatabaseSync({
      action: "statement:get",
      connectionId: this.connectionId,
      sql: this.sql,
      params,
      pluck: this.pluckMode,
    });
  }

  pluck(toggle = true): BetterSqliteStatementProxy {
    return new BetterSqliteStatementProxy(this.connectionId, this.sql, toggle);
  }
}

class BetterSqliteConnectionProxy {
  private readonly connectionId: number;

  constructor(databasePath: string, options?: Record<string, unknown>) {
    this.connectionId = Number(
      sendDatabaseSync({
        action: "connection:open",
        databasePath,
        options,
      })
    );
  }

  close(): void {
    sendDatabaseSync({
      action: "connection:close",
      connectionId: this.connectionId,
    });
  }

  exec(sql: string): unknown {
    return sendDatabaseSync({
      action: "connection:exec",
      connectionId: this.connectionId,
      sql,
    });
  }

  pragma(command: string, options?: Record<string, unknown>): unknown {
    return sendDatabaseSync({
      action: "connection:pragma",
      connectionId: this.connectionId,
      command,
      options,
    });
  }

  prepare(sql: string): BetterSqliteStatementProxy {
    return new BetterSqliteStatementProxy(this.connectionId, sql);
  }

  transaction<T extends (...args: never[]) => unknown>(callback: T): T {
    const connectionId = this.connectionId;
    return ((...args: never[]) => {
      sendDatabaseSync({ action: "transaction:begin", connectionId });
      try {
        const result = callback(...args);
        sendDatabaseSync({ action: "transaction:commit", connectionId });
        return result;
      } catch (error) {
        try {
          sendDatabaseSync({ action: "transaction:rollback", connectionId });
        } catch {
          // Ignore rollback failures and surface the original error instead.
        }
        throw error;
      }
    }) as T;
  }
}

function createBetterSqliteBridge() {
  return (databasePath: string, options?: Record<string, unknown>) =>
    new BetterSqliteConnectionProxy(databasePath, options);
}

function installBetterSqliteBridge(): void {
  const moduleApi = require("node:module") as { _load: ModuleLoad };
  const originalLoad = moduleApi._load;
  const betterSqliteBridge = createBetterSqliteBridge();

  moduleApi._load = function patchedLoad(request: string, parent: unknown, isMain: boolean): unknown {
    if (request === "better-sqlite3") {
      return betterSqliteBridge;
    }

    return originalLoad.call(this, request, parent, isMain);
  };
}

if (!globalState[PRELOAD_BRIDGE_MARK]) {
  installBetterSqliteBridge();
  globalState[PRELOAD_BRIDGE_MARK] = true;
}
