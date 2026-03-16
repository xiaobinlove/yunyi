import path from "node:path";
import { ipcMain } from "electron";
import { getPrimaryDatabasePath } from "../runtime/database";
import type { PathRuntime } from "../types";

type PathMethod =
  | "getDbPath"
  | "getPreloadPath"
  | "getUserDataDir"
  | "chooseUserDataDir"
  | "resetUserDataDir"
  | "cleanPartitionsFolders"
  | "getPlatformIsMac";

function createPathHandler(paths: PathRuntime) {
  return (method: PathMethod | string, ...args: unknown[]) => {
    switch (method) {
      case "getDbPath":
        return getPrimaryDatabasePath(paths);
      case "getPreloadPath":
        return path.join(paths.getDistElectronDir(), "recipes.js");
      case "getUserDataDir":
        return paths.getUserDataDir();
      case "chooseUserDataDir":
        return paths.chooseUserDataDir();
      case "resetUserDataDir":
        return paths.resetUserDataDirPreference();
      case "cleanPartitionsFolders":
        return paths.cleanPartitionsFolders((args[0] as string[] | undefined) ?? []);
      case "getPlatformIsMac":
        return process.platform === "darwin";
      default:
        console.warn("path handle event not found:", method, args);
        return null;
    }
  };
}

export function registerPathHandler(paths: PathRuntime): void {
  const handler = createPathHandler(paths);
  ipcMain.removeHandler("path");
  ipcMain.handle("path", (_event, method: string, ...args: unknown[]) => handler(method, ...args));
}
