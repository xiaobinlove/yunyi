import type { RecipeContractParityIssue, RecipeContractParityReport } from "../../contracts";
import { buildArchiveBackedRecipeArchiveSnapshot } from "./archive-snapshot";
import { buildArchiveBackedRecipeContractSnapshot } from "./contract-snapshot";
import { getArchiveBackedRecipeSpec } from "./specs";

function buildIssue(code: string, message: string): RecipeContractParityIssue {
  return { code, message };
}

export async function buildArchiveBackedRecipeParityReport(
  recipeId: string,
): Promise<RecipeContractParityReport> {
  const spec = getArchiveBackedRecipeSpec(recipeId);
  if (!spec) {
    throw new Error(`Unknown archive-backed recipe: ${recipeId}`);
  }

  const contractSnapshot = buildArchiveBackedRecipeContractSnapshot(recipeId);
  const archiveSnapshot = await buildArchiveBackedRecipeArchiveSnapshot(recipeId);
  const issues: RecipeContractParityIssue[] = [];
  const checks: string[] = [];

  checks.push("package-id");
  if (archiveSnapshot.packageInfo.id !== contractSnapshot.adapterId) {
    issues.push(
      buildIssue(
        "package-id-mismatch",
        `Archive package id "${archiveSnapshot.packageInfo.id}" does not match adapter "${contractSnapshot.adapterId}".`,
      ),
    );
  }

  if (typeof spec.serviceURL === "string") {
    checks.push("package-service-url");
    if (archiveSnapshot.packageInfo.config?.serviceURL !== spec.serviceURL) {
      issues.push(
        buildIssue(
          "service-url-mismatch",
          `Archive serviceURL "${String(archiveSnapshot.packageInfo.config?.serviceURL ?? "")}" does not match expected "${spec.serviceURL}".`,
        ),
      );
    }
  }

  for (const selector of spec.selectorHints) {
    checks.push(`selector:${selector}`);
    if (!archiveSnapshot.selectorHints.includes(selector)) {
      issues.push(
        buildIssue(
          "missing-selector-hint",
          `Archive webview.js is missing expected selector hint "${selector}".`,
        ),
      );
    }
  }

  for (const method of spec.methodHints) {
    checks.push(`method:${method}`);
    if (!archiveSnapshot.methodHints.includes(method)) {
      issues.push(
        buildIssue(
          "missing-method-hint",
          `Archive webview.js is missing expected method hint "${method}".`,
        ),
      );
    }
  }

  return {
    adapterId: contractSnapshot.adapterId,
    ok: issues.length === 0,
    checks,
    issues,
  };
}
