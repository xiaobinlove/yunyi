import { ensureLegacyDatabaseDirs, getLocalAppDatabasePath, getPrimaryDatabasePath } from "../runtime/database";
import type { PathRuntime } from "../types";

interface DatabasePragmaOptions {
  simple?: boolean;
}

interface DatabaseStatementLike {
  run(...params: unknown[]): unknown;
}

interface DatabaseConnectionLike {
  close(): void;
  exec(sql: string): unknown;
  pragma(command: string, options?: DatabasePragmaOptions): unknown;
  prepare(sql: string): DatabaseStatementLike;
  transaction<T extends (...args: never[]) => unknown>(callback: T): T;
}

interface SchemaMigration {
  version: number;
  apply(database: DatabaseConnectionLike): void;
}

type BetterSqliteFactory = (filename: string, options?: Record<string, unknown>) => DatabaseConnectionLike;

const createDatabase = require("better-sqlite3") as BetterSqliteFactory;

const schemaMigrations: SchemaMigration[] = [
  {
    version: 1,
    apply(database) {
      database.exec(`
        CREATE TABLE client (
          id TEXT PRIMARY KEY NOT NULL,
          appId TEXT NOT NULL,
          name TEXT DEFAULT NULL,
          \`group\` TEXT DEFAULT NULL,
          \`order\` INTEGER DEFAULT 0,
          topOrder INTEGER DEFAULT -1,
          disabled INTEGER DEFAULT 0,
          userid TEXT DEFAULT NULL,
          username TEXT DEFAULT NULL,
          avatar TEXT DEFAULT NULL,
          transSetting TEXT,
          proxySetting TEXT,
          agentSetting TEXT,
          createTime TEXT NOT NULL
        );
      `);
      database.exec(`
        CREATE TABLE client_group (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          appId TEXT NOT NULL,
          name TEXT NOT NULL,
          remark TEXT DEFAULT NULL
        );
      `);
    },
  },
  {
    version: 2,
    apply(database) {
      database.exec(`
        CREATE TABLE contact (
          id INTEGER NOT NULL,
          appId TEXT NOT NULL,
          account TEXT NOT NULL,
          contactId TEXT NOT NULL,
          nickname TEXT DEFAULT NULL,
          country TEXT DEFAULT NULL,
          gender TEXT DEFAULT NULL,
          level TEXT DEFAULT NULL,
          remark TEXT DEFAULT NULL
        );
        CREATE UNIQUE INDEX uk_contact ON contact(appId, account, contactId);
      `);
      database.exec(`
        CREATE TABLE contact_setting (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          appId TEXT NOT NULL,
          account TEXT NOT NULL,
          contactId TEXT NOT NULL,
          transSetting TEXT
        );
        CREATE UNIQUE INDEX uk_contact_setting ON contact_setting(appId, account, contactId);
      `);
    },
  },
  {
    version: 3,
    apply(database) {
      database.exec(`
        CREATE TABLE quick_reply_group (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL
        );
        CREATE UNIQUE INDEX uk_quick_reply_group_title ON quick_reply_group(title);
      `);
      database.exec(`
        CREATE TABLE quick_reply (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          \`group\` TEXT NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL
        );
      `);
    },
  },
  {
    version: 4,
    apply(database) {
      database.exec("ALTER TABLE client ADD COLUMN website TEXT;");
    },
  },
  {
    version: 5,
    apply(database) {
      database.exec(`
        CREATE TABLE contact_follow_up (
          id TEXT PRIMARY KEY NOT NULL,
          bizId INTEGER NOT NULL,
          appId TEXT NOT NULL,
          account TEXT NOT NULL,
          contactId TEXT NOT NULL,
          content TEXT,
          followUpTime TEXT
        );
      `);
    },
  },
  {
    version: 6,
    apply(database) {
      database.exec(`
        CREATE TABLE mass_send_task (
          id TEXT PRIMARY KEY NOT NULL,
          appId TEXT NOT NULL,
          accounts TEXT NOT NULL,
          contacts TEXT NOT NULL,
          taskName TEXT NOT NULL,
          taskContents TEXT NOT NULL,
          isTransBeforeSend INTEGER DEFAULT 0,
          messageInterval TEXT NOT NULL,
          sessionInterval TEXT NOT NULL,
          taskStatus TEXT NOT NULL,
          totalNum INTEGER DEFAULT 0,
          sentNum INTEGER DEFAULT 0,
          startTime TEXT,
          endTime TEXT,
          errorMsg TEXT
        );
      `);
      database.exec(`
        CREATE TABLE mass_send_task_receiver (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          taskId TEXT NOT NULL,
          appId TEXT NOT NULL,
          clientId TEXT NOT NULL,
          account TEXT NOT NULL,
          contactId TEXT NOT NULL,
          status TEXT NOT NULL,
          startTime TEXT,
          endTime TEXT,
          errorMsg TEXT
        );
      `);
    },
  },
  {
    version: 7,
    apply(database) {
      database.exec("ALTER TABLE mass_send_task ADD COLUMN contactSelectType TEXT;");
    },
  },
  {
    version: 8,
    apply(database) {
      database.exec(`
        CREATE TABLE mass_group_task (
          id TEXT PRIMARY KEY NOT NULL,
          appId TEXT NOT NULL,
          accounts TEXT NOT NULL,
          groupIds TEXT NOT NULL,
          taskType TEXT NOT NULL,
          taskName TEXT,
          joinInterval TEXT NOT NULL,
          cloneNum INTEGER NOT NULL DEFAULT 0,
          cloneInterval TEXT NOT NULL,
          taskStatus TEXT NOT NULL,
          totalNum INTEGER DEFAULT 0,
          doneNum INTEGER DEFAULT 0,
          startTime TEXT,
          endTime TEXT,
          errorMsg TEXT
        );
      `);
      database.exec(`
        CREATE TABLE mass_group_task_item (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          taskId TEXT NOT NULL,
          appId TEXT NOT NULL,
          clientId TEXT NOT NULL,
          account TEXT NOT NULL,
          groupId TEXT NOT NULL,
          status TEXT NOT NULL,
          startTime TEXT,
          endTime TEXT,
          errorMsg TEXT
        );
      `);
    },
  },
];

