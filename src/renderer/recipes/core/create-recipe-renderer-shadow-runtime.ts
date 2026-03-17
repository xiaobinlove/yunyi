import type {
  RecipeRendererShadowRuntime,
  RecipeRendererShadowRuntimeOptions,
} from "../contracts/recipe-renderer-shadow-runtime";
import { bindRecipeWebviewMirror } from "./bind-recipe-webview-mirror";
import { createRecipeBridgeController } from "./create-recipe-bridge-controller";
import { createRecipeBridgeOrchestrator } from "./create-recipe-bridge-orchestrator";
import { createRecipeSessionStore } from "./create-recipe-session-store";

export function createRecipeRendererShadowRuntime(
  options: RecipeRendererShadowRuntimeOptions,
): RecipeRendererShadowRuntime {
  const store = createRecipeSessionStore();
  const controller = createRecipeBridgeController({
    store,
    now: options.now,
  });
  const orchestrator = createRecipeBridgeOrchestrator({
    controller,
    getInitializePayload: options.getInitializePayload,
    initializeDelayMs: options.initializeDelayMs,
    now: options.now,
    setLoading: options.setLoading,
    onInitializeError: options.onInitializeError,
  });
  let binding: ReturnType<typeof bindRecipeWebviewMirror> | null = null;

  const unsubscribe =
    typeof options.onSnapshot === "function" ? store.subscribe(options.onSnapshot) : () => {};

  return {
    store,
    controller,
    orchestrator,
    mountWebview(webview) {
      binding?.detach();
      binding = bindRecipeWebviewMirror({
        webview,
        controller,
        onGuestEnvelope: (envelope) => {
          orchestrator.handleGuestEnvelope(envelope);
          options.onGuestEnvelope?.(envelope);
        },
      });
      return binding;
    },
    unmountWebview() {
      binding?.detach();
      binding = null;
    },
    getSnapshot() {
      return store.getSnapshot();
    },
    subscribe(listener) {
      return store.subscribe(listener);
    },
    destroy() {
      binding?.detach();
      binding = null;
      unsubscribe();
      orchestrator.dispose();
    },
  };
}
