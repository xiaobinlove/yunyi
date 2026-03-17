import type { RecipeCapabilities, RecipeInitPayload, RecipeRuntimeConfig } from "../../contracts";
import type { ArchiveBackedRecipeSpec } from "./specs";

const DEFAULT_CAPABILITIES: RecipeCapabilities = {
  liveTranslation: true,
  historyTranslation: false,
  originalEcho: true,
  messageSend: true,
  contactSync: true,
  unreadSync: true,
  massSend: false,
};

export function buildArchiveBackedRecipeRuntimeConfig(
  spec: ArchiveBackedRecipeSpec,
  _payload: RecipeInitPayload,
): RecipeRuntimeConfig {
  return {
    selectors: {
      appRoot: "",
      chatRoot: "",
      sidebarRoot: "",
      messageItems: "",
      composer: "",
    },
    observer: {
      subtree: true,
      historyScanDelayMs: 500,
      liveScanDelayMs: 500,
    },
    capabilities: {
      ...DEFAULT_CAPABILITIES,
      ...(spec.capabilities ?? {}),
    },
    legacyConfig: {
      ...(spec.legacyConfigOverrides ?? {}),
    },
  };
}
