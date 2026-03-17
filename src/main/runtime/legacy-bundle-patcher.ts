import fs from "node:fs";
import Module from "node:module";
import path from "node:path";
import type { PathRuntime } from "../types";
import {
  buildPatchedInjectJsUnsafeSource,
  buildPatchedInitializeRecipeSource,
  buildPatchedWhatsAppSendWrapperSource,
  LEGACY_RECIPES_PATCH_TARGETS,
} from "./legacy-recipes-patch-source";

const LEGACY_BUNDLE_PATCH_MARK = Symbol.for("yunyi.legacyBundlePatcherInstalled");

type ModuleWithCompile = Module & {
  _compile(code: string, filename: string): void;
};

type JsExtensionHandler = (module: ModuleWithCompile, filename: string) => void;

function replaceStrict(source: string, searchValue: string, replaceValue: string, label: string): string {
  if (!source.includes(searchValue)) {
    throw new Error(`Legacy bundle patch target not found: ${label}`);
  }

  return source.replace(searchValue, replaceValue);
}

export function patchDistElectronRecipes(source: string): string {
  source = replaceStrict(
    source,
    LEGACY_RECIPES_PATCH_TARGETS.whatsappSendWrapperOriginal,
    buildPatchedWhatsAppSendWrapperSource(),
    "dist-electron/recipes.js whatsapp send wrapper"
  );

  source = replaceStrict(
    source,
    LEGACY_RECIPES_PATCH_TARGETS.initializeRecipeOriginal,
    buildPatchedInitializeRecipeSource(),
    "dist-electron/recipes.js initializeRecipe whatsapp runtime patch"
  );

  source = replaceStrict(
    source,
    LEGACY_RECIPES_PATCH_TARGETS.injectJsUnsafeOriginal,
    buildPatchedInjectJsUnsafeSource(),
    "dist-electron/recipes.js injectJSUnsafe order fix"
  );

  return source;
}

export function ensurePatchedLegacyRecipesPreload(paths: PathRuntime): string {
  const sourcePath = path.join(paths.getDistElectronDir(), "recipes.js");
  const outputPath = paths.getUserDataDir("runtime", "recipes.patched.js");
  const source = fs.readFileSync(sourcePath, "utf8");
  const patchedSource = patchDistElectronRecipes(source);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, "utf8") !== patchedSource) {
    fs.writeFileSync(outputPath, patchedSource, "utf8");
  }

  return outputPath;
}

export function installLegacyBundlePatches(paths: PathRuntime): void {
  const globalState = globalThis as Record<PropertyKey, unknown>;
  if (globalState[LEGACY_BUNDLE_PATCH_MARK]) {
    return;
  }

  const recipesPath = path.join(paths.getDistElectronDir(), "recipes.js");
  ensurePatchedLegacyRecipesPreload(paths);
  const moduleApi = Module as unknown as { _extensions: Record<string, JsExtensionHandler> };
  const originalJsExtension = moduleApi._extensions[".js"];
  if (!originalJsExtension) {
    throw new Error("Legacy bundle patcher could not find the default .js loader");
  }

  moduleApi._extensions[".js"] = (module, filename) => {
    if (path.resolve(filename) !== path.resolve(recipesPath)) {
      return originalJsExtension(module, filename);
    }

    const source = fs.readFileSync(filename, "utf8");
    const patchedSource = patchDistElectronRecipes(source);
    module._compile(patchedSource, filename);
  };

  globalState[LEGACY_BUNDLE_PATCH_MARK] = true;
}
