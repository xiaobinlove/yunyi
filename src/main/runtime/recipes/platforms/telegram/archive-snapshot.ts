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

const TELEGRAM_ARCHIVE_SELECTOR_HINTS = [
  "#Main",
  ".MessageList",
  ".text-content.with-meta",
  ".Transition .LeftSearch",
  "#editable-message-text",
  ".messages-layout .Transition_slide-active #editable-message-text",
  ".ArchivedChats,.NewChat.Transition_slide-active",
  ".ArchivedChats",
  ".NewChat.Transition_slide-active",
  ".chat.tabs-tab.active",
  ".chat.tabs-tab.active .bubbles>.scrollable",
  ".chat.tabs-tab.active .input-message-input",
  ".chat-input.chat-input-main",
  ".chatlist",
  ".popup-input-container .btn-primary",
  ".bubble",
  ".message",
  "[data-mid]",
];

const TELEGRAM_ARCHIVE_METHOD_HINTS = [
  "getChatInfo",
  "getMsgTxt",
  "isHistoryMsg",
  "getIsMe",
  "othersNeedTrans",
];

function getProjectRootDir(): string {
  return path.resolve(__dirname, "../../../../../..");
}

function getArchivePath(recipeId: "telegram" | "telegramk"): string {
  return path.join(getProjectRootDir(), "recipes", "archives", `${recipeId}.tar.gz`);
}

function readExtractedFile(tempDir: string, relativePath: string): string {
  const directPath = path.join(tempDir, relativePath);
  if (fs.pathExistsSync(directPath)) {
    return fs.readFileSync(directPath, "utf8");
  }

  const dottedPath = path.join(tempDir, `.${path.sep}${relativePath}`);
  if (fs.pathExistsSync(dottedPath)) {
    return fs.readFileSync(dottedPath, "utf8");
  }

  throw new Error(`Archive entry not found: ${relativePath}`);
}

function normalizeArchiveSource(source: string): string {
  return source.replace(/\\x([0-9A-Fa-f]{2})/g, (_match, hex: string) =>
    String.fromCharCode(Number.parseInt(hex, 16)),
  );
}

function collectHintMatches(source: string, hints: readonly string[]): string[] {
  const normalizedSource = normalizeArchiveSource(source);
  return hints.filter((hint) => normalizedSource.includes(hint));
}

export async function buildTelegramArchiveSnapshot(
  recipeId: "telegram" | "telegramk" = "telegram",
): Promise<RecipeArchiveSnapshot> {
  const archivePath = getArchivePath(recipeId);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `yunyi-${recipeId}-archive-`));

  try {
    await tar.x({
      file: archivePath,
      cwd: tempDir,
      preservePaths: true,
      preserveOwner: false,
    });

    const packageInfo = JSON.parse(
      readExtractedFile(tempDir, "package.json"),
    ) as RecipeArchivePackageSnapshot;
    const webviewSource = readExtractedFile(tempDir, "webview.js");

    return {
      recipeId,
      archivePath,
      packageInfo,
      selectorHints: collectHintMatches(webviewSource, TELEGRAM_ARCHIVE_SELECTOR_HINTS),
      methodHints: collectHintMatches(webviewSource, TELEGRAM_ARCHIVE_METHOD_HINTS),
    };
  } finally {
    fs.removeSync(tempDir);
  }
}
