import { ipcRenderer } from "electron";

type DatabaseSyncPayload =
  | {
      action: "connection:open";
      databasePath: string;
      options?: Record<string, unknown>;
    }
  | {
      action: "connection:close";
      connectionId: number;
    }
  | {
      action: "connection:exec";
      connectionId: number;
      sql: string;
    }
  | {
      action: "connection:pragma";
      connectionId: number;
      command: string;
      options?: Record<string, unknown>;
    }
  | {
      action: "statement:run" | "statement:all" | "statement:get";
      connectionId: number;
      sql: string;
      params?: unknown[];
      pluck?: boolean;
    }
  | {
      action: "transaction:begin" | "transaction:commit" | "transaction:rollback";
      connectionId: number;
    };

type DatabaseSyncResponse =
  | {
      ok: true;
      value: unknown;
    }
  | {
      ok: false;
      error: {
        message: string;
        stack?: string;
      };
    };

type ModuleLoad = (request: string, parent: unknown, isMain: boolean) => unknown;

const PRELOAD_BRIDGE_MARK = Symbol.for("yunyi.preload.databaseBridgeInstalled");
const WEBVIEW_SEND_PATCH_MARK = Symbol.for("yunyi.preload.webviewSendPatchInstalled");
const globalState = globalThis as Record<PropertyKey, unknown>;

function sendDatabaseSync(payload: DatabaseSyncPayload): unknown {
  const response = ipcRenderer.sendSync("database-sync", payload) as DatabaseSyncResponse;
  if (response.ok) {
    return response.value;
  }

  const error = new Error(response.error.message);
  if (response.error.stack) {
    error.stack = response.error.stack;
  }
  throw error;
}

class BetterSqliteStatementProxy {
  constructor(
    private readonly connectionId: number,
    private readonly sql: string,
    private readonly pluckMode = false
  ) {}

  run(...params: unknown[]): unknown {
    return sendDatabaseSync({
      action: "statement:run",
      connectionId: this.connectionId,
      sql: this.sql,
      params,
      pluck: this.pluckMode,
    });
  }

  all(...params: unknown[]): unknown[] {
    return sendDatabaseSync({
      action: "statement:all",
      connectionId: this.connectionId,
      sql: this.sql,
      params,
      pluck: this.pluckMode,
    }) as unknown[];
  }

  get(...params: unknown[]): unknown {
    return sendDatabaseSync({
      action: "statement:get",
      connectionId: this.connectionId,
      sql: this.sql,
      params,
      pluck: this.pluckMode,
    });
  }

  pluck(toggle = true): BetterSqliteStatementProxy {
    return new BetterSqliteStatementProxy(this.connectionId, this.sql, toggle);
  }
}

class BetterSqliteConnectionProxy {
  private readonly connectionId: number;

  constructor(databasePath: string, options?: Record<string, unknown>) {
    this.connectionId = Number(
      sendDatabaseSync({
        action: "connection:open",
        databasePath,
        options,
      })
    );
  }

  close(): void {
    sendDatabaseSync({
      action: "connection:close",
      connectionId: this.connectionId,
    });
  }

  exec(sql: string): unknown {
    return sendDatabaseSync({
      action: "connection:exec",
      connectionId: this.connectionId,
      sql,
    });
  }

  pragma(command: string, options?: Record<string, unknown>): unknown {
    return sendDatabaseSync({
      action: "connection:pragma",
      connectionId: this.connectionId,
      command,
      options,
    });
  }

  prepare(sql: string): BetterSqliteStatementProxy {
    return new BetterSqliteStatementProxy(this.connectionId, sql);
  }

  transaction<T extends (...args: never[]) => unknown>(callback: T): T {
    const connectionId = this.connectionId;
    return ((...args: never[]) => {
      sendDatabaseSync({ action: "transaction:begin", connectionId });
      try {
        const result = callback(...args);
        sendDatabaseSync({ action: "transaction:commit", connectionId });
        return result;
      } catch (error) {
        try {
          sendDatabaseSync({ action: "transaction:rollback", connectionId });
        } catch {
          // Ignore rollback failures and surface the original error instead.
        }
        throw error;
      }
    }) as T;
  }
}

function createBetterSqliteBridge() {
  return (databasePath: string, options?: Record<string, unknown>) =>
    new BetterSqliteConnectionProxy(databasePath, options);
}

function installBetterSqliteBridge(): void {
  const moduleApi = require("node:module") as { _load: ModuleLoad };
  const originalLoad = moduleApi._load;
  const betterSqliteBridge = createBetterSqliteBridge();

  moduleApi._load = function patchedLoad(request: string, parent: unknown, isMain: boolean): unknown {
    if (request === "better-sqlite3") {
      return betterSqliteBridge;
    }

    return originalLoad.call(this, request, parent, isMain);
  };
}

