import type { RecipeLegacyMethodBinding, RecipeRuntimeMethods } from "../../contracts";

export const SNAPCHAT_LEGACY_METHOD_BINDINGS: readonly RecipeLegacyMethodBinding[] = [
  { contractKey: "getChatInfo", legacyKey: "getChatInfo" },
  { contractKey: "isOwnMessage", legacyKey: "getIsMe" },
] as const;

export function buildSnapchatRecipeRuntimeMethods(): RecipeRuntimeMethods {
  return {};
}
