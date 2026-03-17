export type RecipeShadowHookupPilotStepId =
  | "mount-webview"
  | "mirror-loading"
  | "mirror-ready"
  | "dispatch-initialize-recipe";

export interface RecipeShadowHookupPilotStep {
  id: RecipeShadowHookupPilotStepId;
  title: string;
  currentSurface: string;
  newSurface: string;
  successSignal: string;
  rollbackRule: string;
}

export interface RecipeShadowHookupPilotSpec {
  name: string;
  scope: readonly string[];
  excludedScope: readonly string[];
  steps: readonly RecipeShadowHookupPilotStep[];
}
