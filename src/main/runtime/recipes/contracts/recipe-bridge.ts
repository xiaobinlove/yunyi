import type { RecipeInitPayload } from "./recipe-init-payload";

export interface HostToGuestRecipeMessageMap {
  "initialize-recipe": RecipeInitPayload;
  "global-settings-update": Record<string, unknown>;
  "contact-settings-update": Record<string, unknown>;
  "translate-history": Record<string, unknown>;
  "send-text": Record<string, unknown>;
}

export interface GuestToHostRecipeMessageMap {
  ready: undefined;
  "set-client-account": Record<string, unknown>;
  "set-contact": Record<string, unknown>;
  "set-contact-list": Record<string, unknown>;
  "set-unread-count": Record<string, unknown>;
  "set-online-state": Record<string, unknown>;
  "message-changed": Record<string, unknown>;
  "message-send-success": Record<string, unknown>;
  "inject-js-unsafe": string[];
}

export type HostToGuestRecipeChannel = keyof HostToGuestRecipeMessageMap;

export type GuestToHostRecipeChannel = keyof GuestToHostRecipeMessageMap;

export const HOST_TO_GUEST_RECIPE_CHANNELS: readonly HostToGuestRecipeChannel[] = [
  "initialize-recipe",
  "global-settings-update",
  "contact-settings-update",
  "translate-history",
  "send-text",
];

export const GUEST_TO_HOST_RECIPE_CHANNELS: readonly GuestToHostRecipeChannel[] = [
  "ready",
  "set-client-account",
  "set-contact",
  "set-contact-list",
  "set-unread-count",
  "set-online-state",
  "message-changed",
  "message-send-success",
  "inject-js-unsafe",
];
