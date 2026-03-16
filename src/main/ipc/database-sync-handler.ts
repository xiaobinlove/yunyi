import { ipcMain, type WebContents } from "electron";
import { RendererDatabaseBridgeService } from "../services/renderer-database-bridge-service";

type DatabaseSyncSuccess = {
  ok: true;
  value: unknown;
};

type DatabaseSyncFailure = {
  ok: false;
  error: {
    message: string;
    stack?: string;
  };
};

function createFailure(error: unknown): DatabaseSyncFailure {
  if (error instanceof Error) {
    return {
      ok: false,
      error: {
        message: error.message,
        stack: error.stack,
      },
    };
  }

  return {
    ok: false,
    error: {
      message: String(error),
    },
  };
}

function trackSenderLifecycle(service: RendererDatabaseBridgeService, sender: WebContents): void {
  const shouldTrack = service.markOwnerTracked(sender.id);
  if (!shouldTrack) {
    return;
  }

  sender.once("destroyed", () => {
    service.closeConnectionsForOwner(sender.id);
  });
}

export function registerDatabaseSyncHandler(service: RendererDatabaseBridgeService): void {
  ipcMain.removeAllListeners("database-sync");
  ipcMain.on("database-sync", (event, payload) => {
    try {
      trackSenderLifecycle(service, event.sender);
      const value = service.handle(event.sender.id, payload);
      const response: DatabaseSyncSuccess = { ok: true, value };
      event.returnValue = response;
    } catch (error) {
      event.returnValue = createFailure(error);
    }
  });
}