function getTranslationRecordTableName(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `trans_record_${date.getFullYear()}${month}`;
}

export class DatabaseService {
  constructor(private readonly paths: PathRuntime) {}

  ensureAllDatabases(): void {
    ensureLegacyDatabaseDirs(this.paths);
    this.ensurePrimaryDatabase();
    this.ensureLocalAppDatabase();
  }

  ensurePrimaryDatabase(): void {
    this.withDatabase(getPrimaryDatabasePath(this.paths), (database) => {
      this.updateSchema(database);
    });
  }

  ensureLocalAppDatabase(date = new Date()): void {
    this.withDatabase(getLocalAppDatabasePath(this.paths), (database) => {
      const tableName = getTranslationRecordTableName(date);
      database
        .prepare(
          `
            CREATE TABLE IF NOT EXISTS ${tableName} (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              source TEXT NOT NULL,
              translation TEXT NOT NULL,
              appId TEXT,
              accountId TEXT
            );
          `
        )
        .run();
    });
  }

  private updateSchema(database: DatabaseConnectionLike): void {
    const currentUserVersion = Number(database.pragma("user_version", { simple: true }) ?? 0);
    const mostRecentSchemaVersion = schemaMigrations.length;

    console.log(`updateSchema:\n  Current user_version: ${currentUserVersion};\n  Most recent db schema: ${mostRecentSchemaVersion};\n`);

    if (currentUserVersion > mostRecentSchemaVersion) {
      throw new Error(
        `SQL: User version is ${currentUserVersion} but the expected maximum version is ${mostRecentSchemaVersion}. Did you try to start an old version of App?`
      );
    }

    let version = currentUserVersion;
    for (const migration of schemaMigrations) {
      if (version >= migration.version) {
        continue;
      }

      console.log(`schema update to version ${migration.version}, starting...`);
      const applyMigration = database.transaction(() => {
        migration.apply(database);
        database.pragma(`user_version = ${migration.version}`);
      });
      applyMigration();
      version = migration.version;
      console.log(`schema update to version ${migration.version}, completed.`);
    }
  }

  private withDatabase(databasePath: string, callback: (database: DatabaseConnectionLike) => void): void {
    let database: DatabaseConnectionLike | null = null;

    try {
      database = createDatabase(databasePath);
      if (!database) {
        throw new Error("db is null");
      }

      database.pragma("journal_mode = WAL");
      callback(database);
    } catch (error) {
      const stack = error instanceof Error ? error.stack : String(error);
      console.error("Database startup error:", stack);
      database?.close();
      throw error;
    }

    database.close();
  }
}

export function getCurrentTranslationRecordTableName(date = new Date()): string {
  return getTranslationRecordTableName(date);
}
