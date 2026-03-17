import type { RecipeContractSnapshot, RecipeInitPayload } from "../../contracts";
import { buildRecipeContractSnapshot } from "../../core/recipe-contract-snapshot";
import { whatsappRecipeAdapter } from "./adapter";
import { createWhatsAppRecipeFixturePayload } from "./fixture-payload";

export function buildWhatsAppRecipeContractSnapshot(
  payloadOverrides: Partial<RecipeInitPayload> = {},
): RecipeContractSnapshot {
  return buildRecipeContractSnapshot(
    whatsappRecipeAdapter,
    createWhatsAppRecipeFixturePayload(payloadOverrides),
  );
}
