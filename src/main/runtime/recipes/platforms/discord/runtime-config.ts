import type { RecipeCapabilities, RecipeInitPayload, RecipeRuntimeConfig } from "../../contracts";

const DISCORD_CAPABILITIES: RecipeCapabilities = {
  liveTranslation: true,
  historyTranslation: false,
  originalEcho: true,
  messageSend: true,
  contactSync: true,
  unreadSync: true,
  massSend: false,
};

export const DISCORD_LEGACY_RUNTIME_CONFIG_OVERRIDES = {
  userLogged: '[class*="nameTag_"] [class*="panelTitleContainer_"]',
  main: '[class*="chatContent_"]',
  friendList: '[class*="sidebar_"] [class*="sidebarList_"] ul[role="list"]',
  otherfriendLists: "nav.wrapper_ef3116.guilds_c48ade,.peopleList__5ec2f",
  allMsg: '[class*="messagesWrapper_"] [class*="scrollerInner_"]',
  ipt: ".editor__1b31f.slateTextArea_ec4baf",
  inputEvent: "input",
  chatDelay: 500,
  isNeedInitChat: true,
  initChatDelay: 2000,
  isObserverSubTree: true,
} as const;

export function buildDiscordRecipeRuntimeConfig(_payload: RecipeInitPayload): RecipeRuntimeConfig {
  return {
    selectors: {
      appRoot: '[class*="chatContent_"]',
      chatRoot: '[class*="chatContent_"]',
      sidebarRoot: '[class*="sidebar_"] [class*="sidebarList_"] ul[role="list"]',
      messageItems: '[class*="messagesWrapper_"] [class*="scrollerInner_"]',
      composer: ".editor__1b31f.slateTextArea_ec4baf",
    },
    observer: {
      subtree: true,
      historyScanDelayMs: 2000,
      liveScanDelayMs: 500,
    },
    capabilities: DISCORD_CAPABILITIES,
    legacyConfig: {
      ...DISCORD_LEGACY_RUNTIME_CONFIG_OVERRIDES,
    },
  };
}
