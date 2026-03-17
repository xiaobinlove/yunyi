import type {
  GuestToHostRecipeChannel,
  GuestToHostRecipeMessageMap,
  HostToGuestRecipeChannel,
  HostToGuestRecipeMessageMap,
  RecipeInitPayload,
} from "../../../main/runtime/recipes/contracts";

export const RECIPE_WEBVIEW_GUEST_EVENT = "ipc-message" as const;

export const RECIPE_WEBVIEW_CUSTOM_GUEST_EVENT = "yunyi-ipc-message" as const;

export const RECIPE_WEBVIEW_HOST_CHANNEL = "recipe-message" as const;

export const RECIPE_WEBVIEW_LIFECYCLE_EVENTS = [
  "did-start-loading",
  "did-fail-load",
  "render-process-gone",
  "did-attach",
  "dom-ready",
  "did-stop-loading",
  "did-finish-load",
] as const;

export type RecipeWebviewGuestEventName =
  | typeof RECIPE_WEBVIEW_GUEST_EVENT
  | typeof RECIPE_WEBVIEW_CUSTOM_GUEST_EVENT;

export type RecipeWebviewLifecycleEventName =
  (typeof RECIPE_WEBVIEW_LIFECYCLE_EVENTS)[number];

export interface RecipeWebviewLike {
  send(channel: string, ...args: unknown[]): void;
  addEventListener?(name: string, listener: (event: unknown) => void): void;
  removeEventListener?(name: string, listener: (event: unknown) => void): void;
  getURL?(): string;
  isLoading?(): boolean;
}

export interface RecipeGuestEnvelope<
  Channel extends GuestToHostRecipeChannel = GuestToHostRecipeChannel,
> {
  channel: Channel;
  payload: GuestToHostRecipeMessageMap[Channel];
  rawEvent: unknown;
}

export interface RecipeHostEnvelope<
  Channel extends HostToGuestRecipeChannel = HostToGuestRecipeChannel,
> {
  channel: Channel;
  payload: HostToGuestRecipeMessageMap[Channel];
}

export type RecipeHostCommand =
  | RecipeHostEnvelope<"initialize-recipe">
  | RecipeHostEnvelope<"global-settings-update">
  | RecipeHostEnvelope<"contact-settings-update">
  | RecipeHostEnvelope<"translate-history">
  | RecipeHostEnvelope<"send-text">;

export interface RecipeBridgeSenders {
  initializeRecipe(payload: RecipeInitPayload): void;
  sendGlobalSettingsUpdate(payload: HostToGuestRecipeMessageMap["global-settings-update"]): void;
  sendContactSettingsUpdate(payload: HostToGuestRecipeMessageMap["contact-settings-update"]): void;
  sendTranslateHistory(payload: HostToGuestRecipeMessageMap["translate-history"]): void;
  sendText(payload: HostToGuestRecipeMessageMap["send-text"]): void;
}

export interface NativeRecipeGuestEvent {
  channel?: unknown;
  args?: unknown[];
}

export interface CustomRecipeGuestEventDetail {
  channel?: unknown;
  args?: unknown[];
}

export interface CustomRecipeGuestEvent {
  detail?: CustomRecipeGuestEventDetail;
}
