import { archiveBackedRecipeAdapters } from "../platforms/archive-backed";
import { discordRecipeAdapter } from "../platforms/discord";
import { facebookRecipeAdapter } from "../platforms/facebook";
import { facebookBusinessRecipeAdapter } from "../platforms/facebook-business";
import { googleVoiceRecipeAdapter } from "../platforms/google-voice";
import { googleChatRecipeAdapter } from "../platforms/googlechat";
import { instagramRecipeAdapter } from "../platforms/instagram";
import { lineBusinessRecipeAdapter } from "../platforms/line-business";
import { lineRecipeAdapter } from "../platforms/line";
import { messengerRecipeAdapter } from "../platforms/messenger";
import { snapchatRecipeAdapter } from "../platforms/snapchat";
import { teamsRecipeAdapter } from "../platforms/teams";
import {
  telegramKRecipeAdapter,
  telegramRecipeAdapter,
} from "../platforms/telegram";
import { tinderRecipeAdapter } from "../platforms/tinder";
import { tikTokRecipeAdapter } from "../platforms/tiktok";
import { twitterRecipeAdapter } from "../platforms/twitter";
import { whatsappRecipeAdapter } from "../platforms/whatsapp";
import { zaloRecipeAdapter } from "../platforms/zalo";
import { createRecipeAdapterRegistry, type RecipeAdapterRegistry } from "./recipe-adapter-registry";

export function createDefaultRecipeAdapterRegistry(): RecipeAdapterRegistry {
  return createRecipeAdapterRegistry([
    whatsappRecipeAdapter,
    telegramRecipeAdapter,
    telegramKRecipeAdapter,
    discordRecipeAdapter,
    messengerRecipeAdapter,
    facebookRecipeAdapter,
    facebookBusinessRecipeAdapter,
    googleVoiceRecipeAdapter,
    googleChatRecipeAdapter,
    instagramRecipeAdapter,
    lineRecipeAdapter,
    lineBusinessRecipeAdapter,
    snapchatRecipeAdapter,
    teamsRecipeAdapter,
    tinderRecipeAdapter,
    tikTokRecipeAdapter,
    twitterRecipeAdapter,
    zaloRecipeAdapter,
    ...archiveBackedRecipeAdapters,
  ]);
}
