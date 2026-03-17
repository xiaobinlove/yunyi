import type { RecipeCapabilities, RecipeInitPayload, RecipeRuntimeConfig } from "../../contracts";

const TELEGRAM_CAPABILITIES: RecipeCapabilities = {
  liveTranslation: true,
  historyTranslation: true,
  originalEcho: true,
  messageSend: true,
  contactSync: true,
  unreadSync: true,
  massSend: false,
};

export const TELEGRAM_LEGACY_RUNTIME_CONFIG_OVERRIDES = {
  userLogged: ".ArchivedChats,.NewChat.Transition_slide-active",
  main: "#Main",
  friendList: ".Transition .LeftSearch",
  otherfriendLists: ".messages-layout .Transition_slide-active .middle-column-footer",
  allMsg: ".text-content.with-meta",
  ipt: "#editable-message-text,.messages-layout .Transition_slide-active #editable-message-text",
  chatDelay: 500,
  isNeedInitChat: true,
  isObserverSubTree: true,
} as const;

export function buildTelegramRecipeRuntimeConfig(_payload: RecipeInitPayload): RecipeRuntimeConfig {
  return {
    selectors: {
      appRoot: "#Main",
      chatRoot: ".MessageList",
      sidebarRoot: ".Transition .LeftSearch",
      messageItems: ".text-content.with-meta",
      composer: "#editable-message-text,.messages-layout .Transition_slide-active #editable-message-text",
    },
    observer: {
      subtree: true,
      historyScanDelayMs: 500,
      liveScanDelayMs: 500,
    },
    capabilities: TELEGRAM_CAPABILITIES,
    legacyConfig: {
      ...TELEGRAM_LEGACY_RUNTIME_CONFIG_OVERRIDES,
    },
  };
}
