import type { RecipeLegacyMethodBinding, RecipeRuntimeMethods } from "../../contracts";

export const DISCORD_LEGACY_METHOD_BINDINGS: readonly RecipeLegacyMethodBinding[] = [
  { contractKey: "getChatInfo", legacyKey: "getChatInfo" },
  { contractKey: "extractMessage", legacyKey: "getMsgTxt" },
  { contractKey: "isOwnMessage", legacyKey: "getIsMe" },
] as const;

export function buildDiscordRecipeRuntimeMethods(): RecipeRuntimeMethods {
  return {};
}
