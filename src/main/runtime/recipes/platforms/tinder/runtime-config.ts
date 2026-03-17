import type { RecipeCapabilities, RecipeInitPayload, RecipeRuntimeConfig } from "../../contracts";

const TINDER_CAPABILITIES: RecipeCapabilities = {
  liveTranslation: true,
  historyTranslation: false,
  originalEcho: true,
  messageSend: true,
  contactSync: true,
  unreadSync: true,
  massSend: false,
};

export const TINDER_LEGACY_RUNTIME_CONFIG_OVERRIDES = {
  userLogged: "aside",
  main: ".messageList",
  friendList: ".chat",
  allMsg: ".msgHelper .msg .text",
  ipt: ".chat form textarea",
  sendBtn: '.chat form button[type="submit"]',
  inputEvent: "input",
  isNeedInitChat: true,
  isObserverSubTree: true,
} as const;

export function buildTinderRecipeRuntimeConfig(_payload: RecipeInitPayload): RecipeRuntimeConfig {
  return {
    selectors: {
      appRoot: ".messageList",
      chatRoot: ".messageList",
      sidebarRoot: ".chat",
      messageItems: ".msgHelper .msg .text",
      composer: ".chat form textarea",
    },
    observer: {
      subtree: true,
      historyScanDelayMs: 500,
      liveScanDelayMs: 500,
    },
    capabilities: TINDER_CAPABILITIES,
    legacyConfig: {
      ...TINDER_LEGACY_RUNTIME_CONFIG_OVERRIDES,
    },
  };
}
