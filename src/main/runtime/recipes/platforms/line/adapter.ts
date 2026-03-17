import type { RecipeAdapter, RecipeInitPayload } from "../../contracts";
import {
  buildLineRecipeRuntimeConfig,
  LINE_LEGACY_RUNTIME_CONFIG_OVERRIDES,
} from "./runtime-config";
import { buildLineRecipeRuntimeMethods, LINE_LEGACY_METHOD_BINDINGS } from "./runtime-methods";

export function isLineRecipePayload(payload: RecipeInitPayload): boolean {
  return String(payload.recipe.id).toLowerCase() === "line";
}

export function normalizeLineRecipePayload(payload: RecipeInitPayload): RecipeInitPayload {
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

export function createLineRecipeAdapter(): RecipeAdapter {
  return {
    id: "line",
    platform: "line",
    match(payload) {
      return isLineRecipePayload(payload);
    },
    normalizePayload(payload) {
      return normalizeLineRecipePayload(payload);
    },
    buildRuntimeConfig(payload) {
      return buildLineRecipeRuntimeConfig(payload);
    },
    buildRuntimeMethods(_payload) {
      return buildLineRecipeRuntimeMethods();
    },
    migration: {
      legacyConfigSource: "recipes/archives/line.tar.gz:webview.js",
      legacyConfigOverrides: LINE_LEGACY_RUNTIME_CONFIG_OVERRIDES,
      legacyMethodBindings: LINE_LEGACY_METHOD_BINDINGS,
    },
  };
}

export const lineRecipeAdapter = createLineRecipeAdapter();
