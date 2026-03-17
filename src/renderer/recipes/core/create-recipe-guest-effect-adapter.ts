import type {
  GuestToHostRecipeChannel,
  GuestToHostRecipeMessageMap,
} from "../../../main/runtime/recipes/contracts";
import type {
  RecipeGuestEffectAdapter,
  RecipeGuestEffectAdapterOptions,
} from "../contracts/recipe-guest-effect-adapter";

function toRecordPayload(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function createRecipeGuestEffectAdapter(
  options: RecipeGuestEffectAdapterOptions,
): RecipeGuestEffectAdapter {
  const handleChannel = <Channel extends GuestToHostRecipeChannel>(
    channel: Channel,
    payload: GuestToHostRecipeMessageMap[Channel],
  ) => {
    switch (channel) {
      case "inject-js-unsafe":
        options.onInjectJsUnsafe?.(Array.isArray(payload) ? payload : []);
        return;
      case "set-client-account":
        options.onSetClientAccount?.(toRecordPayload(payload));
        return;
      case "set-unread-count":
        options.onSetUnreadCount?.(toRecordPayload(payload));
        return;
      case "set-online-state":
        options.onSetOnlineState?.(toRecordPayload(payload));
        return;
      case "set-contact":
        options.onSetContact?.(toRecordPayload(payload));
        return;
      case "set-contact-list":
        options.onSetContactList?.(toRecordPayload(payload));
        return;
      case "message-changed":
        options.onMessageChanged?.(toRecordPayload(payload));
        return;
      case "message-send-success":
        options.onMessageSendSuccess?.(toRecordPayload(payload));
        return;
      default:
        options.onUnhandledGuestChannel?.(
          channel,
          payload as GuestToHostRecipeMessageMap[GuestToHostRecipeChannel],
        );
    }
  };

  return {
    handleEnvelope(envelope) {
      handleChannel(envelope.channel, envelope.payload);
    },
    handleChannel,
  };
}
