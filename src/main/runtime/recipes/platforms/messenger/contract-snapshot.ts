import type { RecipeContractSnapshot, RecipeInitPayload } from "../../contracts";
import { buildRecipeContractSnapshot } from "../../core/recipe-contract-snapshot";
import { messengerRecipeAdapter } from "./adapter";
import { createMessengerRecipeFixturePayload } from "./fixture-payload";

export function buildMessengerRecipeContractSnapshot(
  payloadOverrides: Partial<RecipeInitPayload> = {},
): RecipeContractSnapshot {
  return buildRecipeContractSnapshot(
    messengerRecipeAdapter,
    createMessengerRecipeFixturePayload(payloadOverrides),
  );
}
