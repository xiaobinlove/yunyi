import type { RecipeContractSnapshot, RecipeInitPayload } from "../../contracts";
import { buildRecipeContractSnapshot } from "../../core/recipe-contract-snapshot";
import { teamsRecipeAdapter } from "./adapter";
import { createTeamsRecipeFixturePayload } from "./fixture-payload";

export function buildTeamsRecipeContractSnapshot(
  payloadOverrides: Partial<RecipeInitPayload> = {},
): RecipeContractSnapshot {
  return buildRecipeContractSnapshot(
    teamsRecipeAdapter,
    createTeamsRecipeFixturePayload(payloadOverrides),
  );
}
