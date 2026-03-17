import type {
  RecipeLegacyMethodBinding,
  RecipeRuntimeMethods,
} from "../../contracts";

export const WHATSAPP_LEGACY_METHOD_BINDINGS: readonly RecipeLegacyMethodBinding[] = [
  {
    contractKey: "getChatInfo",
    legacyKey: "getChatInfo",
    note: "Current guest implementation lives in whatsapp-host-bridge.ts",
  },
  {
    contractKey: "extractMessage",
    legacyKey: "getMsgTxt",
    note: "Current guest implementation extracts text before full MessageEnvelope migration",
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

export function buildWhatsAppRecipeRuntimeMethods(): RecipeRuntimeMethods {
  // The executable guest-side implementations still live in the legacy patch.
  // This placeholder keeps the contract explicit while we migrate behavior in-place.
  return {};
}
