import {
  RECIPE_WEBVIEW_CUSTOM_GUEST_EVENT,
  RECIPE_WEBVIEW_GUEST_EVENT,
  RECIPE_WEBVIEW_LIFECYCLE_EVENTS,
  type RecipeWebviewLifecycleEventName,
} from "../contracts/recipe-webview-bridge";
import type {
  RecipeWebviewMirrorBinding,
  RecipeWebviewMirrorLifecyclePayload,
  RecipeWebviewMirrorOptions,
} from "../contracts/recipe-webview-mirror";

function readWebviewState(
  webview: RecipeWebviewMirrorOptions["webview"],
): RecipeWebviewMirrorLifecyclePayload {
  return {
    url: webview.getURL?.(),
    loading: webview.isLoading?.(),
  };
}

function getLifecyclePayload(
  webview: RecipeWebviewMirrorOptions["webview"],
  eventName: RecipeWebviewLifecycleEventName,
  rawEvent: unknown,
): RecipeWebviewMirrorLifecyclePayload {
  const base = readWebviewState(webview);
  const eventRecord =
    rawEvent && typeof rawEvent === "object" ? (rawEvent as Record<string, unknown>) : undefined;

  if (eventName === "did-fail-load") {
    return {
      ...base,
      error:
        typeof eventRecord?.errorDescription === "string"
          ? eventRecord.errorDescription
          : undefined,
    };
  }

  if (eventName === "render-process-gone") {
    const details =
      eventRecord?.details && typeof eventRecord.details === "object"
        ? (eventRecord.details as Record<string, unknown>)
        : undefined;

    return {
      ...base,
      error: typeof details?.reason === "string" ? details.reason : undefined,
    };
  }

  return base;
}

export function bindRecipeWebviewMirror(
  options: RecipeWebviewMirrorOptions,
): RecipeWebviewMirrorBinding {
  const { controller, onGuestEnvelope, webview } = options;
  const unbinds: Array<() => void> = [];

  controller.attachWebview(webview);

  const bind = (eventName: string, listener: (event: unknown) => void) => {
    if (typeof webview.addEventListener !== "function") {
      return;
    }

    webview.addEventListener(eventName, listener);
    unbinds.push(() => {
      webview.removeEventListener?.(eventName, listener);
    });
  };

  for (const eventName of RECIPE_WEBVIEW_LIFECYCLE_EVENTS) {
    bind(eventName, (event) => {
      controller.handleWebviewLifecycle(
        eventName,
        getLifecyclePayload(webview, eventName, event),
      );
    });
  }

  const handleGuestEvent = (event: unknown) => {
    const envelope = controller.handleGuestEvent(event);
    if (envelope) {
      onGuestEnvelope?.(envelope);
    }
  };

  bind(RECIPE_WEBVIEW_GUEST_EVENT, handleGuestEvent);
  bind(RECIPE_WEBVIEW_CUSTOM_GUEST_EVENT, handleGuestEvent);

  return {
    webview,
    controller,
    detach() {
      while (unbinds.length > 0) {
        const unbind = unbinds.pop();
        unbind?.();
      }
      controller.detachWebview();
    },
  };
}
