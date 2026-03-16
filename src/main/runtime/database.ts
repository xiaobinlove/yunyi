import fs from "fs-extra";
import type { PathRuntime } from "../types";

export function getPrimaryDatabasePath(paths: PathRuntime): string {
  return paths.getUserDataDir("data", "foobar.db");
}

export function getLocalAppDatabasePath(paths: PathRuntime): string {
  return paths.getUserDataDir("local", "app.db");
}

export function ensureLegacyDatabaseDirs(paths: PathRuntime): void {
  fs.ensureDirSync(paths.getUserDataDir("data"));
  fs.ensureDirSync(paths.getUserDataDir("local"));
}
