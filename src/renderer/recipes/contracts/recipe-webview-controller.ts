import type {
  GuestToHostRecipeChannel,
  GuestToHostRecipeMessageMap,
  HostToGuestRecipeChannel,
  HostToGuestRecipeMessageMap,
} from "../../../main/runtime/recipes/contracts";
import type {
  RecipeBridgeSenders,
  RecipeGuestEnvelope,
  RecipeWebviewLifecycleEventName,
  RecipeWebviewLike,
} from "./recipe-webview-bridge";
import type { RecipeWebviewMirrorLifecyclePayload } from "./recipe-webview-mirror";
import type { RecipeSessionSnapshot, RecipeSessionStore } from "./recipe-webview-session";

export interface RecipeBridgeControllerOptions {
  store: RecipeSessionStore;
  now?: () => number;
}

export interface RecipeBridgeController extends RecipeBridgeSenders {
  readonly store: RecipeSessionStore;
  attachWebview(webview: RecipeWebviewLike): void;
  detachWebview(): void;
  handleWebviewLifecycle(
    eventName: RecipeWebviewLifecycleEventName,
    state?: RecipeWebviewMirrorLifecyclePayload,
  ): void;
  handleGuestEvent(event: unknown): RecipeGuestEnvelope | null;
  handleGuestMessage<Channel extends GuestToHostRecipeChannel>(
    channel: Channel,
    payload: GuestToHostRecipeMessageMap[Channel],
  ): void;
  dispatchHostMessage<Channel extends HostToGuestRecipeChannel>(
    channel: Channel,
    payload: HostToGuestRecipeMessageMap[Channel],
  ): void;
  getSnapshot(): RecipeSessionSnapshot;
}
