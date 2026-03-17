import type { RecipeInitPayload } from "../../../main/runtime/recipes/contracts";
import type { RecipeGuestEnvelope, RecipeWebviewLike } from "./recipe-webview-bridge";
import type { RecipeBridgeController } from "./recipe-webview-controller";
import type { RecipeWebviewMirrorBinding } from "./recipe-webview-mirror";
import type { RecipeBridgeOrchestrator } from "./recipe-webview-orchestrator";
import type { RecipeSessionSnapshot, RecipeSessionStore } from "./recipe-webview-session";

export interface RecipeRendererShadowRuntimeOptions {
  getInitializePayload: () => RecipeInitPayload | null;
  setLoading?(loading: boolean): void;
  onInitializeError?(error: unknown): void;
  onGuestEnvelope?(envelope: RecipeGuestEnvelope): void;
  onSnapshot?(snapshot: RecipeSessionSnapshot): void;
  initializeDelayMs?: number;
  now?: () => number;
}

export interface RecipeRendererShadowRuntime {
  readonly store: RecipeSessionStore;
  readonly controller: RecipeBridgeController;
  readonly orchestrator: RecipeBridgeOrchestrator;
  mountWebview(webview: RecipeWebviewLike): RecipeWebviewMirrorBinding;
  unmountWebview(): void;
  getSnapshot(): RecipeSessionSnapshot;
  subscribe(listener: (snapshot: RecipeSessionSnapshot) => void): () => void;
  destroy(): void;
}
