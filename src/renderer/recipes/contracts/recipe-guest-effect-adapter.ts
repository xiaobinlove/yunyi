import type {
  GuestToHostRecipeChannel,
  GuestToHostRecipeMessageMap,
} from "../../../main/runtime/recipes/contracts";
import type { RecipeGuestEnvelope } from "./recipe-webview-bridge";

export interface RecipeGuestEffectContext {
  appId: string;
  clientId: string;
  accountId?: string;
}

export interface RecipeGuestEffectAdapter {
  handleEnvelope(envelope: RecipeGuestEnvelope): void;
  handleChannel<Channel extends GuestToHostRecipeChannel>(
    channel: Channel,
    payload: GuestToHostRecipeMessageMap[Channel],
  ): void;
}

export interface RecipeGuestEffectHandlers {
  onInjectJsUnsafe?(sources: string[]): void;
  onSetClientAccount?(payload: Record<string, unknown>): void;
  onSetUnreadCount?(payload: Record<string, unknown>): void;
  onSetOnlineState?(payload: Record<string, unknown>): void;
  onSetContact?(payload: Record<string, unknown>): void;
  onSetContactList?(payload: Record<string, unknown>): void;
  onMessageChanged?(payload: Record<string, unknown>): void;
  onMessageSendSuccess?(payload: Record<string, unknown>): void;
  onUnhandledGuestChannel?(
    channel: GuestToHostRecipeChannel,
    payload: GuestToHostRecipeMessageMap[GuestToHostRecipeChannel],
  ): void;
}

export interface RecipeGuestEffectAdapterOptions extends RecipeGuestEffectHandlers {
  context: RecipeGuestEffectContext;
}