function normalizeContactId(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  const record = value as Record<string, unknown>;
  const candidates = [
    record.contact,
    record.phoneNumber,
    record.contactId,
    record.contactID,
    record.id,
    record._serialized,
    record.user,
    record.wid,
    record.jid,
    record.remote,
    record.chatId,
    record.participant,
    record.value,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeContactId(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return "";
}

function detectContactType(target: Record<string, unknown>, contactId: string): string {
  const explicitType = target.type ?? target.contactType ?? target.chatType ?? target.messageType;
  if (typeof explicitType === "string" && explicitType.trim()) {
    return explicitType;
  }

  if (
    target.isGroup === true ||
    contactId.includes("@g.us") ||
    /-\d+$/.test(contactId)
  ) {
    return "group";
  }

  return "chat";
}

function normalizeMassSendContact(target: unknown): unknown {
  const contactId = normalizeContactId(target);
  if (!contactId) {
    return target;
  }

  if (!target || typeof target !== "object") {
    return {
      contactId,
      type: detectContactType({}, contactId),
    };
  }

  const contact = target as Record<string, unknown>;
  return {
    ...contact,
    contactId,
    type: contact.type ?? detectContactType(contact, contactId),
  };
}

function normalizeSendContactMessagePayload(payload: unknown): unknown {
  if (!payload || typeof payload !== "object") {
    return payload;
  }

  const message = payload as Record<string, unknown>;
  const chatId = normalizeContactId(message.chatId);
  if (!chatId) {
    return payload;
  }

  return {
    ...message,
    chatId,
    chatType:
      message.chatType ??
      detectContactType(message, chatId),
  };
}

function safeSerialize(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function emitDebugLog(label: string, payload?: unknown): void {
  ipcRenderer.send("yunyi-debug-log", {
    label,
    payload: payload === undefined ? undefined : safeSerialize(payload),
  });
}

function installWebviewSendPatch(): void {
  const runtime = globalThis as Record<string, unknown> & {
    document?: {
      querySelector(selector: string): unknown;
      documentElement?: unknown;
      createElement(tagName: string): unknown;
    };
    MutationObserver?: new (callback: () => void) => {
      observe(target: unknown, options: Record<string, unknown>): void;
      disconnect(): void;
    };
    setInterval(handler: () => void, timeout?: number): ReturnType<typeof setInterval>;
    clearInterval(handle: ReturnType<typeof setInterval>): void;
    setTimeout(handler: () => void, timeout?: number): ReturnType<typeof setTimeout>;
  };
  const runtimeState = runtime as Record<PropertyKey, unknown>;

  if (runtimeState[WEBVIEW_SEND_PATCH_MARK]) {
    return;
  }

  const tryPatch = (): boolean => {
    const documentRef = runtime.document;
    if (!documentRef) {
      return false;
    }

    const webviewElement = documentRef.querySelector("webview") ?? documentRef.createElement("webview");
    const prototypeRef = webviewElement ? Object.getPrototypeOf(webviewElement) : null;
    if (!prototypeRef || typeof prototypeRef.send !== "function" || prototypeRef.__yunyiWebviewSendPatched) {
      return false;
    }

    const originalSend = prototypeRef.send as (channel: string, ...args: unknown[]) => unknown;
    const patchedSend = function patchedWebviewSend(
      this: unknown,
      channel: string,
      ...args: unknown[]
    ): unknown {
      if (channel === "recipe-message" && typeof args[0] === "string") {
        if (args[0] === "mass-send-message" && Array.isArray(args[2])) {
          args[2] = args[2].map((contact) => normalizeMassSendContact(contact));
          emitDebugLog("mass-send-message", args[2]);
        } else if (args[0] === "send-contact-message") {
          args[1] = normalizeSendContactMessagePayload(args[1]);
          emitDebugLog("send-contact-message", args[1]);
        }
      }

      return originalSend.call(this, channel, ...args);
    };

    Object.defineProperty(patchedSend, "__yunyiWebviewSendPatched", {
      configurable: false,
      enumerable: false,
      value: true,
      writable: false,
    });

    prototypeRef.send = patchedSend;
    emitDebugLog("patched webview.send");
    return true;
  };

  if (tryPatch()) {
    runtimeState[WEBVIEW_SEND_PATCH_MARK] = true;
    return;
  }

  let intervalHandle: ReturnType<typeof setInterval> | null = null;
  const observer = runtime.MutationObserver
    ? new runtime.MutationObserver(() => {
        if (tryPatch()) {
          observer?.disconnect();
          if (intervalHandle) {
            runtime.clearInterval(intervalHandle);
          }
          runtimeState[WEBVIEW_SEND_PATCH_MARK] = true;
        }
      })
    : null;

  if (observer && runtime.document?.documentElement) {
    observer.observe(runtime.document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  intervalHandle = runtime.setInterval(() => {
    if (tryPatch()) {
      if (observer) {
        observer.disconnect();
      }
      if (intervalHandle) {
        runtime.clearInterval(intervalHandle);
      }
      runtimeState[WEBVIEW_SEND_PATCH_MARK] = true;
    }
  }, 200);

  runtime.setTimeout(() => {
    if (observer) {
      observer.disconnect();
    }
    if (intervalHandle) {
      runtime.clearInterval(intervalHandle);
    }
    if (!runtimeState[WEBVIEW_SEND_PATCH_MARK]) {
      emitDebugLog("webview.send patch timeout");
    }
  }, 30000);
}

if (!globalState[PRELOAD_BRIDGE_MARK]) {
  installBetterSqliteBridge();
  installWebviewSendPatch();
  globalState[PRELOAD_BRIDGE_MARK] = true;
}
