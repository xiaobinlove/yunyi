import type { RecipeAdapter, RecipeInitPayload } from "../../contracts";
import { buildZaloRecipeRuntimeConfig, ZALO_LEGACY_RUNTIME_CONFIG_OVERRIDES } from "./runtime-config";
import { buildZaloRecipeRuntimeMethods, ZALO_LEGACY_METHOD_BINDINGS } from "./runtime-methods";

export function isZaloRecipePayload(payload: RecipeInitPayload): boolean {
  return String(payload.recipe.id).toLowerCase() === "zalo";
}
export function normalizeZaloRecipePayload(payload: RecipeInitPayload): RecipeInitPayload {
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
export function createZaloRecipeAdapter(): RecipeAdapter {
  return {
    id: "zalo",
    platform: "archive",
    match(payload) {
      return isZaloRecipePayload(payload);
    },
    normalizePayload(payload) {
      return normalizeZaloRecipePayload(payload);
    },
    buildRuntimeConfig(payload) {
      return buildZaloRecipeRuntimeConfig(payload);
    },
    buildRuntimeMethods() {
      return buildZaloRecipeRuntimeMethods();
    },
    migration: {
      legacyConfigSource: "recipes/archives/zalo.tar.gz:webview.js",
      legacyConfigOverrides: ZALO_LEGACY_RUNTIME_CONFIG_OVERRIDES,
      legacyMethodBindings: ZALO_LEGACY_METHOD_BINDINGS,
    },
  };
}
export const zaloRecipeAdapter = createZaloRecipeAdapter();
