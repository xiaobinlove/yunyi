import type { RecipeAdapter, RecipeInitPayload } from "../../contracts";
import { buildArchiveBackedRecipeRuntimeConfig } from "./runtime-config";
import {
  buildArchiveBackedLegacyMethodBindings,
  buildArchiveBackedRecipeRuntimeMethods,
} from "./runtime-methods";
import {
  ARCHIVE_BACKED_RECIPE_SPECS,
  getArchiveBackedRecipeSpec,
  type ArchiveBackedRecipeSpec,
} from "./specs";

export function isArchiveBackedRecipePayload(payload: RecipeInitPayload): boolean {
  return Boolean(getArchiveBackedRecipeSpec(String(payload.recipe.id).toLowerCase()));
}

export function normalizeArchiveBackedRecipePayload(payload: RecipeInitPayload): RecipeInitPayload {
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

export function createArchiveBackedRecipeAdapter(spec: ArchiveBackedRecipeSpec): RecipeAdapter {
  return {
    id: spec.id,
    platform: "archive",
    match(payload) {
      return String(payload.recipe.id).toLowerCase() === spec.id;
    },
    normalizePayload(payload) {
      return normalizeArchiveBackedRecipePayload(payload);
    },
    buildRuntimeConfig(payload) {
      return buildArchiveBackedRecipeRuntimeConfig(spec, payload);
    },
    buildRuntimeMethods(_payload) {
      return buildArchiveBackedRecipeRuntimeMethods(spec);
    },
    migration: {
      legacyConfigSource: `recipes/archives/${spec.id}.tar.gz:webview.js`,
      legacyConfigOverrides: spec.legacyConfigOverrides ?? {},
      legacyMethodBindings: buildArchiveBackedLegacyMethodBindings(spec),
    },
  };
}

export const archiveBackedRecipeAdapters: readonly RecipeAdapter[] =
  ARCHIVE_BACKED_RECIPE_SPECS.map(createArchiveBackedRecipeAdapter);
