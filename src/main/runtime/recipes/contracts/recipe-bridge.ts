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
