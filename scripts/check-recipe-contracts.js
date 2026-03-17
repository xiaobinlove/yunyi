const path = require("node:path");

function loadModule(relativePath) {
  return require(path.resolve(relativePath));
}

function printReport(report) {
  const status = report.ok ? "PASS" : "FAIL";
  console.log(`[${status}] ${report.adapterId}`);
  console.log(`  checks: ${report.checks.length}`);

  if (report.issues.length === 0) {
    console.log("  issues: 0");
    return;
  }

  console.log(`  issues: ${report.issues.length}`);
  for (const issue of report.issues) {
    console.log(`  - ${issue.code}: ${issue.message}`);
  }
}

async function main() {
  const reports = [];

  const whatsapp = loadModule("build/main/runtime/recipes/platforms/whatsapp/parity-check.js");
  reports.push(whatsapp.buildWhatsAppRecipeParityReport());

  const telegram = loadModule("build/main/runtime/recipes/platforms/telegram/parity-check.js");
  reports.push(await telegram.buildTelegramRecipeParityReport());
  reports.push(await telegram.buildTelegramKRecipeParityReport());

  const discord = loadModule("build/main/runtime/recipes/platforms/discord/parity-check.js");
  reports.push(await discord.buildDiscordRecipeParityReport());

  const messenger = loadModule("build/main/runtime/recipes/platforms/messenger/parity-check.js");
  reports.push(await messenger.buildMessengerRecipeParityReport());

  const facebook = loadModule("build/main/runtime/recipes/platforms/facebook/parity-check.js");
  reports.push(await facebook.buildFacebookRecipeParityReport());

  const facebookBusiness = loadModule("build/main/runtime/recipes/platforms/facebook-business/parity-check.js");
  reports.push(await facebookBusiness.buildFacebookBusinessRecipeParityReport());

  const googleVoice = loadModule("build/main/runtime/recipes/platforms/google-voice/parity-check.js");
  reports.push(await googleVoice.buildGoogleVoiceRecipeParityReport());

  const googleChat = loadModule("build/main/runtime/recipes/platforms/googlechat/parity-check.js");
  reports.push(await googleChat.buildGoogleChatRecipeParityReport());

  const instagram = loadModule("build/main/runtime/recipes/platforms/instagram/parity-check.js");
  reports.push(await instagram.buildInstagramRecipeParityReport());

  const line = loadModule("build/main/runtime/recipes/platforms/line/parity-check.js");
  reports.push(await line.buildLineRecipeParityReport());

  const lineBusiness = loadModule("build/main/runtime/recipes/platforms/line-business/parity-check.js");
  reports.push(await lineBusiness.buildLineBusinessRecipeParityReport());

  const snapchat = loadModule("build/main/runtime/recipes/platforms/snapchat/parity-check.js");
  reports.push(await snapchat.buildSnapchatRecipeParityReport());

  const teams = loadModule("build/main/runtime/recipes/platforms/teams/parity-check.js");
  reports.push(await teams.buildTeamsRecipeParityReport());

  const tinder = loadModule("build/main/runtime/recipes/platforms/tinder/parity-check.js");
  reports.push(await tinder.buildTinderRecipeParityReport());

  const tiktok = loadModule("build/main/runtime/recipes/platforms/tiktok/parity-check.js");
  reports.push(await tiktok.buildTikTokRecipeParityReport());

  const twitter = loadModule("build/main/runtime/recipes/platforms/twitter/parity-check.js");
  reports.push(await twitter.buildTwitterRecipeParityReport());

  const zalo = loadModule("build/main/runtime/recipes/platforms/zalo/parity-check.js");
  reports.push(await zalo.buildZaloRecipeParityReport());

  const archiveBacked = loadModule("build/main/runtime/recipes/platforms/archive-backed");
  for (const recipeId of archiveBacked.ARCHIVE_BACKED_RECIPE_IDS) {
    reports.push(await archiveBacked.buildArchiveBackedRecipeParityReport(recipeId));
  }

  console.log("Recipe contract parity report");
  console.log("");

  for (const report of reports) {
    printReport(report);
  }

  const failed = reports.filter((report) => !report.ok);
  console.log("");
  console.log(`Summary: ${reports.length - failed.length}/${reports.length} passed`);

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
