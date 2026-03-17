import type { RecipeCapabilities, RecipeInitPayload, RecipeRuntimeConfig } from "../../contracts";

const WHATSAPP_CAPABILITIES: RecipeCapabilities = {
  liveTranslation: true,
  historyTranslation: true,
  originalEcho: true,
  messageSend: true,
  contactSync: true,
  unreadSync: true,
  massSend: true,
};

export const WHATSAPP_LEGACY_RUNTIME_CONFIG_OVERRIDES = {
  main: "#main",
  friendList: "#pane-side",
  otherfriendLists:
    "#pane-side [role='gridcell'],#pane-side ._ak8o[role='gridcell'],#pane-side [data-testid='cell-frame-container']",
  friendListDown: "#pane-side",
  allMsg:
    "._akbu,[data-testid='msg-text'],span.selectable-text.copyable-text,p.copyable-text",
  isObserverSubTree: true,
  chatDelay: 150,
  initChatDelay: 150,
} as const;

export function buildWhatsAppRecipeRuntimeConfig(_payload: RecipeInitPayload): RecipeRuntimeConfig {
  return {
    selectors: {
      appRoot: "#main",
      chatRoot: "#main",
      sidebarRoot: "#pane-side",
      messageItems: "._akbu,[data-testid='msg-text'],span.selectable-text.copyable-text,p.copyable-text",
    },
    observer: {
      subtree: true,
      historyScanDelayMs: 150,
      liveScanDelayMs: 150,
    },
    capabilities: WHATSAPP_CAPABILITIES,
    legacyConfig: {
      ...WHATSAPP_LEGACY_RUNTIME_CONFIG_OVERRIDES,
    },
  };
}
