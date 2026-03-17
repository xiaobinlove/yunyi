import type { RecipeContractParityIssue, RecipeContractParityReport } from "../../contracts";
import { buildLineBusinessArchiveSnapshot } from "./archive-snapshot";
import { buildLineBusinessRecipeContractSnapshot } from "./contract-snapshot";

function buildIssue(code: string, message: string): RecipeContractParityIssue {
  return { code, message };
}

function getSelectorCandidates(selector: string): string[] {
  return selector
    .split(",")
    .map((candidate) => candidate.trim())
    .filter(Boolean);
}

export async function buildLineBusinessRecipeParityReport(): Promise<RecipeContractParityReport> {
  const contractSnapshot = buildLineBusinessRecipeContractSnapshot();
  const archiveSnapshot = await buildLineBusinessArchiveSnapshot();
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

  checks.push("package-service-url");
  const expectedServiceUrl = "https://chat.line.biz/";
  if (archiveSnapshot.packageInfo.config?.serviceURL !== expectedServiceUrl) {
    issues.push(
      buildIssue(
        "service-url-mismatch",
        `Archive serviceURL "${String(archiveSnapshot.packageInfo.config?.serviceURL ?? "")}" does not match expected "${expectedServiceUrl}".`,
      ),
    );
  }

  for (const selector of Object.values(contractSnapshot.runtimeConfig.selectors)) {
    if (!selector) {
      continue;
    }
    checks.push(`selector:${selector}`);
    const selectorCandidates = getSelectorCandidates(selector);
    const hasMatchingCandidate = selectorCandidates.some((candidate) =>
      archiveSnapshot.selectorHints.includes(candidate),
    );
    if (!hasMatchingCandidate) {
      issues.push(
        buildIssue(
          "missing-selector-hint",
          `Archive webview.js is missing expected selector hint for "${selector}".`,
        ),
      );
    }
  }

  for (const binding of contractSnapshot.runtimeMethods.legacyBindings) {
    checks.push(`method:${binding.legacyKey}`);
    if (!archiveSnapshot.methodHints.includes(binding.legacyKey)) {
      issues.push(
        buildIssue(
          "missing-method-hint",
          `Archive webview.js is missing expected legacy method hint "${binding.legacyKey}".`,
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
