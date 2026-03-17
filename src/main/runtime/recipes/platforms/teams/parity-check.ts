import type { RecipeContractParityIssue, RecipeContractParityReport } from "../../contracts";
import { buildTeamsArchiveSnapshot } from "./archive-snapshot";
import { buildTeamsRecipeContractSnapshot } from "./contract-snapshot";

function buildIssue(code: string, message: string): RecipeContractParityIssue {
  return { code, message };
}
export async function buildTeamsRecipeParityReport(): Promise<RecipeContractParityReport> {
  const contractSnapshot = buildTeamsRecipeContractSnapshot();
  const archiveSnapshot = await buildTeamsArchiveSnapshot();
  const issues: RecipeContractParityIssue[] = [];
  const checks: string[] = [];
  checks.push("package-id");
  if (archiveSnapshot.packageInfo.id !== contractSnapshot.adapterId) issues.push(buildIssue("package-id-mismatch", `Archive package id "${archiveSnapshot.packageInfo.id}" does not match adapter "${contractSnapshot.adapterId}".`));
  checks.push("package-service-url");
  if (archiveSnapshot.packageInfo.config?.serviceURL !== "https://teams.microsoft.com") issues.push(buildIssue("service-url-mismatch", `Archive serviceURL "${String(archiveSnapshot.packageInfo.config?.serviceURL ?? "")}" does not match expected "https://teams.microsoft.com".`));
  for (const selector of Object.values(contractSnapshot.runtimeConfig.selectors)) {
    if (!selector) continue;
    checks.push(`selector:${selector}`);
    if (!archiveSnapshot.selectorHints.includes(selector)) issues.push(buildIssue("missing-selector-hint", `Archive webview.js is missing expected selector hint "${selector}".`));
  }
  for (const binding of contractSnapshot.runtimeMethods.legacyBindings) {
    checks.push(`method:${binding.legacyKey}`);
    if (!archiveSnapshot.methodHints.includes(binding.legacyKey)) issues.push(buildIssue("missing-method-hint", `Archive webview.js is missing expected legacy method hint "${binding.legacyKey}".`));
  }
  return { adapterId: contractSnapshot.adapterId, ok: issues.length === 0, checks, issues };
}
