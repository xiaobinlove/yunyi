import type { RecipeLegacyMethodBinding, RecipeRuntimeMethods } from "../../contracts";
import type { ArchiveBackedRecipeSpec } from "./specs";

function createBinding(contractKey: RecipeLegacyMethodBinding["contractKey"], legacyKey: string): RecipeLegacyMethodBinding {
  return { contractKey, legacyKey };
}

export function buildArchiveBackedLegacyMethodBindings(
  spec: ArchiveBackedRecipeSpec,
): readonly RecipeLegacyMethodBinding[] {
  if (spec.legacyMethodBindings) {
    return spec.legacyMethodBindings;
  }

  const bindings: RecipeLegacyMethodBinding[] = [];

  if (spec.methodHints.includes("getChatInfo")) {
    bindings.push(createBinding("getChatInfo", "getChatInfo"));
  }
  if (spec.methodHints.includes("getMsgTxt")) {
    bindings.push(createBinding("extractMessage", "getMsgTxt"));
  }
  if (spec.methodHints.includes("isHistoryMsg")) {
    bindings.push(createBinding("isHistoryMessage", "isHistoryMsg"));
  }
  if (spec.methodHints.includes("getIsMe")) {
    bindings.push(createBinding("isOwnMessage", "getIsMe"));
  }
  if (spec.methodHints.includes("othersNeedTrans")) {
    bindings.push(createBinding("needsTranslate", "othersNeedTrans"));
  }

  return bindings;
}

export function buildArchiveBackedRecipeRuntimeMethods(
  _spec: ArchiveBackedRecipeSpec,
): RecipeRuntimeMethods {
  return {};
}
