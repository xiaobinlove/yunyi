import type { RecipeLegacyMethodBinding, RecipeRuntimeMethods } from "../../contracts";

export const TINDER_LEGACY_METHOD_BINDINGS: readonly RecipeLegacyMethodBinding[] = [
  { contractKey: "getChatInfo", legacyKey: "getChatInfo" },
  { contractKey: "isOwnMessage", legacyKey: "getIsMe" },
] as const;

export function buildTinderRecipeRuntimeMethods(): RecipeRuntimeMethods {
  return {};
}
