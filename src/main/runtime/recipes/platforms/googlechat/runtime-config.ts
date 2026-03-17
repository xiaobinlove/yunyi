import type { RecipeCapabilities, RecipeInitPayload, RecipeRuntimeConfig } from "../../contracts";

const GOOGLECHAT_CAPABILITIES: RecipeCapabilities = {
  liveTranslation: true,
  historyTranslation: false,
  originalEcho: true,
  messageSend: true,
  contactSync: true,
  unreadSync: true,
  massSend: false,
};

export const GOOGLECHAT_LEGACY_RUNTIME_CONFIG_OVERRIDES = {
  userLogged: ".hj99tb.KRoqRc",
  main: ".BCL84c.aM97s.ZCbGl.zmXnlc.Ahbcuc",
  friendList: ".Zc1Emd.QIJiHb",
  otherfriendLists: ".hj99tb.KRoqRc",
  allMsg: ".hj99tb.KRoqRc",
  ipt: ".BCL84c.aM97s.ZCbGl.zmXnlc.Ahbcuc",
  sendBtn: ".hj99tb.KRoqRc",
  initChatDelay: 2000,
  isNeedInitChat: true,
  isObserverSubTree: true,
  transStyle: "margin: 5px 12px;",
} as const;

export function buildGoogleChatRecipeRuntimeConfig(
  _payload: RecipeInitPayload,
): RecipeRuntimeConfig {
  return {
    selectors: {
      appRoot: ".BCL84c.aM97s.ZCbGl.zmXnlc.Ahbcuc",
      chatRoot: ".BCL84c.aM97s.ZCbGl.zmXnlc.Ahbcuc",
      sidebarRoot: ".Zc1Emd.QIJiHb",
      messageItems: ".hj99tb.KRoqRc",
      composer: ".BCL84c.aM97s.ZCbGl.zmXnlc.Ahbcuc",
    },
    observer: {
      subtree: true,
      historyScanDelayMs: 2000,
      liveScanDelayMs: 500,
    },
    capabilities: GOOGLECHAT_CAPABILITIES,
    legacyConfig: {
      ...GOOGLECHAT_LEGACY_RUNTIME_CONFIG_OVERRIDES,
    },
  };
}
