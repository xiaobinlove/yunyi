import fs from "node:fs";
import path from "node:path";
import { format as formatUrl } from "node:url";
import {
  BrowserWindow,
  desktopCapturer,
  dialog,
  globalShortcut,
  screen,
  type Display,
  type IpcMainEvent,
  type IpcMainInvokeEvent,
} from "electron";
import type { PathRuntime } from "../types";

interface ScreenshotHotKeyRequest {
  accelerator?: string;
  oldAccelerator?: string;
}

interface CaptureEventPayload {
  type?: string;
  screenId?: string;
  url?: string;
}

interface CaptureInvokePayload {
  type?: string;
  data?: Electron.SourcesOptions;
}

const ESC_ACCELERATOR = "Esc";

export class ScreenshotService {
  private readonly overlayWindows = new Set<BrowserWindow>();

  constructor(private readonly paths: PathRuntime) {}

  register(): void {
    const accelerator = this.readStoredHotKey();
    if (accelerator) {
      this.registerShortcut(accelerator);
    }
  }

  startShot(): boolean {
    this.openCaptureOverlays();
    return true;
  }

  // Preserve the legacy IPC contract, but disable screenshot translation explicitly.
  startTransShot(_senderWindow?: BrowserWindow | null, _payload?: unknown): boolean {
    return false;
  }

  // Preserve the legacy IPC contract, but disable screenshot translation explicitly.
  handleTransShotResult(_url?: string): boolean {
    return false;
  }

  registerHotKey(request: ScreenshotHotKeyRequest): { success: boolean; code: string } {
    const accelerator = (request.accelerator ?? "").trim();
    const oldAccelerator = (request.oldAccelerator ?? "").trim();

    try {
      if (oldAccelerator) {
        globalShortcut.unregister(oldAccelerator);
      }

      if (!accelerator) {
        this.writeStoredHotKey("");
        return { success: false, code: "cleared" };
      }

      if (globalShortcut.isRegistered(accelerator)) {
        return { success: false, code: "occupy" };
      }

      if (!globalShortcut.register(accelerator, () => this.openCaptureOverlays())) {
        return { success: false, code: "perm" };
      }

      this.writeStoredHotKey(accelerator);
      return { success: true, code: "success" };
    } catch {
      return { success: false, code: "fail" };
    }
  }

  async handleCaptureInvoke(event: IpcMainInvokeEvent, payload: CaptureInvokePayload = {}): Promise<unknown> {
    const senderWindow = BrowserWindow.fromWebContents(event.sender);
    if (!senderWindow || senderWindow.isDestroyed()) {
      return null;
    }

    switch (payload.type ?? "start") {
      case "get-current-screen": {
        const bounds = senderWindow.getBounds();
        return screen
          .getAllDisplays()
          .find((display) => display.bounds.x === bounds.x && display.bounds.y === bounds.y) ?? null;
      }
      case "get-sources":
        return desktopCapturer.getSources(payload.data ?? { types: ["screen"] });
      default:
        return null;
    }
  }

  async handleCaptureEvent(event: IpcMainEvent, payload: CaptureEventPayload = {}): Promise<void> {
    const senderWindow = BrowserWindow.fromWebContents(event.sender);

    switch (payload.type ?? "") {
      case "complete":
        this.closeAllOverlays();
        break;
      case "select":
        this.broadcastToOverlays({ type: "select", screenId: payload.screenId ?? "" });
        break;
      case "save":
        await this.saveCapture(payload.url ?? "");
        this.closeAllOverlays();
        break;
      default:
        if (senderWindow && !senderWindow.isDestroyed()) {
          senderWindow.hide();
        }
        break;
    }
  }

  private openCaptureOverlays(): void {
    this.closeAllOverlays();

    for (const display of screen.getAllDisplays()) {
      this.overlayWindows.add(this.createOverlayWindow(display));
    }

    this.ensureEscShortcut();
  }

  private createOverlayWindow(display: Display): BrowserWindow {
    const overlayWindow = new BrowserWindow({
      fullscreen: false,
      fullscreenable: false,
      width: display.bounds.width,
      height: display.bounds.height,
      x: display.bounds.x,
      y: display.bounds.y,
      transparent: true,
      frame: false,
      movable: false,
      resizable: false,
      hasShadow: false,
      backgroundColor: "#00000000",
      show: true,
      skipTaskbar: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        sandbox: false,
      },
    });

