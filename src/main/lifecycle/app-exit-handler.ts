import { ipcMain, type App } from "electron";
import type { WindowRegistryLike } from "../types";
import { AppCloseCoordinator } from "./app-close-coordinator";

export function registerAppExitHandler(app: App, windowRegistry: WindowRegistryLike): void {
  const coordinator = new AppCloseCoordinator(app, windowRegistry);
  coordinator.install();

  ipcMain.removeAllListeners("app-quit-ok");
  ipcMain.on("app-quit-ok", () => {
    coordinator.acknowledgeQuit();
  });
}
