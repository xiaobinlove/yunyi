import path from "node:path";
import fs from "fs-extra";
import { app, dialog } from "electron";
import type { PathRuntime, UserDataDirChoiceResult } from "../types";

const USER_CONFIG_NAME = "userConfig.json";

function getAppDataRoot(): string {
  const appFolder = app.isPackaged ? app.name : `${app.name}Dev`;
  return path.join(app.getPath("appData"), appFolder);
}

export function getRootDir(): string {
  return path.resolve(__dirname, "../../..");
}

export function getDistDir(): string {
  return path.join(getRootDir(), "dist");
}

export function getDistElectronDir(): string {
  return path.join(getRootDir(), "dist-electron");
}

export function getRecipesArchivesDir(): string {
  return path.join(getRootDir(), "recipes", "archives");
}

export function getUserDataDir(...segments: string[]): string {
  return path.join(app.getPath("userData"), ...segments);
}

function getUserConfigPath(): string {
  return path.join(getAppDataRoot(), USER_CONFIG_NAME);
}

function readJsonSafe(filePath: string): Record<string, unknown> {
  return fs.readJsonSync(filePath, { throws: false }) ?? {};
}

export function initializeUserDataPath(): void {
  if (!app.isPackaged) {
    app.setPath("userData", getAppDataRoot());
  }

  const userConfig = readJsonSafe(getUserConfigPath());
  const userDataDir = userConfig.userDataDir;
  if (typeof userDataDir === "string" && userDataDir.length > 0) {
    app.setPath("userData", userDataDir);
  }
}

function persistUserDataDir(userDataDir: string): void {
  const userConfigPath = getUserConfigPath();
  const userConfig = readJsonSafe(userConfigPath);
  userConfig.userDataDir = userDataDir;
  fs.ensureDirSync(path.dirname(userConfigPath));
  fs.writeJsonSync(userConfigPath, userConfig, { spaces: 2 });
}

export function resetUserDataDirPreference(): boolean {
  const userConfigPath = getUserConfigPath();
  if (!fs.existsSync(userConfigPath)) {
    return false;
  }
  fs.removeSync(userConfigPath);
  return true;
}

export async function chooseUserDataDir(): Promise<UserDataDirChoiceResult> {
  const result = await dialog.showOpenDialog({
    title: "选择客户端数据存储目录",
    properties: ["openDirectory", "createDirectory"],
  });

  if (result.canceled) {
    return { canceled: true };
  }

  const selectedPath = result.filePaths[0];
  if (!selectedPath) {
    return { canceled: true };
  }

  const confirmation = await dialog.showMessageBox({
    type: "warning",
    buttons: ["取消", "确定"],
    defaultId: 1,
    cancelId: 0,
    message: `你确定要将数据目录切换到:\n${selectedPath}吗？\n 注意：原目录的数据不会自动迁移，请确保已备份重要数据。`,
  });

  if (confirmation.response !== 1) {
    return { canceled: true };
  }

  persistUserDataDir(selectedPath);
  return { canceled: false, path: selectedPath };
}

export function cleanPartitionsFolders(clientIds: string[] = []): boolean {
  const keepDirectoryNames = clientIds.map((clientId) => `client-${clientId}`);
  const partitionsDir = getUserDataDir("Partitions");

  if (!fs.pathExistsSync(partitionsDir)) {
    return false;
  }

  for (const entry of fs.readdirSync(partitionsDir)) {
    const entryPath = path.join(partitionsDir, entry);
    if (!fs.statSync(entryPath).isDirectory()) {
      continue;
    }
    if (!keepDirectoryNames.includes(entry)) {
      fs.removeSync(entryPath);
    }
  }

  return true;
}

const pathsRuntime: PathRuntime = {
  chooseUserDataDir,
  cleanPartitionsFolders,
  getDistDir,
  getDistElectronDir,
  getRecipesArchivesDir,
  getRootDir,
  getUserDataDir,
  initializeUserDataPath,
  resetUserDataDirPreference,
};

export default pathsRuntime;
