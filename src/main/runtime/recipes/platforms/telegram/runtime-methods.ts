import type {
  RecipeLegacyMethodBinding,
  RecipeRuntimeMethods,
} from "../../contracts";

export const TELEGRAM_LEGACY_METHOD_BINDINGS: readonly RecipeLegacyMethodBinding[] = [
  {
    contractKey: "getChatInfo",
    legacyKey: "getChatInfo",
    note: "Telegram recipe exposes getChatInfo in webview.js",
  },
  {
    contractKey: "extractMessage",
    legacyKey: "getMsgTxt",
    note: "Telegram recipe text extraction currently lives in recipe webview.js",
  },
  {
    contractKey: "isHistoryMessage",
    legacyKey: "isHistoryMsg",
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

export function buildTelegramRecipeRuntimeMethods(): RecipeRuntimeMethods {
  return {};
}
