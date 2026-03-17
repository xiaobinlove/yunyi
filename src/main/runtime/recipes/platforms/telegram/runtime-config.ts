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

export const TELEGRAM_K_LEGACY_RUNTIME_CONFIG_OVERRIDES = {
  userLogged: ".chatlist,.chat.tabs-tab.active",
  main: ".chat.tabs-tab.active",
  friendList: ".chatlist",
  otherfriendLists: ".popup-input-container",
  allMsg: ".bubble,.message,[data-mid]",
  ipt: ".chat.tabs-tab.active .input-message-input,.chat-input.chat-input-main",
  chatDelay: 500,
  isNeedInitChat: true,
  isObserverSubTree: true,
} as const;

export function buildTelegramRecipeRuntimeConfig(_payload: RecipeInitPayload): RecipeRuntimeConfig {
  const recipeId = String(_payload.recipe.id).toLowerCase();
  const isTelegramK = recipeId === "telegramk";

  return {
    selectors: {
      appRoot: isTelegramK ? ".chat.tabs-tab.active" : "#Main",
      chatRoot: isTelegramK ? ".chat.tabs-tab.active .bubbles>.scrollable" : ".MessageList",
      sidebarRoot: isTelegramK ? ".chatlist" : ".Transition .LeftSearch",
      messageItems: isTelegramK ? ".bubble,.message,[data-mid]" : ".text-content.with-meta",
      composer: isTelegramK
        ? ".chat.tabs-tab.active .input-message-input,.chat-input.chat-input-main"
        : "#editable-message-text,.messages-layout .Transition_slide-active #editable-message-text",
    },
    observer: {
      subtree: true,
      historyScanDelayMs: 500,
      liveScanDelayMs: 500,
    },
    capabilities: TELEGRAM_CAPABILITIES,
    legacyConfig: {
      ...(isTelegramK
        ? TELEGRAM_K_LEGACY_RUNTIME_CONFIG_OVERRIDES
        : TELEGRAM_LEGACY_RUNTIME_CONFIG_OVERRIDES),
    },
  };
}
