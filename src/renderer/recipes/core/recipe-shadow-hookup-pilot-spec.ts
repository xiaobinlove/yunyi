import type { RecipeShadowHookupPilotSpec } from "../contracts/recipe-shadow-hookup-pilot";

export const RECIPE_SHADOW_HOOKUP_PILOT_SPEC: RecipeShadowHookupPilotSpec = {
  name: "recipe-shadow-hookup-pilot-v1",
  scope: [
    "mount current webview into shadow runtime",
    "mirror loading transitions into shadow runtime",
    "mirror guest ready channel into shadow runtime",
    "shadow-dispatch initialize-recipe from orchestrator",
  ],
  excludedScope: [
    "do not remove legacy event listeners",
    "do not migrate set-contact or contact-list side effects",
    "do not migrate proxy/fingerprint/session attach logic",
    "do not replace visible UI state ownership",
    "do not change WhatsApp runtime behavior",
  ],
  steps: [
    {
      id: "mount-webview",
      title: "Mount webview into shadow runtime in parallel with Kt",
      currentSurface: "Kt(ref callback) assigns w.value and binds legacy listeners",
      newSurface:
        "createRecipeRendererShadowRuntime().mountWebview(webview) runs alongside legacy binding",
      successSignal:
        "shadow runtime store reflects attached=true and updates url/loading without affecting existing UI behavior",
      rollbackRule:
        "if mirrored state diverges from current behavior, remove only the shadow runtime mount call and keep legacy Kt intact",
    },
    {
      id: "mirror-loading",
      title: "Mirror loading transitions only",
      currentSurface:
        "resetRecipeBridgeState(), clearWebviewLoading(), Vt(), kt(), Ra() mutate z.loading",
      newSurface:
        "orchestrator setLoading callback receives did-start-loading, dom-ready, did-stop-loading, did-finish-load updates",
      successSignal:
        "shadow loading transitions match legacy z.loading transitions across normal load and failure paths",
      rollbackRule:
        "if loading drift is observed, disconnect shadow setLoading and retain legacy z.loading writes",
    },
    {
      id: "mirror-ready",
      title: "Mirror ready channel without removing ge()",
      currentSurface: 'ge() handles "ready" and toggles z.recipeReadyReceived',
      newSurface:
        "controller/orchestrator observe ready through ipc-message and yunyi-ipc-message mirror path",
      successSignal:
        "shadow session store marks readyReceived=true whenever legacy ge() enters the ready branch",
      rollbackRule:
        "if ready ordering differs, disable only shadow guest-envelope handling and keep legacy ge() unchanged",
    },
    {
      id: "dispatch-initialize-recipe",
      title: "Shadow-dispatch initialize-recipe after ready/fallback",
      currentSurface: "ensureRecipeInitialized() sends initialize-recipe directly from component body",
      newSurface:
        "orchestrator ensureRecipeInitialized() dispatches initialize-recipe while legacy path still exists",
      successSignal:
        "shadow init payload matches yn(i.client) and dispatch timing matches ready/dom-ready fallback sequence",
      rollbackRule:
        "if duplicate or mistimed initialize traffic appears, disable only shadow initialize dispatch and revert to legacy ensureRecipeInitialized()",
    },
  ],
};
