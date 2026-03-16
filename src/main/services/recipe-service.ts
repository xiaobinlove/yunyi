import path from "node:path";
import fs from "fs-extra";
import tar from "tar";
import type { App } from "electron";
import type { InstalledRecipe, PathRuntime, RecipeInstallRequest, RecipeRequest } from "../types";
import { HttpClient } from "./http-client";

function compareVersions(currentVersion: string, nextVersion: string): number {
  const versionPattern = /^(\d+)\.(\d+)\.(\d+)/;
  const current = versionPattern.exec(currentVersion) ?? [];
  const next = versionPattern.exec(nextVersion) ?? [];

  for (let index = 1; index <= 3; index += 1) {
    const left = Number(current[index] ?? 0);
    const right = Number(next[index] ?? 0);
    if (left > right) {
      return 1;
    }
    if (left < right) {
      return -1;
    }
  }

  return 0;
}

export class RecipeService {
  private readonly httpClient = new HttpClient();

  constructor(
    private readonly app: App,
    private readonly paths: PathRuntime
  ) {}

  private getInstalledRecipesDir(): string {
    return this.paths.getUserDataDir("recipes");
  }

  private getArchivePath(recipeId: string): string {
    return path.join(this.paths.getRecipesArchivesDir(), `${recipeId}.tar.gz`);
  }

  private getAppsConfigPath(): string {
    return path.join(this.paths.getRecipesArchivesDir(), "apps.json");
  }

  getSupportRecipes(): InstalledRecipe[] {
    const appsConfigPath = this.getAppsConfigPath();
    const supportRecipes = (fs.readJsonSync(appsConfigPath, { throws: false }) ?? []) as InstalledRecipe[];

    return [...supportRecipes].filter(
      (recipe, index, allRecipes) => allRecipes.findIndex((item) => item.id === recipe.id) === index
    );
  }

  async getRecipesVersion(): Promise<InstalledRecipe[]> {
    if (!this.app.isPackaged) {
      return [];
    }

    const response = await this.httpClient.get("https://recipes.yunyiapp.com/recipes/apps.json", {
      headers: {
        "Cache-Control": "no-cache",
      },
    });

    return Array.isArray(response) ? (response as InstalledRecipe[]) : [];
  }

  getInstalledRecipes(): InstalledRecipe[] {
    const installedRecipesDir = this.getInstalledRecipesDir();
    fs.ensureDirSync(installedRecipesDir);

    return (fs.readdirSync(installedRecipesDir) as string[])
      .filter((entry: string) => entry !== "temp" && entry !== "dev")
      .filter((entry: string) => fs.statSync(path.join(installedRecipesDir, entry)).isDirectory())
      .map((entry: string) => this.readInstalledRecipe(installedRecipesDir, entry))
      .filter((recipe: InstalledRecipe | null): recipe is InstalledRecipe => Boolean(recipe?.id));
  }

  private readInstalledRecipe(installedRecipesDir: string, recipeId: string): InstalledRecipe | null {
    try {
      const packageJsonPath = path.join(installedRecipesDir, recipeId, "package.json");
      delete require.cache[require.resolve(packageJsonPath)];
      const recipePackage = require(packageJsonPath) as InstalledRecipe;
      recipePackage.path = path.dirname(require.resolve(packageJsonPath));
      return recipePackage;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async installRecipe({ recipeId, internalVersion }: RecipeInstallRequest): Promise<string> {
    const installedRecipesDir = this.getInstalledRecipesDir();
    const installedPackagePath = path.join(installedRecipesDir, recipeId, "package.json");

    if (fs.pathExistsSync(installedPackagePath)) {
      const installedPackage = (fs.readJsonSync(installedPackagePath, { throws: false }) ?? {}) as InstalledRecipe;
      const installedVersion = typeof installedPackage.version === "string" ? installedPackage.version : "0.0.0";
      if (!internalVersion || compareVersions(installedVersion, internalVersion) >= 0) {
        return recipeId;
      }
    }

    const tempRecipeDir = path.join(installedRecipesDir, "temp", recipeId);
    const archivePath = this.getArchivePath(recipeId);

    if (!fs.pathExistsSync(archivePath)) {
      throw new Error(`Recipe archive not found: ${archivePath}`);
    }

    fs.removeSync(tempRecipeDir);
    fs.ensureDirSync(tempRecipeDir);

    await tar.extract({
      file: archivePath,
      cwd: tempRecipeDir,
      preservePaths: true,
      unlink: true,
      preserveOwner: false,
      onwarn: (warning: unknown) => console.warn("warn", recipeId, warning),
    });

    const packageJsonPath = path.join(tempRecipeDir, "package.json");
    const recipePackage = fs.readJsonSync(packageJsonPath, { throws: false }) as InstalledRecipe | null;
    if (!recipePackage || !recipePackage.id) {
      throw new Error(`Invalid recipe package: ${packageJsonPath}`);
    }

    const finalRecipeDir = path.join(installedRecipesDir, recipePackage.id);
    fs.removeSync(finalRecipeDir);
    fs.copySync(tempRecipeDir, finalRecipeDir);
    fs.removeSync(tempRecipeDir);

    return recipePackage.id;
  }

  async request(options: RecipeRequest): Promise<unknown> {
    return this.httpClient.requestJson(options);
  }

  uninstallAllRecipes(): void {
    fs.removeSync(this.getInstalledRecipesDir());
  }
}
