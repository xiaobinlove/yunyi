export function joinScriptFragments(fragments: readonly string[]): string {
  return fragments.join("\n");
}

export function wrapScriptInIife(bodyFragments: readonly string[]): string {
  return joinScriptFragments([String.raw`(() => {`, ...bodyFragments, String.raw`})();`]);
}

export function toScriptLiteral(value: unknown): string {
  return JSON.stringify(value);
}
