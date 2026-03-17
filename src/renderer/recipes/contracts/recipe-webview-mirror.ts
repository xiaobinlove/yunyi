import type {
  RecipeGuestEnvelope,
  RecipeWebviewLifecycleEventName,
  RecipeWebviewLike,
} from "./recipe-webview-bridge";
import type { RecipeBridgeController } from "./recipe-webview-controller";

export interface RecipeWebviewMirrorLifecyclePayload {
  url?: string;
  loading?: boolean;
  error?: string;
}

export interface RecipeWebviewMirrorOptions {
  webview: RecipeWebviewLike;
  controller: RecipeBridgeController;
  onGuestEnvelope?(envelope: RecipeGuestEnvelope): void;
}

export interface RecipeWebviewMirrorBinding {
  readonly webview: RecipeWebviewLike;
  readonly controller: RecipeBridgeController;
  detach(): void;
}

export type RecipeWebviewLifecycleListener = (
  eventName: RecipeWebviewLifecycleEventName,
  payload: RecipeWebviewMirrorLifecyclePayload,
  rawEvent: unknown,
) => void;
