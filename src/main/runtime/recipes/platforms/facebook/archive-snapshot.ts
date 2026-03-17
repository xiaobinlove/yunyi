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

const FACEBOOK_ARCHIVE_SELECTOR_HINTS = [
  'div[data-pagelet="MWInboxDetail"] div[role="main"] .xdj266r.x14z9mp.xat24cr.x1lziwak.xexx8yu.xyri2b.x18d9i69.x1c1uobl.x1hl2dhg.x16tdsg8.x1vvkbs.xxymvpz.x1dyh7pn',
  'div[data-pagelet="MWJewelDropdownContent"],div[role="complementary"] div[data-pagelet="RightRail"],div[data-pagelet="ProfileActions"] div[aria-label="发消息"]',
  'div[role="navigation"] .x1qjc9v5.x9f619.xdl72j9.x2lwn1j.xeuugli.x1n2onr6.x1ja2u2z.x78zum5.xdt5ytf.x1iyjqo2.xs83m0k.x6ikm8r.x10wlt62',
  '.xuk3077.x78zum5.x6prxxf.xz9dl7a.xsag5q8 .x1i64zmx.x1emribx.x1y1aw1k.x1sxyh0.xwib8y2.xurb0ha,div[aria-label="按 Enter 键发送"]',
  ".xzsf02u.x1a2a7pz.x1n2onr6.x14wi4xw",
  'div[data-pagelet="MWComposer"]',
];

const FACEBOOK_ARCHIVE_METHOD_HINTS = [
  "getChatInfo",
  "getMsgTxt",
  "getIsMe",
  "getInputMsg",
  "getUnreadCount",
];

function getProjectRootDir(): string {
  return path.resolve(__dirname, "../../../../../..");
}

function getArchivePath(): string {
  return path.join(getProjectRootDir(), "recipes", "archives", "facebook.tar.gz");
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

export async function buildFacebookArchiveSnapshot(): Promise<RecipeArchiveSnapshot> {
  const archivePath = getArchivePath();
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "yunyi-facebook-archive-"));
  try {
    await tar.x({ file: archivePath, cwd: tempDir, preservePaths: true, preserveOwner: false });
    const packageInfo = JSON.parse(readExtractedFile(tempDir, "package.json")) as RecipeArchivePackageSnapshot;
    const webviewSource = readExtractedFile(tempDir, "webview.js");
    return {
      recipeId: "facebook",
      archivePath,
      packageInfo,
      selectorHints: collectHintMatches(webviewSource, FACEBOOK_ARCHIVE_SELECTOR_HINTS),
      methodHints: collectHintMatches(webviewSource, FACEBOOK_ARCHIVE_METHOD_HINTS),
    };
  } finally {
    fs.removeSync(tempDir);
  }
}
