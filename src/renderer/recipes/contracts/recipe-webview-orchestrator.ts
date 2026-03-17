import type { RecipeInitPayload } from "../../../main/runtime/recipes/contracts";
import type { RecipeGuestEnvelope, RecipeWebviewLifecycleEventName } from "./recipe-webview-bridge";
import type { RecipeBridgeController } from "./recipe-webview-controller";
import type { RecipeWebviewMirrorLifecyclePayload } from "./recipe-webview-mirror";
import type { RecipeSessionSnapshot } from "./recipe-webview-session";

export interface RecipeBridgeOrchestratorOptions {
  controller: RecipeBridgeController;
  getInitializePayload: () => RecipeInitPayload | null;
  initializeDelayMs?: number;
  now?: () => number;
  setLoading?(loading: boolean): void;
  onInitializeError?(error: unknown): void;
}

export interface RecipeBridgeOrchestrator {
  readonly controller: RecipeBridgeController;
  handleLifecycle(
    eventName: RecipeWebviewLifecycleEventName,
    payload?: RecipeWebviewMirrorLifecyclePayload,
  ): void;
  handleGuestEnvelope(envelope: RecipeGuestEnvelope): void;
  ensureRecipeInitialized(): boolean;
  getSnapshot(): RecipeSessionSnapshot;
  dispose(): void;
}
