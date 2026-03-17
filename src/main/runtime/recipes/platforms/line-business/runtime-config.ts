import type { RecipeCapabilities, RecipeInitPayload, RecipeRuntimeConfig } from "../../contracts";

const LINE_BUSINESS_CAPABILITIES: RecipeCapabilities = {
  liveTranslation: true,
  historyTranslation: true,
  originalEcho: true,
  messageSend: true,
  contactSync: true,
  unreadSync: true,
  massSend: false,
};

export const LINE_BUSINESS_LEGACY_RUNTIME_CONFIG_OVERRIDES = {
  userLogged: "#header-menu",
  main: "#content-secondary>div.flex-column.h-100",
  friendList: ".chatlist",
  otherfriendLists: "table.table",
  allMsg: ".chat-item-text",
  ipt: "#editor",
  sendBtn: '#editable-unit input[type="submit"]',
  chatDelay: 500,
  isNeedInitChat: true,
  isObserverSubTree: true,
} as const;

export function buildLineBusinessRecipeRuntimeConfig(
  _payload: RecipeInitPayload,
): RecipeRuntimeConfig {
  return {
    selectors: {
      appRoot: "#content-secondary>div.flex-column.h-100",
      chatRoot: "#content-secondary>div.flex-column.h-100",
      sidebarRoot: ".chatlist,table.table",
      messageItems: ".chat-item-text",
      composer: "#editor",
    },
    observer: {
      subtree: true,
      historyScanDelayMs: 500,
      liveScanDelayMs: 500,
    },
    capabilities: LINE_BUSINESS_CAPABILITIES,
    legacyConfig: {
      ...LINE_BUSINESS_LEGACY_RUNTIME_CONFIG_OVERRIDES,
    },
  };
}
