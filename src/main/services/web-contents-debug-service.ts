import { app, type App, type WebContents, webContents } from "electron";

const DEBUG_PREFIXES = ["[yunyi-whatsapp-send]", "[yunyi-whatsapp-host]"];
const DEBUG_KEYWORDS = [
  'Send "ready" to host',
  "initialize-recipe",
  "Initialize Recipe",
  "Recipe initialization failed",
  "翻译插件初始化完成。",
  "ipc-message",
];
const ATTACH_MARK = Symbol.for("yunyi.webContentsDebugAttached");

function shouldForwardConsoleMessage(message: string): boolean {
  return (
    DEBUG_PREFIXES.some((prefix) => message.includes(prefix)) ||
    DEBUG_KEYWORDS.some((keyword) => message.includes(keyword))
  );
}

function formatConsoleMessage(sourceId: string, level: number, message: string): string {
  return `[webcontents:${sourceId}:level-${level}] ${message}`;
}

export class WebContentsDebugService {
  private installed = false;

  constructor(private readonly electronApp: App) {}

  install(): void {
    if (this.installed) {
      return;
    }

    for (const contents of webContents.getAllWebContents()) {
      this.attachConsoleForwarding(contents);
    }

    this.electronApp.on("web-contents-created", (_event, contents) => {
      this.attachConsoleForwarding(contents);
    });
    this.installed = true;
  }

  private attachConsoleForwarding(contents: WebContents): void {
    const state = contents as WebContents & Record<PropertyKey, unknown>;
    if (state[ATTACH_MARK]) {
      return;
    }

    contents.on("console-message", (_event, level, message, line, sourceId) => {
      if (!shouldForwardConsoleMessage(message)) {
        return;
      }

      console.log(formatConsoleMessage(sourceId || `${contents.id}:${line}`, level, message));
    });

    state[ATTACH_MARK] = true;
  }
}
