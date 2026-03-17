import type { RecipeContractParityIssue, RecipeContractParityReport } from "../../contracts";
import { buildTelegramArchiveSnapshot } from "./archive-snapshot";
import {
  buildTelegramKRecipeContractSnapshot,
  buildTelegramRecipeContractSnapshot,
} from "./contract-snapshot";

function buildIssue(code: string, message: string): RecipeContractParityIssue {
  return { code, message };
}

function getSelectorCandidates(selector: string): string[] {
  return selector
    .split(",")
    .map((candidate) => candidate.trim())
    .filter(Boolean);
}

async function buildTelegramParityReport(
  recipeId: "telegram" | "telegramk",
): Promise<RecipeContractParityReport> {
  const contractSnapshot =
    recipeId === "telegram"
      ? buildTelegramRecipeContractSnapshot()
      : buildTelegramKRecipeContractSnapshot();
  const archiveSnapshot = await buildTelegramArchiveSnapshot(recipeId);
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

  const expectedServiceUrl =
    recipeId === "telegram" ? "https://web.telegram.org/a/" : "https://web.telegram.org/k/";
  checks.push("package-service-url");
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

export function buildTelegramRecipeParityReport(): Promise<RecipeContractParityReport> {
  return buildTelegramParityReport("telegram");
}

export function buildTelegramKRecipeParityReport(): Promise<RecipeContractParityReport> {
  return buildTelegramParityReport("telegramk");
}
