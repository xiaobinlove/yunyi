import { ipcMain } from "electron";
import { RecipeService } from "../services/recipe-service";
import type { RecipeInstallRequest, RecipeRequest } from "../types";

type RecipesMethod =
  | "getSupportRecipes"
  | "getInstalledRecipes"
  | "installRecipe"
  | "uninstallAllRecipes"
  | "getRecipesVersion"
  | "request";

function createRecipesHandler(recipeService: RecipeService) {
  return async (method: RecipesMethod | string, ...args: unknown[]) => {
    switch (method) {
      case "getSupportRecipes":
        return recipeService.getSupportRecipes();
      case "getInstalledRecipes":
        return recipeService.getInstalledRecipes();
      case "installRecipe":
        return recipeService.installRecipe(args[0] as RecipeInstallRequest);
      case "uninstallAllRecipes":
        return recipeService.uninstallAllRecipes();
      case "getRecipesVersion":
        return recipeService.getRecipesVersion();
      case "request":
        return recipeService.request(args[0] as RecipeRequest);
      default:
        console.warn("recipes handle event not found:", method, args);
        return null;
    }
  };
}

export function registerRecipesHandler(recipeService: RecipeService): void {
  const handler = createRecipesHandler(recipeService);
  ipcMain.removeHandler("recipes");
  ipcMain.handle("recipes", (_event, method: string, ...args: unknown[]) => handler(method, ...args));
}
