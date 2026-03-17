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

const LINE_ARCHIVE_SELECTOR_HINTS = [
  ".gnb-module__nav_list__wRO2S",
  ".message_list",
  ".chatroomEditor-module__textarea__yKTlH",
  ".chatlistItem-module__chatlist_item__MOwxh",
  ".chatroom-module__chatroom__eVUaK",
  ".textMessageContent-module__text__EFwEN",
  ".friendlist-module__list_wrap__IeJXY",
  ".profileImage-module__thumbnail__Q6OsR",
  ".chatlistItem-module__title_box__aDNJD",
  ".chatlist-module__chatlist_wrap__KtTpq",
  ".chatroomHeader-module__name__t-K11",
  ".metaInfo-module__send_time__-3Q6-",
  "data-direction",
  "data-message-id",
  "data-Talk-Meta",
];

const LINE_ARCHIVE_METHOD_HINTS = [
  "getUnreadCount",
  "getChatInfo",
  "getInputMsg",
  "getMsgInfo",
  "isHistoryMsg",
  "getVoice",
  "getIsMe",
];

function getProjectRootDir(): string {
  return path.resolve(__dirname, "../../../../../..");
}

function getArchivePath(): string {
  return path.join(getProjectRootDir(), "recipes", "archives", "line.tar.gz");
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

export async function buildLineArchiveSnapshot(): Promise<RecipeArchiveSnapshot> {
  const archivePath = getArchivePath();
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "yunyi-line-archive-"));

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
      recipeId: "line",
      archivePath,
      packageInfo,
      selectorHints: collectHintMatches(webviewSource, LINE_ARCHIVE_SELECTOR_HINTS),
      methodHints: collectHintMatches(webviewSource, LINE_ARCHIVE_METHOD_HINTS),
    };
  } finally {
    fs.removeSync(tempDir);
  }
}
