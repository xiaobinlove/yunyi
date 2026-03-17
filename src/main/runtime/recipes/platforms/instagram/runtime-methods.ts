import type { RecipeLegacyMethodBinding, RecipeRuntimeMethods } from "../../contracts";

export const INSTAGRAM_LEGACY_METHOD_BINDINGS: readonly RecipeLegacyMethodBinding[] = [
  {
    contractKey: "getChatInfo",
    legacyKey: "getChatInfo",
    note: "Instagram recipe exposes getChatInfo in webview.js",
  },
  {
    contractKey: "extractMessage",
    legacyKey: "getMsgTxt",
  },
  {
    contractKey: "isOwnMessage",
    legacyKey: "getIsMe",
  },
  {
    contractKey: "needsTranslate",
    legacyKey: "othersNeedTrans",
  },
] as const;

export function buildInstagramRecipeRuntimeMethods(): RecipeRuntimeMethods {
  return {};
}
