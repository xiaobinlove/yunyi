import type { RecipeCapabilities, RecipeInitPayload, RecipeRuntimeConfig } from "../../contracts";

const INSTAGRAM_CAPABILITIES: RecipeCapabilities = {
  liveTranslation: true,
  historyTranslation: false,
  originalEcho: true,
  messageSend: true,
  contactSync: true,
  unreadSync: true,
  massSend: false,
};

export const INSTAGRAM_LEGACY_RUNTIME_CONFIG_OVERRIDES = {
  userLogged: '[href="/direct/inbox/"]',
  main: 'div[data-pagelet="IGDOpenMessageList"]',
  friendList: '.x6usi7g.x18b5jzi.x1lun4ml.x1vjfegm .x1iyjqo2.xh8yej3>div:last-child a[role="link"][href]',
  otherfriendLists: '.x1943h6x.x1i0vuye.xl565be.x1s688f.x5n08af.x1tu3fi.x3x7a5m.x10wh9bi.xpm28yp.x8viiok.x1o7cslx',
  allMsg: '.x1gslohp.x12nagc.x1yc453h.x126k92a',
  ipt: 'div[role="textbox"]',
  sendBtn:
    '.x9f619.xjbqb8w.x78zum5.x168nmei.x13lgxp2.x5pf9jr.xo71vjh.xw7yly9.xktsk01.x1yztbdb.x1d52u69.x1uhb9sk.x1plvlek.xryxfnj.x1c4vz4f.x2lah0s.xdt5ytf.xqjyukv.x1qjc9v5',
  chatDelay: 1000,
  isNeedInitChat: true,
  isObserverSubTree: true,
} as const;

export function buildInstagramRecipeRuntimeConfig(_payload: RecipeInitPayload): RecipeRuntimeConfig {
  return {
    selectors: {
      appRoot: 'div[data-pagelet="IGDOpenMessageList"]',
      chatRoot: '.x1943h6x.x1i0vuye.xl565be.x1s688f.x5n08af.x1tu3fi.x3x7a5m.x10wh9bi.xpm28yp.x8viiok.x1o7cslx',
      sidebarRoot:
        '.x6usi7g.x18b5jzi.x1lun4ml.x1vjfegm .x1iyjqo2.xh8yej3>div:last-child a[role="link"][href]',
      messageItems: '.x1gslohp.x12nagc.x1yc453h.x126k92a',
      composer: 'div[role="textbox"]',
    },
    observer: {
      subtree: true,
      historyScanDelayMs: 1000,
      liveScanDelayMs: 1000,
    },
    capabilities: INSTAGRAM_CAPABILITIES,
    legacyConfig: {
      ...INSTAGRAM_LEGACY_RUNTIME_CONFIG_OVERRIDES,
    },
  };
}
