export interface RecipeRendererHostInputSpec {
  name: string;
  source: string;
  target: string;
  responsibility: string;
  notes?: readonly string[];
}

export interface RecipeRendererHostEffectSpec {
  channel: string;
  currentHandler: string;
  futureLayer: string;
  notes?: readonly string[];
}

export interface RecipeRendererHostHookupSpec {
  componentSurface: string;
  webviewRefBinding: RecipeRendererHostInputSpec;
  initializePayload: RecipeRendererHostInputSpec;
  loadingBinding: RecipeRendererHostInputSpec;
  lifecycleEffects: readonly RecipeRendererHostInputSpec[];
  guestEffects: readonly RecipeRendererHostEffectSpec[];
}
