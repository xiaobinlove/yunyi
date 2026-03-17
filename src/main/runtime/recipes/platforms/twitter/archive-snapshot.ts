import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import type { RecipeArchivePackageSnapshot, RecipeArchiveSnapshot } from "../../contracts";

type TarModule = {
  x(options: {
    file: string;
    cwd: string;
    preservePaths?: boolean;
    preserveOwner?: boolean;
  }): Promise<void>;
};

const tar = require("tar") as TarModule;

const TWITTER_ARCHIVE_SELECTOR_HINTS = [
  'button[data-testid="SideNav_AccountSwitcher_Button"]',
  '[data-testid="dm-message-list"] ul',
  '[data-testid="dm-inbox-panel"]',
  '[data-testid="AppTabBar_DirectMessage_Link"]',
  '[data-testid*="message-text-"] .text-body .text-body',
  '[data-testid="dm-composer-form"] [data-testid="dm-composer-textarea"]',
  '[data-testid="dm-composer-form"] [data-testid="dm-composer-send-button"]',
] as const;

const TWITTER_ARCHIVE_METHOD_HINTS = [
  "getChatInfo",
  "getMsgTxt",
  "getIsMe",
  "getInputMsg",
  "getUnreadCount",
] as const;

function getProjectRootDir(): string {
  return path.resolve(__dirname, "../../../../../..");
}

function getArchivePath(): string {
  return path.join(getProjectRootDir(), "recipes", "archives", "twitter.tar.gz");
}

function readExtractedFile(tempDir: string, relativePath: string): string {
  const directPath = path.join(tempDir, relativePath);
  if (fs.pathExistsSync(directPath)) return fs.readFileSync(directPath, "utf8");
  const dottedPath = path.join(tempDir, `.${path.sep}${relativePath}`);
  if (fs.pathExistsSync(dottedPath)) return fs.readFileSync(dottedPath, "utf8");
  throw new Error(`Archive entry not found: ${relativePath}`);
}

function normalizeArchiveSource(source: string): string {
  return source.replace(/\\x([0-9A-Fa-f]{2})/g, (_m, hex: string) =>
    String.fromCharCode(Number.parseInt(hex, 16)),
  );
}

function collectHintMatches(source: string, hints: readonly string[]): string[] {
  const normalized = normalizeArchiveSource(source);
  return hints.filter((hint) => normalized.includes(hint));
}

export async function buildTwitterArchiveSnapshot(): Promise<RecipeArchiveSnapshot> {
  const archivePath = getArchivePath();
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "yunyi-twitter-archive-"));
  try {
    await tar.x({ file: archivePath, cwd: tempDir, preservePaths: true, preserveOwner: false });
    const packageInfo = JSON.parse(
      readExtractedFile(tempDir, "package.json"),
    ) as RecipeArchivePackageSnapshot;
    const webviewSource = readExtractedFile(tempDir, "webview.js");
    return {
      recipeId: "twitter",
      archivePath,
      packageInfo,
      selectorHints: collectHintMatches(webviewSource, TWITTER_ARCHIVE_SELECTOR_HINTS),
      methodHints: collectHintMatches(webviewSource, TWITTER_ARCHIVE_METHOD_HINTS),
    };
  } finally {
    fs.removeSync(tempDir);
  }
}
