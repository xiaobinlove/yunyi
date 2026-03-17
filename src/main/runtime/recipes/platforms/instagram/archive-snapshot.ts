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

const INSTAGRAM_ARCHIVE_SELECTOR_HINTS = [
  '[href="/direct/inbox/"]',
  'div[data-pagelet="IGDOpenMessageList"]',
  'div[role="textbox"]',
  '.x1gslohp.x12nagc.x1yc453h.x126k92a',
  '.x6usi7g.x18b5jzi.x1lun4ml.x1vjfegm .x1iyjqo2.xh8yej3>div:last-child a[role="link"][href]',
  '.x1943h6x.x1i0vuye.xl565be.x1s688f.x5n08af.x1tu3fi.x3x7a5m.x10wh9bi.xpm28yp.x8viiok.x1o7cslx',
  '.x9f619.xjbqb8w.x78zum5.x168nmei.x13lgxp2.x5pf9jr.xo71vjh.xw7yly9.xktsk01.x1yztbdb.x1d52u69.x1uhb9sk.x1plvlek.xryxfnj.x1c4vz4f.x2lah0s.xdt5ytf.xqjyukv.x1qjc9v5',
];

const INSTAGRAM_ARCHIVE_METHOD_HINTS = [
  "getChatInfo",
  "getMsgTxt",
  "getIsMe",
  "othersNeedTrans",
  "getInputMsg",
  "getUnreadCount",
];

function getProjectRootDir(): string {
  return path.resolve(__dirname, "../../../../../..");
}

function getArchivePath(): string {
  return path.join(getProjectRootDir(), "recipes", "archives", "instagram.tar.gz");
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

export async function buildInstagramArchiveSnapshot(): Promise<RecipeArchiveSnapshot> {
  const archivePath = getArchivePath();
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "yunyi-instagram-archive-"));

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
      recipeId: "instagram",
      archivePath,
      packageInfo,
      selectorHints: collectHintMatches(webviewSource, INSTAGRAM_ARCHIVE_SELECTOR_HINTS),
      methodHints: collectHintMatches(webviewSource, INSTAGRAM_ARCHIVE_METHOD_HINTS),
    };
  } finally {
    fs.removeSync(tempDir);
  }
}
