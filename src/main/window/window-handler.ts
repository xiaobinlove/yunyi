import os from "node:os";
import { app, ipcMain, nativeTheme, type BrowserWindow } from "electron";
import type { WindowRegistryLike } from "../types";

type WindowMethod =
  | "isMaximize"
  | "getUserAgent"
  | "getAppVersion"
  | "maximize"
  | "unmaximize"
  | "minimize"
  | "close"
  | "relaunch"
  | "toggleDarkMode"
  | "setAppBadge";

const DARWIN_MAJOR_TO_MACOS_VERSION: Record<number, string> = {
  25: "16.0.0",
  24: "15.0.0",
  23: "14.0.0",
  22: "13.0.0",
  21: "12.0.0",
  20: "11.0.0",
  19: "10.15.0",
  18: "10.14.0",
  17: "10.13.0",
};

function normalizeChromeVersion(version: string): string {
  const parts = version.split(".");
  while (parts.length < 4) {
    parts.push("0");
  }
  return parts.slice(0, 4).join(".");
}

function getMacOsPlatform(): string {
  const processWithSystemVersion = process as NodeJS.Process & {
    getSystemVersion?: () => string;
  };

  let systemVersion = "";
  try {
    systemVersion = processWithSystemVersion.getSystemVersion?.() ?? "";
  } catch {
    systemVersion = "";
  }

  if (!systemVersion) {
    const darwinMajor = Number.parseInt(os.release().split(".")[0] ?? "", 10);
    systemVersion =
      DARWIN_MAJOR_TO_MACOS_VERSION[darwinMajor] ??
      `${Number.isNaN(darwinMajor) ? 14 : darwinMajor}.0.0`;
  }

  let cpuBrand = (os.cpus()[0]?.model ?? "").split(" ")[0] ?? "Intel";
  if (/Apple/i.test(cpuBrand)) {
    cpuBrand = "Apple";
  } else if (/Intel/i.test(cpuBrand)) {
    cpuBrand = "Intel";
  }

  return `Macintosh; ${cpuBrand} Mac OS X ${systemVersion.replace(/\./g, "_")}`;
}

function getWindowsPlatform(): string {
  const [major = "10", minor = "0"] = os.release().split(".");
  const archToken = process.arch === "x64" || process.arch === "arm64" ? "Win64" : "Win32";
  return `Windows NT ${major}.${minor}; ${archToken}; ${process.arch}`;
}

function getLinuxPlatform(): string {
  const archToken = process.arch === "x64" || process.arch === "arm64" ? "x86_64" : process.arch;
  return `X11; Linux ${archToken}`;
}

function getDesktopPlatform(): string {
  if (process.platform === "win32") {
    return getWindowsPlatform();
  }

  if (process.platform === "darwin") {
    return getMacOsPlatform();
  }

  return getLinuxPlatform();
}

function buildUserAgent(): string {
  const chromeVersion = normalizeChromeVersion(process.versions.chrome || "120.0.0.0");
  return `Mozilla/5.0 (${getDesktopPlatform()}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
}

function reloadOrRelaunch(window: BrowserWindow | null): void {
  if (!app.isPackaged && window && !window.isDestroyed()) {
    window.reload();
    return;
  }

  app.exit();
  app.relaunch();
}

function toggleDarkMode(): boolean {
  nativeTheme.themeSource = nativeTheme.shouldUseDarkColors ? "light" : "dark";
  return nativeTheme.shouldUseDarkColors;
}

function updateBadge(windowRegistry: WindowRegistryLike, count: unknown): void {
  const mainWindow = windowRegistry.getMainWindow();
  const tray = windowRegistry.getPrimaryTray();
  const normalizedCount = Math.max(Number(count) || 0, 0);

  windowRegistry.setBadgeCount(normalizedCount);

  if (process.platform === "darwin") {
    app.setBadgeCount(normalizedCount);
  } else if (process.platform === "win32" && mainWindow) {
    if (normalizedCount > 0) {
      const taskbarIcon = windowRegistry.createTaskbarIcon(
        `taskbar-${normalizedCount >= 10 ? 10 : normalizedCount}`
      );
      mainWindow.setOverlayIcon(taskbarIcon, "");
    } else {
      mainWindow.setOverlayIcon(null, "");
    }
  }

  if (tray) {
    tray.setImage(windowRegistry.createTrayIcon(normalizedCount > 0 ? "tray-unread" : "tray"));
  }

  if (mainWindow && !mainWindow.isFocused() && normalizedCount > 0) {
    if (process.platform === "darwin") {
      app.dock.bounce("informational");
    } else if (process.platform === "win32") {
      mainWindow.flashFrame(true);
      mainWindow.once("focus", () => mainWindow.flashFrame(false));
    }
  }
}

function createWindowHandleHandler(windowRegistry: WindowRegistryLike) {
  return (method: WindowMethod | string) => {
    const mainWindow = windowRegistry.getMainWindow();

    switch (method) {
      case "isMaximize":
        return mainWindow ? mainWindow.isMaximized() : false;
      case "getUserAgent":
        return buildUserAgent();
      case "getAppVersion":
        return app.getVersion();
      default:
        console.warn("window handle event not found:", method);
        return null;
    }
  };
}

function createWindowEventHandler(windowRegistry: WindowRegistryLike) {
  return (method: WindowMethod | string, ...args: unknown[]) => {
    const mainWindow = windowRegistry.getMainWindow();

    switch (method) {
      case "maximize":
        mainWindow?.maximize();
        break;
      case "unmaximize":
        mainWindow?.unmaximize();
        break;
      case "minimize":
        mainWindow?.minimize();
        break;
      case "close":
        mainWindow?.close();
        break;
      case "relaunch":
        reloadOrRelaunch(mainWindow);
        break;
      case "toggleDarkMode":
        toggleDarkMode();
        break;
      case "setAppBadge":
        updateBadge(windowRegistry, args[0]);
        break;
      default:
        console.warn("window on event not found:", method, args);
        break;
    }
  };
}

export function registerWindowHandlers(windowRegistry: WindowRegistryLike): void {
  const handleHandler = createWindowHandleHandler(windowRegistry);
  const eventHandler = createWindowEventHandler(windowRegistry);

  ipcMain.removeHandler("window");
  ipcMain.handle("window", (_event, method: string) => handleHandler(method));
  ipcMain.removeAllListeners("window");
  ipcMain.on("window", (_event, method: string, ...args: unknown[]) => eventHandler(method, ...args));

  app.on("browser-window-created", (_event, window) => {
    window.on("focus", () => {
      setTimeout(() => {
        updateBadge(windowRegistry, windowRegistry.getBadgeCount());
      }, 100);
    });
  });
}
