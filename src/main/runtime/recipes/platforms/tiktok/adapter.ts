import type { RecipeAdapter, RecipeInitPayload } from "../../contracts";
import {
  buildTikTokRecipeRuntimeConfig,
  TIKTOK_LEGACY_RUNTIME_CONFIG_OVERRIDES,
} from "./runtime-config";
import {
  buildTikTokRecipeRuntimeMethods,
  TIKTOK_LEGACY_METHOD_BINDINGS,
} from "./runtime-methods";

export function isTikTokRecipePayload(payload: RecipeInitPayload): boolean {
  return String(payload.recipe.id).toLowerCase() === "tiktok";
}

export function normalizeTikTokRecipePayload(payload: RecipeInitPayload): RecipeInitPayload {
  return {
    ...payload,
    recipe: { ...payload.recipe, config: payload.recipe.config ?? {} },
    transSetting: { ...payload.transSetting },
    server: { ...payload.server },
    channels: [...payload.channels],
    languages: [...payload.languages],
    windowSetting: { ...payload.windowSetting },
  };
}

export function createTikTokRecipeAdapter(): RecipeAdapter {
  return {
    id: "tiktok",
    platform: "archive",
    match(payload) {
      return isTikTokRecipePayload(payload);
    },
    normalizePayload(payload) {
      return normalizeTikTokRecipePayload(payload);
    },
    buildRuntimeConfig(payload) {
      return buildTikTokRecipeRuntimeConfig(payload);
    },
    buildRuntimeMethods() {
      return buildTikTokRecipeRuntimeMethods();
    },
    migration: {
      legacyConfigSource: "recipes/archives/tiktok.tar.gz:webview.js",
      legacyConfigOverrides: TIKTOK_LEGACY_RUNTIME_CONFIG_OVERRIDES,
      legacyMethodBindings: TIKTOK_LEGACY_METHOD_BINDINGS,
    },
  };
}

export const tikTokRecipeAdapter = createTikTokRecipeAdapter();
