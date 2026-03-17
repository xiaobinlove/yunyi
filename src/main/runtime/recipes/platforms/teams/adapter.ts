import type { RecipeAdapter, RecipeInitPayload } from "../../contracts";
import { buildTeamsRecipeRuntimeConfig, TEAMS_LEGACY_RUNTIME_CONFIG_OVERRIDES } from "./runtime-config";
import { buildTeamsRecipeRuntimeMethods, TEAMS_LEGACY_METHOD_BINDINGS } from "./runtime-methods";

export function isTeamsRecipePayload(payload: RecipeInitPayload): boolean {
  return String(payload.recipe.id).toLowerCase() === "teams";
}
export function normalizeTeamsRecipePayload(payload: RecipeInitPayload): RecipeInitPayload {
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
export function createTeamsRecipeAdapter(): RecipeAdapter {
  return {
    id: "teams",
    platform: "archive",
    match(payload) {
      return isTeamsRecipePayload(payload);
    },
    normalizePayload(payload) {
      return normalizeTeamsRecipePayload(payload);
    },
    buildRuntimeConfig(payload) {
      return buildTeamsRecipeRuntimeConfig(payload);
    },
    buildRuntimeMethods() {
      return buildTeamsRecipeRuntimeMethods();
    },
    migration: {
      legacyConfigSource: "recipes/archives/teams.tar.gz:webview.js",
      legacyConfigOverrides: TEAMS_LEGACY_RUNTIME_CONFIG_OVERRIDES,
      legacyMethodBindings: TEAMS_LEGACY_METHOD_BINDINGS,
    },
  };
}
export const teamsRecipeAdapter = createTeamsRecipeAdapter();
