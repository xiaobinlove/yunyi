export type RecipeContractLayerStatus = "independent" | "archive-backed";

export type RecipeParityStatus = "passing";

export type RecipeAdapterRuntimeHookupStatus = "not-connected";

export type RecipePromotionPriority = "frozen" | "candidate" | "backlog";

export interface RecipePlatformStatus {
  id: string;
  displayName: string;
  contractLayer: RecipeContractLayerStatus;
  parityStatus: RecipeParityStatus;
  adapterRuntimeHookup: RecipeAdapterRuntimeHookupStatus;
  promotionPriority: RecipePromotionPriority;
  notes: readonly string[];
}

export const RECIPE_PLATFORM_STATUS: readonly RecipePlatformStatus[] = [
  {
    id: "whatsapp",
    displayName: "WhatsApp",
    contractLayer: "independent",
    parityStatus: "passing",
    adapterRuntimeHookup: "not-connected",
    promotionPriority: "frozen",
    notes: [
      "Current live runtime is the stabilized legacy host bridge.",
      "Do not migrate execution logic until non-WhatsApp platforms are validated first.",
    ],
  },
  {
    id: "telegram",
    displayName: "Telegram",
    contractLayer: "independent",
    parityStatus: "passing",
    adapterRuntimeHookup: "not-connected",
    promotionPriority: "candidate",
    notes: [
      "Explicit adapter, runtime config, archive snapshot, and parity scaffold are in place.",
    ],
  },
  {
    id: "telegramk",
    displayName: "Telegram K",
    contractLayer: "independent",
    parityStatus: "passing",
    adapterRuntimeHookup: "not-connected",
    promotionPriority: "candidate",
    notes: [
      "Maintained alongside Telegram in the explicit contract layer.",
    ],
  },
  {
    id: "line",
    displayName: "Line",
    contractLayer: "independent",
    parityStatus: "passing",
    adapterRuntimeHookup: "not-connected",
    promotionPriority: "candidate",
    notes: [
      "Good candidate for first non-WhatsApp runtime hookup after Telegram.",
    ],
  },
  {
    id: "line-business",
    displayName: "Line Business",
    contractLayer: "independent",
    parityStatus: "passing",
    adapterRuntimeHookup: "not-connected",
    promotionPriority: "candidate",
    notes: [
      "Explicit contract is aligned with archive baseline.",
    ],
  },
  {
    id: "messenger",
    displayName: "Messenger",
    contractLayer: "independent",
    parityStatus: "passing",
    adapterRuntimeHookup: "not-connected",
    promotionPriority: "candidate",
    notes: [
      "Promotion complete; runtime hookup should wait until Telegram/Line are proven.",
    ],
  },
  {
    id: "facebook",
    displayName: "Facebook",
    contractLayer: "independent",
    parityStatus: "passing",
    adapterRuntimeHookup: "not-connected",
    promotionPriority: "candidate",
    notes: [
      "Explicit adapter exists with archive parity.",
    ],
  },
  {
    id: "facebook-business",
    displayName: "Facebook Business",
    contractLayer: "independent",
    parityStatus: "passing",
    adapterRuntimeHookup: "not-connected",
    promotionPriority: "backlog",
    notes: [
      "Explicit contract exists; lower priority than Messenger/Facebook consumer flows.",
    ],
  },
  {
    id: "googlechat",
    displayName: "Google Chat",
    contractLayer: "independent",
    parityStatus: "passing",
    adapterRuntimeHookup: "not-connected",
    promotionPriority: "candidate",
    notes: [
      "Explicit contract exists with archive parity.",
    ],
  },
  {
    id: "google-voice",
    displayName: "Google Voice",
    contractLayer: "independent",
    parityStatus: "passing",
    adapterRuntimeHookup: "not-connected",
    promotionPriority: "backlog",
    notes: [
      "Explicit contract exists; runtime hookup can follow chat-first platforms.",
    ],
  },
  {
    id: "instagram",
    displayName: "Instagram",
    contractLayer: "independent",
    parityStatus: "passing",
    adapterRuntimeHookup: "not-connected",
    promotionPriority: "candidate",
    notes: [
      "Explicit adapter promoted from archive-backed scaffold.",
    ],
  },
  {
    id: "discord",
    displayName: "Discord",
    contractLayer: "independent",
    parityStatus: "passing",
    adapterRuntimeHookup: "not-connected",
    promotionPriority: "backlog",
    notes: [
      "Explicit contract promoted and aligned to archive selectors.",
    ],
  },
  {
    id: "teams",
    displayName: "Teams",
    contractLayer: "independent",
    parityStatus: "passing",
    adapterRuntimeHookup: "not-connected",
    promotionPriority: "backlog",
    notes: [
      "Explicit contract promoted and aligned to archive selectors.",
    ],
  },
  {
    id: "zalo",
    displayName: "Zalo",
    contractLayer: "independent",
    parityStatus: "passing",
    adapterRuntimeHookup: "not-connected",
    promotionPriority: "backlog",
    notes: [
      "Explicit contract promoted and aligned to archive selectors.",
    ],
  },
  {
    id: "twitter",
    displayName: "Twitter",
    contractLayer: "independent",
    parityStatus: "passing",
    adapterRuntimeHookup: "not-connected",
    promotionPriority: "backlog",
    notes: [
      "Explicit contract promoted; runtime hookup can wait behind chat-first surfaces.",
    ],
  },
  {
    id: "tiktok",
    displayName: "TikTok",
    contractLayer: "independent",
    parityStatus: "passing",
    adapterRuntimeHookup: "not-connected",
    promotionPriority: "backlog",
    notes: [
      "Explicit contract promoted; runtime hookup can wait behind chat-first surfaces.",
    ],
  },
  {
    id: "snapchat",
    displayName: "Snapchat",
    contractLayer: "independent",
    parityStatus: "passing",
    adapterRuntimeHookup: "not-connected",
    promotionPriority: "backlog",
    notes: [
      "Explicit contract promoted; lower runtime priority.",
    ],
  },
  {
    id: "tinder",
    displayName: "Tinder",
    contractLayer: "independent",
    parityStatus: "passing",
    adapterRuntimeHookup: "not-connected",
    promotionPriority: "backlog",
    notes: [
      "Explicit contract promoted; lower runtime priority.",
    ],
  },
  {
    id: "custom",
    displayName: "Custom",
    contractLayer: "archive-backed",
    parityStatus: "passing",
    adapterRuntimeHookup: "not-connected",
    promotionPriority: "backlog",
    notes: [
      "Kept on generic archive-backed scaffold by design.",
    ],
  },
  {
    id: "signal",
    displayName: "Signal",
    contractLayer: "archive-backed",
    parityStatus: "passing",
    adapterRuntimeHookup: "not-connected",
    promotionPriority: "backlog",
    notes: [
      "Still generic archive-backed because explicit migration is not yet justified.",
    ],
  },
] as const;

export const INDEPENDENT_RECIPE_PLATFORM_IDS = RECIPE_PLATFORM_STATUS
  .filter((item) => item.contractLayer === "independent")
  .map((item) => item.id);

export const ARCHIVE_BACKED_RECIPE_PLATFORM_IDS = RECIPE_PLATFORM_STATUS
  .filter((item) => item.contractLayer === "archive-backed")
  .map((item) => item.id);

export const CANDIDATE_RUNTIME_HOOKUP_RECIPE_PLATFORM_IDS = RECIPE_PLATFORM_STATUS
  .filter((item) => item.promotionPriority === "candidate")
  .map((item) => item.id);

export function getRecipePlatformStatus(recipeId: string): RecipePlatformStatus | undefined {
  return RECIPE_PLATFORM_STATUS.find((item) => item.id === recipeId);
}
