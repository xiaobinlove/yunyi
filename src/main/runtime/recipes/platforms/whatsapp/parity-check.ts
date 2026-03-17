import type {
  RecipeContractParityIssue,
  RecipeContractParityReport,
  RecipeLegacyConfigValue,
} from "../../contracts";
import { buildWhatsAppHostBridgeSource } from "../../../legacy-recipes-patch-parts/whatsapp-host-bridge";
import { buildWhatsAppRecipeContractSnapshot } from "./contract-snapshot";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasLegacyConfigAssignment(
  source: string,
  key: string,
  value: RecipeLegacyConfigValue,
): boolean {
  if (key === "chatDelay" || key === "initChatDelay") {
    return source.includes(`t.${key}=Math.max(`);
  }

  if (typeof value === "string") {
    return source.includes(`t.${key}="${value}"`);
  }

  if (typeof value === "boolean") {
    return source.includes(`t.${key}=${value ? "!0" : "!1"}`);
  }

  if (typeof value === "number") {
    return source.includes(`t.${key}=${String(value)}`);
  }

  if (value === null) {
    return source.includes(`t.${key}=null`);
  }

  return false;
}

function hasLegacyMethodBinding(source: string, legacyKey: string): boolean {
  const directAssignment = new RegExp(`o\\.${escapeRegExp(legacyKey)}=function\\(`);
  return directAssignment.test(source);
}

function buildIssue(code: string, message: string): RecipeContractParityIssue {
  return { code, message };
}

export function buildWhatsAppRecipeParityReport(): RecipeContractParityReport {
  const snapshot = buildWhatsAppRecipeContractSnapshot();
  const bridgeSource = buildWhatsAppHostBridgeSource();
  const issues: RecipeContractParityIssue[] = [];
  const checks: string[] = [];

  checks.push("patchRecipeRuntimeConfig");
  if (!bridgeSource.includes("patchRecipeRuntimeConfig(")) {
    issues.push(buildIssue("missing-patch-recipe-runtime-config", "Missing patchRecipeRuntimeConfig in host bridge."));
  }

  checks.push("normalizePayload");
  if (!bridgeSource.includes("normalizePayload(")) {
    issues.push(buildIssue("missing-normalize-payload", "Missing normalizePayload in host bridge."));
  }

  checks.push("wrapCustomEvent");
  if (!bridgeSource.includes("wrapCustomEvent(")) {
    issues.push(buildIssue("missing-wrap-custom-event", "Missing wrapCustomEvent in host bridge."));
  }

  checks.push("extractMessageText");
  if (!bridgeSource.includes("extractMessageText(")) {
    issues.push(buildIssue("missing-extract-message-text", "Missing extractMessageText helper in host bridge."));
  }

  const legacyConfig = snapshot.migration?.legacyConfigOverrides ?? {};
  for (const [key, value] of Object.entries(legacyConfig)) {
    checks.push(`legacy-config:${key}`);
    if (!hasLegacyConfigAssignment(bridgeSource, key, value)) {
      issues.push(
        buildIssue(
          "missing-legacy-config",
          `Host bridge is missing expected legacy config assignment for "${key}".`,
        ),
      );
    }
  }

  for (const binding of snapshot.runtimeMethods.legacyBindings) {
    checks.push(`legacy-method:${binding.legacyKey}`);
    if (!hasLegacyMethodBinding(bridgeSource, binding.legacyKey)) {
      issues.push(
        buildIssue(
          "missing-legacy-method-binding",
          `Host bridge is missing expected legacy method binding for "${binding.legacyKey}".`,
        ),
      );
    }
  }

  for (const channel of snapshot.bridge.hostToGuestChannels) {
    checks.push(`bridge-host-to-guest:${channel}`);
  }

  for (const channel of snapshot.bridge.guestToHostChannels) {
    checks.push(`bridge-guest-to-host:${channel}`);
  }

  return {
    adapterId: snapshot.adapterId,
    ok: issues.length === 0,
    checks,
    issues,
  };
}
