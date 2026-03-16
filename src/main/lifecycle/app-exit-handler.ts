import { ipcMain, type App } from "electron";
import type { WindowRegistryLike } from "../types";

export function registerAppExitHandler(app: App, windowRegistry: WindowRegistryLike): void {
  ipcMain.removeAllListeners("app-quit-ok");
  ipcMain.on("app-quit-ok", () => {
    const mainWindow = windowRegistry.getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.removeAllListeners("close");
    }

    app.quit();
  });
}
