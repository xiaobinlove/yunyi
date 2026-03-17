import { whatsappRecipeAdapter } from "../platforms/whatsapp";
import { createRecipeAdapterRegistry, type RecipeAdapterRegistry } from "./recipe-adapter-registry";

export function createDefaultRecipeAdapterRegistry(): RecipeAdapterRegistry {
  return createRecipeAdapterRegistry([whatsappRecipeAdapter]);
}
