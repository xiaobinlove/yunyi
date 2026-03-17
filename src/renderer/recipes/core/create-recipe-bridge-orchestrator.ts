import type { GuestToHostRecipeChannel } from "../../../main/runtime/recipes/contracts";
import type { RecipeGuestEnvelope, RecipeWebviewLifecycleEventName } from "../contracts/recipe-webview-bridge";
import type {
  RecipeBridgeOrchestrator,
  RecipeBridgeOrchestratorOptions,
} from "../contracts/recipe-webview-orchestrator";
import type { RecipeWebviewMirrorLifecyclePayload } from "../contracts/recipe-webview-mirror";

function isInitializeTriggerChannel(channel: GuestToHostRecipeChannel): boolean {
  return channel === "ready";
}

export function createRecipeBridgeOrchestrator(
  options: RecipeBridgeOrchestratorOptions,
): RecipeBridgeOrchestrator {
  const delayMs = options.initializeDelayMs ?? 150;
  const now = options.now ?? Date.now;
  let initializeTimer: ReturnType<typeof setTimeout> | null = null;

  const clearInitializeTimer = () => {
    if (initializeTimer !== null) {
      clearTimeout(initializeTimer);
      initializeTimer = null;
    }
  };

  const scheduleInitializeFallback = () => {
    clearInitializeTimer();
    initializeTimer = setTimeout(() => {
      const snapshot = options.controller.getSnapshot();
      if (!snapshot.initialization.readyReceived) {
        orchestrator.ensureRecipeInitialized();
      }
    }, delayMs);
  };

  const orchestrator: RecipeBridgeOrchestrator = {
    controller: options.controller,
    handleLifecycle(eventName: RecipeWebviewLifecycleEventName, payload?: RecipeWebviewMirrorLifecyclePayload) {
      options.controller.handleWebviewLifecycle(eventName, payload);

      if (eventName === "did-start-loading") {
        clearInitializeTimer();
        options.setLoading?.(true);
        return;
      }

      if (eventName === "dom-ready") {
        options.setLoading?.(false);
        scheduleInitializeFallback();
        return;
      }

      if (eventName === "did-stop-loading" || eventName === "did-finish-load") {
        options.setLoading?.(false);
      }
    },
    handleGuestEnvelope(envelope: RecipeGuestEnvelope) {
      if (isInitializeTriggerChannel(envelope.channel)) {
        clearInitializeTimer();
        orchestrator.ensureRecipeInitialized();
      }
    },
    ensureRecipeInitialized() {
      const snapshot = options.controller.getSnapshot();
      if (snapshot.initialization.initialized) {
        return false;
      }

      try {
        const payload = options.getInitializePayload();
        if (!payload) {
          options.controller.store.patch({
            lastError: "initialize payload unavailable",
          });
          return false;
        }

        options.controller.initializeRecipe(payload);
        options.controller.store.patch({
          initialization: {
            lastInitializeAt: now(),
          },
          lastError: null,
        });
        return true;
      } catch (error) {
        options.controller.store.patch({
          lastError: error instanceof Error ? error.message : String(error),
        });
        options.onInitializeError?.(error);
        return false;
      }
    },
    getSnapshot() {
      return options.controller.getSnapshot();
    },
    dispose() {
      clearInitializeTimer();
    },
  };

  return orchestrator;
}
