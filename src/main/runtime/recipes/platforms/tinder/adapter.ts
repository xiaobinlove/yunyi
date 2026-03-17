import type { RecipeAdapter, RecipeInitPayload } from "../../contracts";
import {
  buildTinderRecipeRuntimeConfig,
  TINDER_LEGACY_RUNTIME_CONFIG_OVERRIDES,
} from "./runtime-config";
import {
  buildTinderRecipeRuntimeMethods,
  TINDER_LEGACY_METHOD_BINDINGS,
} from "./runtime-methods";

export function isTinderRecipePayload(payload: RecipeInitPayload): boolean {
  return String(payload.recipe.id).toLowerCase() === "tinder";
}

export function normalizeTinderRecipePayload(payload: RecipeInitPayload): RecipeInitPayload {
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

export function createTinderRecipeAdapter(): RecipeAdapter {
  return {
    id: "tinder",
    platform: "archive",
    match(payload) {
      return isTinderRecipePayload(payload);
    },
    normalizePayload(payload) {
      return normalizeTinderRecipePayload(payload);
    },
    buildRuntimeConfig(payload) {
      return buildTinderRecipeRuntimeConfig(payload);
    },
    buildRuntimeMethods() {
      return buildTinderRecipeRuntimeMethods();
    },
    migration: {
      legacyConfigSource: "recipes/archives/tinder.tar.gz:webview.js",
      legacyConfigOverrides: TINDER_LEGACY_RUNTIME_CONFIG_OVERRIDES,
      legacyMethodBindings: TINDER_LEGACY_METHOD_BINDINGS,
    },
  };
}

export const tinderRecipeAdapter = createTinderRecipeAdapter();
