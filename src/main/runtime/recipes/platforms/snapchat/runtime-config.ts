import type { RecipeCapabilities, RecipeInitPayload, RecipeRuntimeConfig } from "../../contracts";

const SNAPCHAT_CAPABILITIES: RecipeCapabilities = {
  liveTranslation: true,
  historyTranslation: false,
  originalEcho: true,
  messageSend: true,
  contactSync: true,
  unreadSync: true,
  massSend: false,
};

export const SNAPCHAT_LEGACY_RUNTIME_CONFIG_OVERRIDES = {
  userLogged: ".R1ne3",
  main: "._XMCw .FiLwP",
  friendList: ".R1ne3",
  allMsg: ".NvRM8",
  ipt: ".ogn1z",
  sendBtn: ".IHV_t.v4zfr",
  inputEvent: "input",
  initChatDelay: 2000,
  isNeedInitChat: true,
  isObserverSubTree: true,
} as const;

export function buildSnapchatRecipeRuntimeConfig(
  _payload: RecipeInitPayload,
): RecipeRuntimeConfig {
  return {
    selectors: {
      appRoot: "._XMCw .FiLwP",
      chatRoot: "._XMCw .FiLwP",
      sidebarRoot: ".R1ne3",
      messageItems: ".NvRM8",
      composer: ".ogn1z",
    },
    observer: {
      subtree: true,
      historyScanDelayMs: 2000,
      liveScanDelayMs: 500,
    },
    capabilities: SNAPCHAT_CAPABILITIES,
    legacyConfig: {
      ...SNAPCHAT_LEGACY_RUNTIME_CONFIG_OVERRIDES,
    },
  };
}
