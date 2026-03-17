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

const LINE_BUSINESS_ARCHIVE_SELECTOR_HINTS = [
  "#header-menu",
  "#header-menu .user-name",
  "#header-menu .avatar>div",
  "#content-secondary>div.flex-column.h-100",
  "#content-secondary .sub-header .text-info",
  "#content-secondary .sub-header .text-truncate",
  "#__test__chat_menu_CHAT_ROOM_EMPTY .badge",
  ".chatlist",
  "table.table",
  ".chat-item-text",
  "#editor",
  "#editable-unit",
  '#editable-unit input[type="submit"]',
  "chat-reverse",
];

const LINE_BUSINESS_ARCHIVE_METHOD_HINTS = [
  "getUnreadCount",
  "getChatInfo",
  "getInputMsg",
  "getIsMe",
];

function getProjectRootDir(): string {
  return path.resolve(__dirname, "../../../../../..");
}

function getArchivePath(): string {
  return path.join(getProjectRootDir(), "recipes", "archives", "line-business.tar.gz");
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

export async function buildLineBusinessArchiveSnapshot(): Promise<RecipeArchiveSnapshot> {
  const archivePath = getArchivePath();
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "yunyi-line-business-archive-"));

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
      recipeId: "line-business",
      archivePath,
      packageInfo,
      selectorHints: collectHintMatches(webviewSource, LINE_BUSINESS_ARCHIVE_SELECTOR_HINTS),
      methodHints: collectHintMatches(webviewSource, LINE_BUSINESS_ARCHIVE_METHOD_HINTS),
    };
  } finally {
    fs.removeSync(tempDir);
  }
}
