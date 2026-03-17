import type { RecipeLegacyMethodBinding, RecipeRuntimeMethods } from "../../contracts";

export const LINE_BUSINESS_LEGACY_METHOD_BINDINGS: readonly RecipeLegacyMethodBinding[] = [
  {
    contractKey: "getChatInfo",
    legacyKey: "getChatInfo",
    note: "Line Business recipe exposes getChatInfo in webview.js",
  },
  {
    contractKey: "isOwnMessage",
    legacyKey: "getIsMe",
  },
] as const;

export function buildLineBusinessRecipeRuntimeMethods(): RecipeRuntimeMethods {
  return {};
}
