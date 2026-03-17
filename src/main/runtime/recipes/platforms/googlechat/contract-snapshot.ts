import type { RecipeContractSnapshot, RecipeInitPayload } from "../../contracts";
import { buildRecipeContractSnapshot } from "../../core/recipe-contract-snapshot";
import { googleChatRecipeAdapter } from "./adapter";
import { createGoogleChatRecipeFixturePayload } from "./fixture-payload";

export function buildGoogleChatRecipeContractSnapshot(
  payloadOverrides: Partial<RecipeInitPayload> = {},
): RecipeContractSnapshot {
  return buildRecipeContractSnapshot(
    googleChatRecipeAdapter,
    createGoogleChatRecipeFixturePayload(payloadOverrides),
  );
}
