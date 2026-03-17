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

const FACEBOOK_BUSINESS_ARCHIVE_SELECTOR_HINTS = [
  '[data-pagelet="BizInboxDetailViewHeaderSectionWrapper"] ._4ik4._4ik5',
  'div[data-pagelet="BizInboxDetailSectionWrapper"]',
  '[data-pagelet="BizP13NInboxUinifiedThreadListView"]',
  '[role="tablist"],nav ul._6no_>div>div:nth-child(5)',
  ".x1yrsyyn.x6x52a7.x10b6aqq.x1egjynq,.x78zum5.xdt5ytf.x2lwn1j.xeuugli.x1r8uery.x1ikap7u",
  'div[data-pagelet="BizInboxDetailSectionWrapper"] textarea,div[data-pagelet="BizInboxDetailSectionWrapper"] [role="textbox"]',
  ".xv54qhq.xwib8y2.xf7dkkf.x1obq294.x5a5i1n.xde0f50.x15x8krk.xt0psk2.xjpr12u",
  "span[data-testid=\"emoji\"]",
  "beforeend",
  "afterend",
  "asset_id",
] as const;

const FACEBOOK_BUSINESS_ARCHIVE_METHOD_HINTS = [
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
  return path.join(getProjectRootDir(), "recipes", "archives", "facebook-business.tar.gz");
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

export async function buildFacebookBusinessArchiveSnapshot(): Promise<RecipeArchiveSnapshot> {
  const archivePath = getArchivePath();
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "yunyi-facebook-business-archive-"));
  try {
    await tar.x({ file: archivePath, cwd: tempDir, preservePaths: true, preserveOwner: false });
    const packageInfo = JSON.parse(
      readExtractedFile(tempDir, "package.json"),
    ) as RecipeArchivePackageSnapshot;
    const webviewSource = readExtractedFile(tempDir, "webview.js");
    return {
      recipeId: "facebook-business",
      archivePath,
      packageInfo,
      selectorHints: collectHintMatches(webviewSource, FACEBOOK_BUSINESS_ARCHIVE_SELECTOR_HINTS),
      methodHints: collectHintMatches(webviewSource, FACEBOOK_BUSINESS_ARCHIVE_METHOD_HINTS),
    };
  } finally {
    fs.removeSync(tempDir);
  }
}
