const fs = require("node:fs");
const path = require("node:path");
const prettier = require("prettier");

const rootDir = path.resolve(__dirname, "..");
const outputRootDir = path.join(rootDir, "readable");
const sourceDirs = [
  path.join(rootDir, "dist-electron"),
  path.join(rootDir, "dist", "assets"),
];

function listJsFiles(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs.readdirSync(dirPath)
    .filter((entry) => entry.endsWith(".js"))
    .map((entry) => path.join(dirPath, entry));
}

async function formatFile(sourcePath) {
  const source = fs.readFileSync(sourcePath, "utf8");
  const formatted = await prettier.format(source, {
    parser: "babel",
    printWidth: 100,
    semi: true,
    singleQuote: false,
  });

  const relativePath = path.relative(rootDir, sourcePath);
  const outputPath = path.join(outputRootDir, relativePath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, formatted);

  return relativePath;
}

async function main() {
  fs.rmSync(outputRootDir, { recursive: true, force: true });

  const sourceFiles = sourceDirs.flatMap(listJsFiles);
  const formattedFiles = [];

  for (const sourceFile of sourceFiles) {
    formattedFiles.push(await formatFile(sourceFile));
  }

  console.log(
    `Generated ${formattedFiles.length} readable bundle copies in ${path.relative(
      rootDir,
      outputRootDir
    )}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
