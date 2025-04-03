import { defineConfig } from "rollup";

export default defineConfig({
  // 外部依赖声明（不打包lodash）
  external: ["lodash"],
  // 入口文件
  input: new URL("src/index.js", import.meta.url).pathname,
  // 多格式输出配置
  output: [
    // IIFE 格式（浏览器直接使用）
    {
      file: "dist/iife/bundle.js",
      format: "iife",
      name: "Test", // 全局变量名
      globals: { lodash: "lodash" }, // 外部依赖全局变量映射
    },

    // CommonJS 格式
    {
      file: "dist/cjs/bundle.js",
      format: "cjs",
    },
    // AMD 格式
    {
      file: "dist/amd/bundle.js",
      format: "amd",
      amd: { id: "Test" }, // 模块ID
    },

    // ESM 格式
    {
      file: "dist/esm/bundle.js",
      format: "esm",
    },

    // UMD 格式（通用模块定义）
    {
      file: "dist/umd/bundle.js",
      format: "umd",
      name: "Test", // 全局变量名
      globals: { lodash: "lodash" },
      amd: { id: "Test" }, // 同时支持AMD
    },

    // SystemJS 格式
    {
      file: "dist/system/bundle.js",
      format: "system",
    },
  ],
});