    const captureUrl = formatUrl({
      pathname: this.getCaptureHtmlPath(),
      protocol: "file:",
      slashes: true,
    });

    void overlayWindow.loadURL(captureUrl);
    overlayWindow.setAlwaysOnTop(true, "screen-saver");
    overlayWindow.setVisibleOnAllWorkspaces(true, {
      visibleOnFullScreen: true,
      skipTransformProcessType: true,
    });
    overlayWindow.setFullScreenable(false);

    const cursorPoint = screen.getCursorScreenPoint();
    const inCurrentDisplay =
      cursorPoint.x >= display.bounds.x &&
      cursorPoint.x <= display.bounds.x + display.bounds.width &&
      cursorPoint.y >= display.bounds.y &&
      cursorPoint.y <= display.bounds.y + display.bounds.height;

    if (inCurrentDisplay) {
      overlayWindow.focus();
    } else {
      overlayWindow.blur();
    }

    overlayWindow.on("closed", () => {
      this.overlayWindows.delete(overlayWindow);
      if (this.overlayWindows.size === 0) {
        this.unregisterEscShortcut();
      }
    });

    return overlayWindow;
  }

  private getCaptureHtmlPath(): string {
    return path.join(this.paths.getRootDir(), "capture", "capture.html");
  }

  private broadcastToOverlays(payload: Record<string, unknown>): void {
    for (const overlayWindow of this.overlayWindows) {
      if (!overlayWindow.isDestroyed()) {
        overlayWindow.webContents.send("capture-screen", payload);
      }
    }
  }

  private async saveCapture(dataUrl: string): Promise<void> {
    if (!dataUrl) {
      return;
    }

    const { canceled, filePath } = await dialog.showSaveDialog({
      title: "保存截图",
      defaultPath: "screenshot.png",
      filters: [{ name: "PNG Images", extensions: ["png"] }],
    });

    if (canceled || !filePath) {
      return;
    }

    const base64 = dataUrl.replace(/^data:image\/png;base64,/, "").replace(/^data:image\/jpeg;base64,/, "");
    await fs.promises.writeFile(filePath, base64, "base64");
  }

  private ensureEscShortcut(): void {
    if (!globalShortcut.isRegistered(ESC_ACCELERATOR)) {
      globalShortcut.register(ESC_ACCELERATOR, () => this.closeAllOverlays());
    }
  }

  private unregisterEscShortcut(): void {
    if (globalShortcut.isRegistered(ESC_ACCELERATOR)) {
      globalShortcut.unregister(ESC_ACCELERATOR);
    }
  }

  private registerShortcut(accelerator: string): void {
    try {
      if (!accelerator) {
        return;
      }

      globalShortcut.unregister(accelerator);
      globalShortcut.register(accelerator, () => this.openCaptureOverlays());
    } catch {
      // ignore invalid or unavailable shortcut registrations during boot
    }
  }

  private closeAllOverlays(): void {
    for (const overlayWindow of [...this.overlayWindows]) {
      if (!overlayWindow.isDestroyed()) {
        overlayWindow.close();
      }
    }

    this.overlayWindows.clear();
    this.unregisterEscShortcut();
  }

  private getHotKeyStorePath(): string {
    return this.paths.getUserDataDir("screenshot-shortcut.json");
  }

  private readStoredHotKey(): string {
    try {
      const storePath = this.getHotKeyStorePath();
      if (!fs.existsSync(storePath)) {
        return "";
      }

      const content = JSON.parse(fs.readFileSync(storePath, "utf8")) as { screenshot?: string };
      return typeof content.screenshot === "string" ? content.screenshot : "";
    } catch {
      return "";
    }
  }

  private writeStoredHotKey(accelerator: string): void {
    try {
      const storePath = this.getHotKeyStorePath();
      fs.mkdirSync(path.dirname(storePath), { recursive: true });
      fs.writeFileSync(storePath, JSON.stringify({ screenshot: accelerator }, null, 2), "utf8");
    } catch {
      // ignore shortcut persistence errors
    }
  }
}
