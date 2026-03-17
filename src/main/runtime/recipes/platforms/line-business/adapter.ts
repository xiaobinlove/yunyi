import type { RecipeAdapter, RecipeInitPayload } from "../../contracts";
import {
  buildLineBusinessRecipeRuntimeConfig,
  LINE_BUSINESS_LEGACY_RUNTIME_CONFIG_OVERRIDES,
} from "./runtime-config";
import {
  buildLineBusinessRecipeRuntimeMethods,
  LINE_BUSINESS_LEGACY_METHOD_BINDINGS,
} from "./runtime-methods";

export function isLineBusinessRecipePayload(payload: RecipeInitPayload): boolean {
  return String(payload.recipe.id).toLowerCase() === "line-business";
}

export function normalizeLineBusinessRecipePayload(payload: RecipeInitPayload): RecipeInitPayload {
  return {
    ...payload,
    recipe: {
      ...payload.recipe,
      config: payload.recipe.config ?? {},
    },
    transSetting: {
      ...payload.transSetting,
    },
    server: {
      ...payload.server,
    },
    channels: [...payload.channels],
    languages: [...payload.languages],
    windowSetting: {
      ...payload.windowSetting,
    },
  };
}

export function createLineBusinessRecipeAdapter(): RecipeAdapter {
  return {
    id: "line-business",
    platform: "line",
    match(payload) {
      return isLineBusinessRecipePayload(payload);
    },
    normalizePayload(payload) {
      return normalizeLineBusinessRecipePayload(payload);
    },
    buildRuntimeConfig(payload) {
      return buildLineBusinessRecipeRuntimeConfig(payload);
    },
    buildRuntimeMethods(_payload) {
      return buildLineBusinessRecipeRuntimeMethods();
    },
    migration: {
      legacyConfigSource: "recipes/archives/line-business.tar.gz:webview.js",
      legacyConfigOverrides: LINE_BUSINESS_LEGACY_RUNTIME_CONFIG_OVERRIDES,
      legacyMethodBindings: LINE_BUSINESS_LEGACY_METHOD_BINDINGS,
    },
  };
}

export const lineBusinessRecipeAdapter = createLineBusinessRecipeAdapter();
