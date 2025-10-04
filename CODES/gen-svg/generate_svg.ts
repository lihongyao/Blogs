import { execSync } from "child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// 模擬 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, ".."); // 假設 scripts/ 在 web/ 裡
const ICONS_DIR = path.join(projectRoot, "public", "icons");

// 讀取所有子資料夾及其子檔案（僅 svg）
function walkDir(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });

  list.forEach((item) => {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results = results.concat(walkDir(fullPath));
    } else if (item.isFile() && fullPath.endsWith(".svg")) {
      results.push(fullPath);
    }
  });

  return results;
}

// 取得所有 svg 檔案的完整路徑
const svgFiles = walkDir(ICONS_DIR);

// 把路徑轉換成指定字串格式
const svgNames = svgFiles.map((fullPath) => {
  const relative = path.relative(ICONS_DIR, fullPath); // 相對於 icons 資料夾
  const noExt = relative.replace(/\.svg$/i, ""); // 去掉 .svg
  return noExt.split(path.sep).join("/"); // 統一為 '/' 分隔
});

const output = `export const SVG_PATH_NAMES = [\n  ${svgNames.map((n) => `"${n}"`).join(",\n  ")}\n,] as const;\n`;

const outputFile = path.join(
  projectRoot,
  "src",
  "components",
  "svgPath_all.ts",
);

fs.writeFileSync(outputFile, output, "utf8");

execSync(`npx prettier --write ${outputFile}`, { stdio: "inherit" });

console.log(`✔️  Generated ${outputFile}`);
