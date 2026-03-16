const fs = require("node:fs");
const path = require("node:path");
const tar = require("tar");

const rootDir = path.resolve(__dirname, "..");
const distRecipesDir = path.join(rootDir, "dist", "recipes");
const archivesDir = path.join(rootDir, "recipes", "archives");
const appsJsonPath = path.join(distRecipesDir, "apps.json");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function removeStaleArchives(validArchiveNames) {
  if (!fs.existsSync(archivesDir)) {
    return;
  }

  for (const entry of fs.readdirSync(archivesDir)) {
    if (!entry.endsWith(".tar.gz")) {
      continue;
    }
    if (validArchiveNames.has(entry)) {
      continue;
    }
    fs.rmSync(path.join(archivesDir, entry), { force: true });
  }
}

async function packRecipe(recipeId) {
  const recipeDir = path.join(distRecipesDir, recipeId);
  const recipePackagePath = path.join(recipeDir, "package.json");

  if (!fs.existsSync(recipePackagePath)) {
    throw new Error(`Missing recipe package: ${recipePackagePath}`);
  }

  const archivePath = path.join(archivesDir, `${recipeId}.tar.gz`);
  fs.rmSync(archivePath, { force: true });

  await tar.create(
    {
      cwd: recipeDir,
      file: archivePath,
      gzip: true,
      portable: true,
    },
    ["."]
  );
}

async function main() {
  if (!fs.existsSync(appsJsonPath)) {
    throw new Error(`Missing apps.json: ${appsJsonPath}`);
  }

  ensureDir(archivesDir);

  const apps = readJson(appsJsonPath);
  fs.copyFileSync(appsJsonPath, path.join(archivesDir, "apps.json"));

  const validArchiveNames = new Set();
  for (const app of apps) {
    validArchiveNames.add(`${app.id}.tar.gz`);
    await packRecipe(app.id);
  }

  removeStaleArchives(validArchiveNames);

  console.log(
    `Prepared ${apps.length} recipe archives in ${path.relative(rootDir, archivesDir)}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
