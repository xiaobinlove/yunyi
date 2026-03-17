import type { RecipeCapabilities, RecipeInitPayload, RecipeRuntimeConfig } from "../../contracts";

const LINE_CAPABILITIES: RecipeCapabilities = {
  liveTranslation: true,
  historyTranslation: true,
  originalEcho: true,
  messageSend: true,
  contactSync: true,
  unreadSync: true,
  massSend: false,
};

export const LINE_LEGACY_RUNTIME_CONFIG_OVERRIDES = {
  userLogged: ".gnb-module__nav_list__wRO2S",
  main: ".chatroom-module__chatroom__eVUaK",
  friendList: ".chatlist-module__chatlist_wrap__KtTpq",
  otherfriendLists: ".friendlist-module__list_wrap__IeJXY",
  allMsg: ".textMessageContent-module__text__EFwEN",
  ipt: ".chatroomEditor-module__textarea__yKTlH",
  chatDelay: 500,
  isNeedInitChat: true,
  isObserverSubTree: true,
} as const;

export function buildLineRecipeRuntimeConfig(_payload: RecipeInitPayload): RecipeRuntimeConfig {
  return {
    selectors: {
      appRoot: ".chatroom-module__chatroom__eVUaK",
      chatRoot: ".message_list",
      sidebarRoot:
        ".chatlist-module__chatlist_wrap__KtTpq,.friendlist-module__list_wrap__IeJXY",
      messageItems: ".textMessageContent-module__text__EFwEN",
      composer: ".chatroomEditor-module__textarea__yKTlH",
    },
    observer: {
      subtree: true,
      historyScanDelayMs: 500,
      liveScanDelayMs: 500,
    },
    capabilities: LINE_CAPABILITIES,
    legacyConfig: {
      ...LINE_LEGACY_RUNTIME_CONFIG_OVERRIDES,
    },
  };
}
