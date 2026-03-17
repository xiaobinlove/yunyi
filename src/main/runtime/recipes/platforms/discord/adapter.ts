import type { RecipeAdapter, RecipeInitPayload } from "../../contracts";
import {
  buildDiscordRecipeRuntimeConfig,
  DISCORD_LEGACY_RUNTIME_CONFIG_OVERRIDES,
} from "./runtime-config";
import {
  buildDiscordRecipeRuntimeMethods,
  DISCORD_LEGACY_METHOD_BINDINGS,
} from "./runtime-methods";

export function isDiscordRecipePayload(payload: RecipeInitPayload): boolean {
  return String(payload.recipe.id).toLowerCase() === "discord";
}
export function normalizeDiscordRecipePayload(payload: RecipeInitPayload): RecipeInitPayload {
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
export function createDiscordRecipeAdapter(): RecipeAdapter {
  return {
    id: "discord",
    platform: "archive",
    match(payload) {
      return isDiscordRecipePayload(payload);
    },
    normalizePayload(payload) {
      return normalizeDiscordRecipePayload(payload);
    },
    buildRuntimeConfig(payload) {
      return buildDiscordRecipeRuntimeConfig(payload);
    },
    buildRuntimeMethods() {
      return buildDiscordRecipeRuntimeMethods();
    },
    migration: {
      legacyConfigSource: "recipes/archives/discord.tar.gz:webview.js",
      legacyConfigOverrides: DISCORD_LEGACY_RUNTIME_CONFIG_OVERRIDES,
      legacyMethodBindings: DISCORD_LEGACY_METHOD_BINDINGS,
    },
  };
}
export const discordRecipeAdapter = createDiscordRecipeAdapter();
