export interface SqlitePragmaOptions {
  simple?: boolean;
}

export interface SqliteReadStatement<Row = unknown> {
  get(...params: unknown[]): Row | undefined;
  all(...params: unknown[]): Row[];
}

export interface SqliteStatement<Row = unknown> extends SqliteReadStatement<Row> {
  run(...params: unknown[]): unknown;
  pluck(toggle?: boolean): SqliteReadStatement;
}

export interface SqliteDatabase {
  close(): void;
  exec(sql: string): unknown;
  pragma(command: string, options?: SqlitePragmaOptions): unknown;
  prepare<Row = unknown>(sql: string): SqliteStatement<Row>;
  transaction<T extends (...args: never[]) => unknown>(callback: T): T;
}

type BetterSqliteFactory = (filename: string, options?: Record<string, unknown>) => SqliteDatabase;

const createDatabase = require("better-sqlite3") as BetterSqliteFactory;

export function openSqliteDatabase(filename: string, options?: Record<string, unknown>): SqliteDatabase {
  return createDatabase(filename, options);
}
