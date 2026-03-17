import type { RecipeLegacyMethodBinding, RecipeRuntimeMethods } from "../../contracts";

export const LINE_LEGACY_METHOD_BINDINGS: readonly RecipeLegacyMethodBinding[] = [
  {
    contractKey: "getChatInfo",
    legacyKey: "getChatInfo",
    note: "Line recipe exposes getChatInfo in webview.js",
  },
  {
    contractKey: "isHistoryMessage",
    legacyKey: "isHistoryMsg",
  },
  {
    contractKey: "isOwnMessage",
    legacyKey: "getIsMe",
  },
] as const;

export function buildLineRecipeRuntimeMethods(): RecipeRuntimeMethods {
  return {};
}
