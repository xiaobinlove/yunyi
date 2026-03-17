export interface RecipeShadowHookupPilotChecklistItem {
  id: string;
  check: string;
  expected: string;
}

export const RECIPE_SHADOW_HOOKUP_PILOT_CHECKLIST: readonly RecipeShadowHookupPilotChecklistItem[] =
  [
    {
      id: "mount",
      check: "Mount a live webview through the shadow runtime without removing Kt",
      expected:
        "Legacy UI continues to work and shadow runtime snapshot shows lifecycle.attached=true",
    },
    {
      id: "loading",
      check:
        "Observe did-start-loading, dom-ready, did-stop-loading, did-finish-load through shadow runtime",
      expected: "Shadow loading transitions mirror legacy loading state changes",
    },
    {
      id: "ready",
      check: 'Observe guest channel "ready" through shadow runtime',
      expected:
        "Shadow snapshot initialization.readyReceived=true while legacy ge() still runs",
    },
    {
      id: "initialize",
      check:
        "Compare shadow initialize payload and dispatch timing to legacy yn()/ensureRecipeInitialized()",
      expected: "No payload drift and no duplicate initialize behavior reaches production path",
    },
  ];
