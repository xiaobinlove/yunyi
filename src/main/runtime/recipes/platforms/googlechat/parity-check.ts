import type { RecipeContractParityIssue, RecipeContractParityReport } from "../../contracts";
import { buildGoogleChatArchiveSnapshot } from "./archive-snapshot";
import { buildGoogleChatRecipeContractSnapshot } from "./contract-snapshot";

function buildIssue(code: string, message: string): RecipeContractParityIssue {
  return { code, message };
}

export async function buildGoogleChatRecipeParityReport(): Promise<RecipeContractParityReport> {
  const contractSnapshot = buildGoogleChatRecipeContractSnapshot();
  const archiveSnapshot = await buildGoogleChatArchiveSnapshot();
  const issues: RecipeContractParityIssue[] = [];
  const checks: string[] = [];

  checks.push("package-id");
  if (archiveSnapshot.packageInfo.id !== contractSnapshot.adapterId) {
    issues.push(buildIssue("package-id-mismatch", `Archive package id "${archiveSnapshot.packageInfo.id}" does not match adapter "${contractSnapshot.adapterId}".`));
  }

  checks.push("package-service-url");
  if (archiveSnapshot.packageInfo.config?.serviceURL !== "https://hangouts.google.com") {
    issues.push(buildIssue("service-url-mismatch", `Archive serviceURL "${String(archiveSnapshot.packageInfo.config?.serviceURL ?? "")}" does not match expected "https://hangouts.google.com".`));
  }

  for (const selector of Object.values(contractSnapshot.runtimeConfig.selectors)) {
    if (!selector) continue;
    checks.push(`selector:${selector}`);
    if (!archiveSnapshot.selectorHints.includes(selector)) {
      issues.push(buildIssue("missing-selector-hint", `Archive webview.js is missing expected selector hint "${selector}".`));
    }
  }

  for (const binding of contractSnapshot.runtimeMethods.legacyBindings) {
    checks.push(`method:${binding.legacyKey}`);
    if (!archiveSnapshot.methodHints.includes(binding.legacyKey)) {
      issues.push(buildIssue("missing-method-hint", `Archive webview.js is missing expected legacy method hint "${binding.legacyKey}".`));
    }
  }

  return { adapterId: contractSnapshot.adapterId, ok: issues.length === 0, checks, issues };
}
