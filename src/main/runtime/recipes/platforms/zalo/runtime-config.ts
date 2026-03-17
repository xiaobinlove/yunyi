import type { RecipeCapabilities, RecipeInitPayload, RecipeRuntimeConfig } from "../../contracts";

const ZALO_CAPABILITIES: RecipeCapabilities = {
  liveTranslation: true,
  historyTranslation: false,
  originalEcho: true,
  messageSend: true,
  contactSync: true,
  unreadSync: true,
  massSend: false,
};

export const ZALO_LEGACY_RUNTIME_CONFIG_OVERRIDES = {
  userLogged: "#main-tab .nav__tabs__zalo",
  main: "#chatView",
  friendList: "#sidebarNav",
  allMsg: '#messageViewContainer .text-message__container div[data-component="message-text-content"]',
  ipt: "#richInput",
  sendBtn: '.chat-box-input-button[data-translate-title="STR_SEND"]',
  inputEvent: "input",
  isObserverSubTree: true,
} as const;

export function buildZaloRecipeRuntimeConfig(_payload: RecipeInitPayload): RecipeRuntimeConfig {
  return {
    selectors: {
      appRoot: "#chatView",
      chatRoot: "#chatView",
      sidebarRoot: "#sidebarNav",
      messageItems: '#messageViewContainer .text-message__container div[data-component="message-text-content"]',
      composer: "#richInput",
    },
    observer: { subtree: true, historyScanDelayMs: 500, liveScanDelayMs: 500 },
    capabilities: ZALO_CAPABILITIES,
    legacyConfig: { ...ZALO_LEGACY_RUNTIME_CONFIG_OVERRIDES },
  };
}
