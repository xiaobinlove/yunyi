import type { RecipeAdapter, RecipeInitPayload } from "../../contracts";
import {
  buildFacebookBusinessRecipeRuntimeConfig,
  FACEBOOK_BUSINESS_LEGACY_RUNTIME_CONFIG_OVERRIDES,
} from "./runtime-config";
import {
  buildFacebookBusinessRecipeRuntimeMethods,
  FACEBOOK_BUSINESS_LEGACY_METHOD_BINDINGS,
} from "./runtime-methods";

export function isFacebookBusinessRecipePayload(payload: RecipeInitPayload): boolean {
  return String(payload.recipe.id).toLowerCase() === "facebook-business";
}

export function normalizeFacebookBusinessRecipePayload(
  payload: RecipeInitPayload,
): RecipeInitPayload {
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

export function createFacebookBusinessRecipeAdapter(): RecipeAdapter {
  return {
    id: "facebook-business",
    platform: "archive",
    match(payload) {
      return isFacebookBusinessRecipePayload(payload);
    },
    normalizePayload(payload) {
      return normalizeFacebookBusinessRecipePayload(payload);
    },
    buildRuntimeConfig(payload) {
      return buildFacebookBusinessRecipeRuntimeConfig(payload);
    },
    buildRuntimeMethods() {
      return buildFacebookBusinessRecipeRuntimeMethods();
    },
    migration: {
      legacyConfigSource: "recipes/archives/facebook-business.tar.gz:webview.js",
      legacyConfigOverrides: FACEBOOK_BUSINESS_LEGACY_RUNTIME_CONFIG_OVERRIDES,
      legacyMethodBindings: FACEBOOK_BUSINESS_LEGACY_METHOD_BINDINGS,
    },
  };
}

export const facebookBusinessRecipeAdapter = createFacebookBusinessRecipeAdapter();
