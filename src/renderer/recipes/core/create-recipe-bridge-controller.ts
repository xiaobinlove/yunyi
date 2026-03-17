import type {
  GuestToHostRecipeChannel,
  GuestToHostRecipeMessageMap,
  HostToGuestRecipeChannel,
  HostToGuestRecipeMessageMap,
  RecipeInitPayload,
} from "../../../main/runtime/recipes/contracts";
import {
  RECIPE_WEBVIEW_CUSTOM_GUEST_EVENT,
  RECIPE_WEBVIEW_HOST_CHANNEL,
  type RecipeWebviewLifecycleEventName,
  type CustomRecipeGuestEvent,
  type NativeRecipeGuestEvent,
  type RecipeBridgeSenders,
  type RecipeGuestEnvelope,
  type RecipeWebviewLike,
} from "../contracts/recipe-webview-bridge";
import type {
  RecipeBridgeController,
  RecipeBridgeControllerOptions,
} from "../contracts/recipe-webview-controller";
import type { RecipeWebviewMirrorLifecyclePayload } from "../contracts/recipe-webview-mirror";

function isGuestChannel(value: unknown): value is GuestToHostRecipeChannel {
  return typeof value === "string";
}

function getCustomGuestEnvelope(event: unknown): RecipeGuestEnvelope | null {
  const detail = (event as CustomRecipeGuestEvent | null)?.detail;
  if (!detail || !isGuestChannel(detail.channel)) {
    return null;
  }
  return {
    channel: detail.channel,
    payload: detail.args?.[0] as GuestToHostRecipeMessageMap[typeof detail.channel],
    rawEvent: event,
  };
}

function getNativeGuestEnvelope(event: unknown): RecipeGuestEnvelope | null {
  const nativeEvent = event as NativeRecipeGuestEvent | null;
  if (!nativeEvent || !isGuestChannel(nativeEvent.channel)) {
    return null;
  }
  return {
    channel: nativeEvent.channel,
    payload: nativeEvent.args?.[0] as GuestToHostRecipeMessageMap[typeof nativeEvent.channel],
    rawEvent: event,
  };
}

function updateGuestDerivedState(
  patch: ReturnType<RecipeBridgeController["getSnapshot"]>,
  channel: GuestToHostRecipeChannel,
  payload: GuestToHostRecipeMessageMap[GuestToHostRecipeChannel],
) {
  switch (channel) {
    case "ready":
      patch.initialization.readyReceived = true;
      return;
    case "set-client-account":
      patch.clientAccount = payload as Record<string, unknown>;
      return;
    case "set-contact":
      patch.currentContact = payload as Record<string, unknown>;
      return;
    case "set-contact-list":
      patch.contactList = payload as Record<string, unknown>;
      return;
    case "set-unread-count":
      patch.unreadCount = payload as Record<string, unknown>;
      return;
    case "set-online-state":
      patch.onlineState = payload as Record<string, unknown>;
      return;
    default:
      return;
  }
}

export function createRecipeBridgeController(
  options: RecipeBridgeControllerOptions,
): RecipeBridgeController {
  const now = options.now ?? Date.now;
  const { store } = options;
  let webview: RecipeWebviewLike | null = null;

  const dispatchHostMessage = <Channel extends HostToGuestRecipeChannel>(
    channel: Channel,
    payload: HostToGuestRecipeMessageMap[Channel],
  ) => {
    store.patch((snapshot) => ({
      traffic: {
        lastHostChannel: channel,
        lastHostPayload: payload,
      },
      initialization:
        channel === "initialize-recipe"
          ? {
              initializeAttempts: snapshot.initialization.initializeAttempts + 1,
              lastInitializeAt: now(),
              lastInitPayload: payload as RecipeInitPayload,
              initialized: true,
            }
          : snapshot.initialization,
    }));

    webview?.send(RECIPE_WEBVIEW_HOST_CHANNEL, channel, payload);
  };

  const senders: RecipeBridgeSenders = {
    initializeRecipe(payload) {
      dispatchHostMessage("initialize-recipe", payload);
    },
    sendGlobalSettingsUpdate(payload) {
      dispatchHostMessage("global-settings-update", payload);
    },
    sendContactSettingsUpdate(payload) {
      dispatchHostMessage("contact-settings-update", payload);
    },
    sendTranslateHistory(payload) {
      dispatchHostMessage("translate-history", payload);
    },
    sendText(payload) {
      dispatchHostMessage("send-text", payload);
    },
  };

  return {
    ...senders,
    store,
    attachWebview(nextWebview) {
      webview = nextWebview;
      store.patch((snapshot) => ({
        lifecycle: {
          attached: true,
          attachCount: snapshot.lifecycle.attachCount + 1,
          url: nextWebview.getURL?.() ?? snapshot.lifecycle.url,
          loading: nextWebview.isLoading?.() ?? snapshot.lifecycle.loading,
        },
      }));
    },
    detachWebview() {
      webview = null;
      store.patch({
        lifecycle: {
          attached: false,
        },
      });
    },
    handleWebviewLifecycle(
      eventName: RecipeWebviewLifecycleEventName,
      state?: RecipeWebviewMirrorLifecyclePayload,
    ) {
      store.patch((snapshot) => ({
        lifecycle: {
          url: state?.url ?? snapshot.lifecycle.url,
          loading: state?.loading ?? snapshot.lifecycle.loading,
          domReady: eventName === "dom-ready" ? true : snapshot.lifecycle.domReady,
          didFinishLoad:
            eventName === "did-finish-load" ? true : snapshot.lifecycle.didFinishLoad,
          didStopLoading:
            eventName === "did-stop-loading" ? true : snapshot.lifecycle.didStopLoading,
          renderProcessGone:
            eventName === "render-process-gone"
              ? true
              : snapshot.lifecycle.renderProcessGone,
        },
        lastError: state?.error ?? snapshot.lastError,
        initialization:
          eventName === "did-start-loading"
            ? {
                readyReceived: false,
                initialized: false,
              }
            : snapshot.initialization,
      }));
    },
    handleGuestEvent(event) {
      const customEnvelope = getCustomGuestEnvelope(event);
      if (customEnvelope) {
        this.handleGuestMessage(customEnvelope.channel, customEnvelope.payload);
        return customEnvelope;
      }

      const nativeEnvelope = getNativeGuestEnvelope(event);
      if (nativeEnvelope) {
        this.handleGuestMessage(nativeEnvelope.channel, nativeEnvelope.payload);
        return nativeEnvelope;
      }

      return null;
    },
    handleGuestMessage(channel, payload) {
      store.patch((snapshot) => {
        const nextSnapshot = {
          ...snapshot,
          initialization: { ...snapshot.initialization },
          lifecycle: { ...snapshot.lifecycle },
          traffic: {
            ...snapshot.traffic,
            lastGuestChannel: channel,
            lastGuestPayload: payload,
          },
        };

        updateGuestDerivedState(nextSnapshot, channel, payload);
        return nextSnapshot;
      });
    },
    dispatchHostMessage,
    getSnapshot() {
      return store.getSnapshot();
    },
  };
}

export const RECIPE_BRIDGE_CONTROLLER_CUSTOM_EVENT =
  RECIPE_WEBVIEW_CUSTOM_GUEST_EVENT;
