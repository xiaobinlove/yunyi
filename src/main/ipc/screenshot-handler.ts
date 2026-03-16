import { ipcMain, BrowserWindow } from "electron";
import { ScreenshotService } from "../services/screenshot-service";

type ScreenshotMethod = "startShot" | "registerHotKey" | "startTransShot" | "handleTransShotResult";

function createScreenshotHandler(screenshotService: ScreenshotService) {
  return (senderWindow: BrowserWindow | null, method: ScreenshotMethod | string, ...args: unknown[]) => {
    switch (method) {
      case "startShot":
        return screenshotService.startShot();
      case "registerHotKey":
        return screenshotService.registerHotKey((args[0] ?? {}) as { accelerator?: string; oldAccelerator?: string });
      case "startTransShot":
        return screenshotService.startTransShot(senderWindow, args[0]);
      case "handleTransShotResult":
        return screenshotService.handleTransShotResult(String(args[0] ?? ""));
      default:
        console.warn("screenshot handle event not found:", method, args);
        return null;
    }
  };
}

export function registerScreenshotHandler(screenshotService: ScreenshotService): void {
  const handler = createScreenshotHandler(screenshotService);

  ipcMain.removeHandler("screenshot");
  ipcMain.handle("screenshot", (event, method: string, ...args: unknown[]) => {
    const senderWindow = BrowserWindow.fromWebContents(event.sender);
    return handler(senderWindow, method, ...args);
  });

  ipcMain.removeAllListeners("capture-screen");
  ipcMain.on("capture-screen", (event, payload) => {
    void screenshotService.handleCaptureEvent(event, payload as Record<string, unknown>);
  });

  ipcMain.removeHandler("capture-screen");
  ipcMain.handle("capture-screen", (event, payload) => {
    return screenshotService.handleCaptureInvoke(event, payload as Record<string, unknown>);
  });

  screenshotService.register();
}
