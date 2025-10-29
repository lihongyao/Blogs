// convert-css-vars.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// 路径处理
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 输入输出路径
const INPUT_FILE = path.resolve(__dirname, "./input.css");
const OUTPUT_FILE = path.resolve(__dirname, "./output.css");

// 正则表达式
const varRegex = /(--[^:]+):\s*([^;]+);/g;
const colorRegex = /#[0-9a-fA-F]{3,8}|rgba?\(.*?\)|oklch\(.*?\)|hsla?\(.*?\)/;

// 时间戳
const timestamp = new Date().toLocaleString();

// 从命令行参数判断是否生成 Tailwind 块
const generateTailwind = process.argv.includes("--tw");

// 主逻辑
function convertCssVars() {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ 找不到输入文件：${INPUT_FILE}`);
    return;
  }

  const content = fs.readFileSync(INPUT_FILE, "utf-8");
  const variables = [];
  let match;

  while ((match = varRegex.exec(content)) !== null) {
    const fullVar = match[1].trim();
    const value = match[2].trim();

    const nameMatch = fullVar.match(/_(.+)$/);
    if (!nameMatch) continue;

    const enName = nameMatch[1].trim().toLowerCase();
    variables.push({ original: fullVar, en: enName, value });
  }

  if (variables.length === 0) {
    console.warn("⚠️ 未检测到 CSS 变量。");
    return;
  }

  // 构建输出内容
  let output = `/* 由 convert-css-vars.js 自动生成 */\n/* 更新时间: ${timestamp} */\n\n`;

  // ---------- :root ----------
  output += `:root {\n`;
  for (const v of variables) {
    output += `  --${v.en}: ${v.value}; /* ${v.original} */\n`;
  }
  output += `}\n`;

  // ---------- Tailwind @theme ----------
  if (generateTailwind) {
    output += `\n/* Tailwind CSS Theme Variables */\n/* prettier-ignore */\n@theme {\n`;

    for (const v of variables) {
      let twPrefix = "";
      if (colorRegex.test(v.value)) twPrefix = "color-";
      else if (v.en.includes("shadow")) twPrefix = "shadow-";
      else if (v.en.includes("text")) twPrefix = "text-";
      else if (v.en.includes("radius")) twPrefix = "radius-";
      else if (v.en.includes("spacing") || v.en.includes("margin") || v.en.includes("padding")) twPrefix = "spacing-";
      else if (v.en.includes("z")) twPrefix = "z-";
      else if (v.en.includes("blur")) twPrefix = "blur-";
      else if (v.en.includes("transition") || v.en.includes("animate")) twPrefix = "transition-";
      else twPrefix = "color-";

      output += `  --${twPrefix}${v.en}: var(--${v.en}); /* ${v.original} */\n`;
    }

    output += `}\n`;
  }

  fs.writeFileSync(OUTPUT_FILE, output, "utf-8");

  console.log(`✅ 转换完成！`);
  console.log(`输入文件: ${path.basename(INPUT_FILE)}`);
  console.log(`输出文件: ${path.basename(OUTPUT_FILE)}`);
  console.log(`Tailwind 变量块: ${generateTailwind ? "✅ 已生成" : "❌ 未生成"}`);
}

// 执行
convertCssVars();
