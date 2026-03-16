import { type App, type BrowserWindow } from "electron";
import type { WindowRegistryLike } from "../types";

const CLOSE_TIMEOUT_MS = 5_000;

function isLegacyCloseHandler(listener: (...args: unknown[]) => void): boolean {
  const source = listener.toString();
  return source.includes("app-before-quit") || source.includes("removeAllListeners(\"close\")") || source.includes("removeAllListeners('close')");
}

export class AppCloseCoordinator {
  private closePending = false;
  private allowImmediateClose = false;
  private closeTimeout: NodeJS.Timeout | null = null;
  private attachedWindow: BrowserWindow | null = null;

  constructor(
    private readonly app: App,
    private readonly windowRegistry: WindowRegistryLike
  ) {}

  install(): void {
    this.app.on("before-quit", () => {
      this.allowImmediateClose = true;
    });

    this.app.on("browser-window-created", (_event, window) => {
      this.tryAttachToMainWindow(window);
    });

    const mainWindow = this.windowRegistry.getMainWindow();
    if (mainWindow) {
      this.tryAttachToMainWindow(mainWindow);
    }
  }

  acknowledgeQuit(): void {
    this.clearCloseTimeout();
    this.allowImmediateClose = true;
    this.closePending = false;

    if (this.attachedWindow && !this.attachedWindow.isDestroyed()) {
      this.attachedWindow.removeListener("close", this.handleWindowClose);
    }

    this.app.quit();
  }

  private tryAttachToMainWindow(window: BrowserWindow): void {
    const mainWindow = this.windowRegistry.getMainWindow();
    if (!mainWindow || window !== mainWindow || this.attachedWindow === window) {
      return;
    }

    for (const listener of window.listeners("close")) {
      if (listener === this.handleWindowClose) {
        continue;
      }

      if (isLegacyCloseHandler(listener)) {
        window.removeListener("close", listener);
      }
    }

    window.on("close", this.handleWindowClose);
    this.attachedWindow = window;
  }

  private readonly handleWindowClose = (event: Electron.Event): void => {
    if (this.allowImmediateClose) {
      return;
    }

    event.preventDefault();

    if (this.closePending) {
      return;
    }

    this.closePending = true;

    const mainWindow = this.windowRegistry.getMainWindow();
    try {
      if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isDestroyed() && !mainWindow.webContents.isCrashed()) {
        mainWindow.webContents.send("main-process-message", "app-before-quit");
      } else {
        this.forceExit();
        return;
      }
    } catch (error) {
      console.warn("[Main] 渲染进程不可用，直接退出", error);
      this.forceExit();
      return;
    }

    if (!this.closeTimeout) {
      this.closeTimeout = setTimeout(() => {
        this.forceExit();
      }, CLOSE_TIMEOUT_MS);
    }
  };

  private forceExit(): void {
    this.clearCloseTimeout();
    this.allowImmediateClose = true;
    this.closePending = false;

    if (this.attachedWindow && !this.attachedWindow.isDestroyed()) {
      this.attachedWindow.removeListener("close", this.handleWindowClose);
    }

    this.app.exit(0);
  }

  private clearCloseTimeout(): void {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
  }
}
