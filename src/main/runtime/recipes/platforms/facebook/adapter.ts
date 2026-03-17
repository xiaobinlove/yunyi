import type { RecipeAdapter, RecipeInitPayload } from "../../contracts";
import {
  buildFacebookRecipeRuntimeConfig,
  FACEBOOK_LEGACY_RUNTIME_CONFIG_OVERRIDES,
} from "./runtime-config";
import {
  buildFacebookRecipeRuntimeMethods,
  FACEBOOK_LEGACY_METHOD_BINDINGS,
} from "./runtime-methods";

export function isFacebookRecipePayload(payload: RecipeInitPayload): boolean {
  return String(payload.recipe.id).toLowerCase() === "facebook";
}

export function normalizeFacebookRecipePayload(payload: RecipeInitPayload): RecipeInitPayload {
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

export function createFacebookRecipeAdapter(): RecipeAdapter {
  return {
    id: "facebook",
    platform: "archive",
    match(payload) {
      return isFacebookRecipePayload(payload);
    },
    normalizePayload(payload) {
      return normalizeFacebookRecipePayload(payload);
    },
    buildRuntimeConfig(payload) {
      return buildFacebookRecipeRuntimeConfig(payload);
    },
    buildRuntimeMethods() {
      return buildFacebookRecipeRuntimeMethods();
    },
    migration: {
      legacyConfigSource: "recipes/archives/facebook.tar.gz:webview.js",
      legacyConfigOverrides: FACEBOOK_LEGACY_RUNTIME_CONFIG_OVERRIDES,
      legacyMethodBindings: FACEBOOK_LEGACY_METHOD_BINDINGS,
    },
  };
}

export const facebookRecipeAdapter = createFacebookRecipeAdapter();
