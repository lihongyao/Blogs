# 摘要

本文详解 Monorepo 的概念、优缺点及适用场景，并结合 pnpm、Biome、Rollup 等工具，手把手教你搭建 JS/TS 工具库集，规范开发流程，实现高效协作与统一管理。

# 概述

[MonoRepo ↪](https://zh.wikipedia.org/wiki/Monorepo) 是一种将 **多个项目** 代码存储在 **单一仓库** 的开发策略。

简单理解：在一个仓库中管理多个项目。

相比之下：

- **Multi-repo** 每个项目独立仓库，逻辑清晰，但协作繁琐；
- **Mono-repo** 易于跨项目协作，但操作复杂度较高。

![](./IMGS/law7gi1g089y.png)

> 推荐阅读：[现代前端工程为什么越来越离不开 Monorepo?](https://juejin.cn/post/6944877410827370504)

一个简单的monorepo的目录结构类似这样：

```
/monorepo-examples
├── package.json
├── packages
│   ├── pkg1/package.json
│   └── pkg2/package.json
├── pnpm-workspace.yaml
└── README.md
```

## 优缺点

### 优势

1. 统一依赖管理
2. 高效代码复用
3. 跨项目协作便捷
4. 集中构建流程

### 劣势

1. 版本控制复杂
2. 低质量代码风险
3. 技术升级困难
4. 权限控制挑战

> 推荐阅读：[浅尝 Monorepo ↪](https://blog.meathill.com/tech/some-basic-experience-about-monorepo.html)

### 适用场景

2. 强依赖关系的多项目
2. 版本同步要求高
3. 多入口构建
4. 知识共享与管理成本优化

## 技术选型

推荐：[pnpm ↪](https://pnpm.io/workspaces)

1. 安装速度快，存储高效
2. 清晰隔离依赖
3. 完善的 Monorepo 命令集

# 实战：Rollup + Monorepo 搭建工具库

接下来，我们将一步步带你使用 rollup + monorepo 搭建自己的工具库集。

## 1. 定义目录结构

① 新建仓库并初始化 **`package.json`**

```shell
$ mkdir js-libs && cd js-libs && pnpm init && code .
```

> 提示
>
> 1. `js-libs` 为你的 monorepo 仓库名，可根据需要自定义。
> 2. 如果未安装 pnpm，可通过 npm 安装：`npm i -g pnpm`

② 指定 Node 和 pnpm 版本

为了避免不同环境的版本差异导致的问题，在 package.json 中添加 `engines` 字段：

```json
{
  "engines": {
    "node": ">=25",
    "pnpm": ">=10"
  },
}
```

④ 设置私有项目

防止根目录被误当作可发布包，需要在 package.json 中添加：

```json
{
	"private": true
}
```

⑤ 初始化 pnpm-workspace.yaml 并指定 [工作空间](https://pnpm.io/zh/workspaces)，参考 [这里↪](https://pnpm.io/zh/pnpm-workspace_yaml)

```yaml
packages:
  - 'packages/*'
```

> 提示：
>
> 1. 根目录新建 `pnpm-workspace.yaml` 文件，并填入上述内容。
> 2. 根目录下创建 `packages` 目录，里面每个一级目录就是一个独立的 JS 库。

## 2. 定义开发规范

### Biome

接下来，我们将一步步基于 [**Biome ↪**](https://biomejs.dev/zh-cn/) 搭建从 0 到 1 的 JS/TS 工具库开发规范，替代 ESLint + Prettier。

1️⃣ 在 monorepo 根目录下安装 Biome CLI：

```shell
$ pnpm add -D -w @biomejs/biome
```

指令说明：

- `-D`：作为 devDependency
- `-w`：安装到 workspace 根目录

安装完成后，你就可以在根目录使用 biome 命令。

2️⃣ 初始化配置

在根目录执行：

```shell
$ pnpm exec biome init
```

会生成 `biome.json` 文件，用于统一配置 lint、format、type-check。

3️⃣ 配置 biome.json

暂时保持官方推荐即可。

参考配置：https://biomejs.dev/reference/configuration/

4️⃣ 添加脚本

```json
{
  "scripts": {
    "check": "biome check",
    "lint": "biome lint",
    "format": "biome format"
  }
}
```

- check：全套检查（lint + format + type）
- lint：语法检查
- format：自动格式化代码

5️⃣ 配置 VS Code

1、安装 [Biome VS Code 扩展 ↪](https://marketplace.visualstudio.com/items?itemName=biomejs.biome)，快捷键 <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>X</kbd>

2、快捷键 <kbd>Cmd</kbd> + <kbd>,</kbd> 搜索 Editor: Default Formatter，选择 Biome 作为默认格式化程序

3、搜索 Editor: Format On Save，☑️ 保存时设置文件格式

### Commit 规范检查

推荐：Conventional Commits + Husky + lint-staged + Commitlint

这套组合可以在提交前自动检查代码规范、校验 commit 信息格式，并提供交互式的提交体验。

1、安装依赖

```shell
$ pnpm add -D -w husky lint-staged @commitlint/{config-conventional,cli} 
```

2、在 `package.json` 中配置 `lint-staged`

```json
"lint-staged": {
  "*.{js,jsx,ts,tsx}": [
    "pnpm lint"
  ]
},
```

当你执行 git commit 时，lint-staged 会自动运行 pnpm lint 来检查暂存区的文件，防止格式或语法问题被提交。

3、初始化 husky

```shell
$ pnpm husky init
```

这会自动创建 .husky/ 目录和一个默认的 pre-commit 钩子。

4、配置 pre-commit 钩子，编辑 .husky/pre-commit 文件：

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# 在提交前执行代码格式化与检查
pnpm lint-staged
```

提交前会自动运行 lint-staged，确保提交的代码风格、语法正确。

5、配置 commit-msg 钩子，创建 .husky/commit-msg 文件：

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm commitlint --edit "$1"
```

这个钩子会在每次提交时校验你的提交信息是否符合 Conventional Commits 规范。

6、创建 commitlint 配置，在项目根目录新建 `commitlint.config.js`：

```js
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",      // ✨ 新功能
        "fix",       // 🐛 修复 bug
        "docs",      // 📝 文档更新
        "style",     // 💅 代码格式（不影响逻辑）
        "refactor",  // ♻️ 重构（非新增功能、非修复）
        "perf",      // ⚡️ 性能优化
        "test",      // ✅ 测试相关修改
        "build",     // 🏗️ 构建系统或依赖更新
        "ci",        // 🤖 CI/CD 配置变更
        "chore",     // 🔧 杂项任务
        "revert"     // ⏪ 回滚提交
      ]
    ],
    "subject-case": [0]
  }
}
```

现在，当你执行 git commit 时，Husky 会自动触发以下两个钩子：

| **阶段** | **钩子名** | **执行内容**                | **目的**                   |
| -------- | ---------- | --------------------------- | -------------------------- |
| 提交前   | pre-commit | pnpm lint-staged            | 检查暂存区代码是否符合规范 |
| 提交时   | commit-msg | pnpm commitlint --edit "$1" | 校验提交信息格式           |

👉 这样，你的项目会在提交时自动检查代码质量和提交信息规范，确保仓库记录干净、统一、可读。

### 配置 `tsconfig.json` —— 忽略

```json
{
	"compileOnSave": true,
	"compilerOptions": {
		"target": "ESNext",
    "module": "ESNext",
    "lib": ["ESNext", "DOM"],
    "strict": true,
    "esModuleInterop": true,
    "moduleResolution": "Node",
    "skipLibCheck": true,
    "baseUrl": "./packages",  // 关键！所有子项目共享的路径基准
	},
  
  // 排除所有子项目（避免重复编译）
  "exclude": ["**/dist", "**/node_modules", "packages/*"]
}
```

## 3. 配置打包工具 rollup

比较不同打包工具的区别 [参考资料：Overview | Tooling.Report](https://bundlers.tooling.report/) 我们要开发的项目的特点：

- 是库，而不是业务项目
- 希望工具尽可能简洁、打包产物可读性高
- 原生支持`ESM`

所以选择 `rollup`。

### 安装依赖

```shell
$ pnpm add -D -w rollup ross-env tslib @rollup/plugin-babel @rollup/plugin-commonjs @rollup/plugin-eslint @rollup/plugin-node-resolve @rollup/plugin-terser @rollup/plugin-typescript rollup-plugin-delete rollup-plugin-postcss cross-env
```

依赖解读：

- rollup：一个高效的 JavaScript 模块打包工具。
- ross-env：在不同环境下设置环境变量（可能是 cross-env 的拼写错误或自定义版本）。
- tslib：TypeScript 的运行时辅助库，提供一些 helper 函数。
- @rollup/plugin-babel：在 Rollup 打包中集成 Babel 转译 JavaScript。
- @rollup/plugin-commonjs：将 CommonJS 模块转换为 ES 模块，方便 Rollup 打包。
- @rollup/plugin-eslint：在 Rollup 打包过程中集成 ESLint 检查代码。
- **@**rollup/plugin-node-resolve：帮助 Rollup 查找 node_modules 中的模块。
- @rollup/plugin-terser：在 Rollup 打包后压缩 JavaScript 代码。
- @rollup/plugin-typescript：在 Rollup 中支持直接打包 TypeScript 文件。
- rollup-plugin-delete：在打包前删除指定文件或目录（如 dist）。
- rollup-plugin-postcss：在打包时处理 CSS，包括支持模块化和预处理器。
- cross-env：跨平台设置环境变量，保证 Windows/Linux/macOS 都可用。

### 构建目录

```shell
$ mkdir -p scripts/{rollup.config,utils}.js
```

```shell
$ tree scripts
scripts
├── rollup.config.js
└── utils.js
```

```js
// scripts/rollup.config.js
import { defineConfig } from "rollup";
import { generateRollupConfig, getPkgNames } from "./utils";

const libs = ["tools"];
const rollupConfigs = [];

const pkgNames = libs.length ? libs : getPkgNames();

pkgNames.forEach((pkgName) => {
	const pkgConfig = generateRollupConfig(pkgName);
	rollupConfigs.push(pkgConfig);
});

export default defineConfig(rollupConfigs);
```

```js
// scripts/utils.js
import fs from "node:fs";
import path from "node:path";
import { babel } from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import eslint from "@rollup/plugin-eslint";
import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import del from "rollup-plugin-delete";
import postcss from "rollup-plugin-postcss";

const isProduction = process.env.NODE_ENV === "production";
const isDevelopment = !isProduction;
const pkgPath = path.resolve(__dirname, "../packages");

const commonPlugins = (pkgName) => [
	del.default({ targets: `${pkgPath}/${pkgName}/dist/**/*` }),
	eslint({
		include: ["src/**"],
		exclude: ["node_modules/**"],
		throwOnError: true,
		throwOnWarning: true,
	}),
	resolve(),
	commonjs(),
	typescript({
		tsconfig: `${pkgPath}/${pkgName}/tsconfig.json`,
		sourceMap: isDevelopment,
	}),
	babel({
		extensions: [".js", ".ts"],
		exclude: "node_modules/**",
		babelHelpers: "bundled",
	}),
	postcss({
		plugins: [],
	}),
];
const devPlugins = [];
const proPlugins = [
	terser({
		compress: {
			drop_console: false,
			drop_debugger: true,
		},
		format: {
			comments: (_, comment) => {
				return /eslint-disable/.test(comment.value); // 不删除eslint的注释
			},
		},
	}),
];

/**
 * 获取需要打包的文件路径
 * @param {*} libs
 */
export function getPkgNames() {
	const filenames = fs.readdirSync(pkgPath, { encoding: "utf-8" });
	return filenames.filter((filename) => /^[\w-]+$/.test(filename));
}

/**
 * 解析路径
 * @param {*} pkgName 包名
 * @param {*} isDist 是否dist目录
 * @returns
 */
function resolvePath(pkgName, isDist) {
	if (isDist) {
		return `${pkgPath}/${pkgName}/dist`;
	}
	return `${pkgPath}/${pkgName}`;
}

/**
 * 读取package.json文件
 * @param {*} pkgName 包名
 * @returns
 */
function getPackageJSON(pkgName) {
	const path = `${resolvePath(pkgName)}/package.json`;
	const str = fs.readFileSync(path, { encoding: "utf8" });
	return JSON.parse(str);
}

/**
 * 生成output配置
 * @param {*} formats 打包格式
 * @param {*} distPath 输出目录
 * @param {*} moduleName 模块名称
 * @returns
 */
function generateOutputs(formats, distPath, moduleName) {
	const outputs = [];
	formats.forEach((format) => {
		outputs.push({
			file: `${distPath}/index.${format}.js`,
			format,
			name: ["iife", "umd"].includes(format) ? moduleName : undefined,
			sourcemap: false,
			banner: "/* eslint-disable */\n",
		});
	});
	return outputs;
}

/**
 * 生成rollup配置
 * @param {*} pkgName 包名
 * @returns
 */
export function generateRollupConfig(pkgName) {
	const pkgPath = resolvePath(pkgName);
	const distPath = resolvePath(pkgName, true);
	const { buildOptions } = getPackageJSON(pkgName);
	return {
		input: `${pkgPath}/src/index.ts`,
		output: generateOutputs(
			buildOptions.formats,
			distPath,
			buildOptions.moduleName,
		),
		plugins: [
			...commonPlugins(pkgName),
			...(isProduction ? proPlugins : devPlugins),
		],
	};
}
```

### 新建 .browserslistrc

```
> 1%             # 全球使用率超过1%的浏览器
last 2 version   # 每个浏览器的最后2个版本
not dead         # 排除已停止维护的浏览器（如IE10以下）
```

### 新建 .gitignore

```
# Node dependencies
node_modules/
.pnpm-store/
.pnpm-debug.log*

# Lock files (pnpm 推荐提交 pnpm-lock.yaml)
package-lock.json
yarn.lock

# Build / output
packages/**/dist/
packages/**/build/
packages/**/lib/
packages/**/index.d.ts
packages/**/index.js

# TypeScript build cache
*.tsbuildinfo

# OS / editor files
.DS_Store
Thumbs.db
.vscode/
.idea/
*.sublime-project
*.sublime-workspace

# Logs
*.log
logs/

# Biome / Prettier / ESLint cache
.biomeignore
.prettierignore
.eslintcache

# Husky internal files
.husky/_/

# Temporary / swap files
*.tmp
*.swp
*.swo
*.bak

# Rollup / bundler cache
.cache/
```

### 新建  bable.config.json

```json
{
  "presets": [
    ["@babel/preset-env", { "useBuiltIns": "usage", "corejs": 3, "modules": false }],
    "@babel/preset-typescript"
  ]
}
```

### 配置打包指令

```
"build:dev": "cross-env NODE_ENV=development rollup -c scripts/rollup.config.js  --bundleConfigAsCjs",
"build:pro": "cross-env NODE_ENV=production rollup -c scripts/rollup.config.js  --bundleConfigAsCjs"
```

## 4. 新建库（tools）

接下来我们在 packages 目录中新建 `lg-tools` 库。

```shell
$ mkdir -p packages/tools/{tsconfig.json,README.md,src/index.ts} && cd packages/tools && pnpm init 
```

> `tsconfig.json`

```json
{
	"compileOnSave": true,
	"compilerOptions": {
		"target": "ESNext",
    "module": "ESNext",
    "lib": ["ESNext", "DOM"],
    "strict": true,
    "esModuleInterop": true,
    "moduleResolution": "Node",

		"declaration": true,
    "declarationDir": "dist/types",
		"emitDeclarationOnly": true,
		"noEmit": false,   


		"noUnusedLocals": true,
		"noUnusedParameters": true,
		"noImplicitReturns": true,
			
		"isolatedModules": true,
		"skipLibCheck": true,
		"sourceMap": true,

		"resolveJsonModule": true,
		"useDefineForClassFields": true,

		"baseUrl": "./",
    "paths": { "@/*": ["src/*"] },
	},
	"include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/__tests__/**"]
}
```

> `package.json`

```json
{
	"name": "tools",
	"version": "1.0.0",
	"description": "这里是描述信息",
	"type": "module",
	"types": "./dist/types/index.d.ts",
	"main": "./dist/index.cjs.js",
	"module": "./dist/index.esm.js",
	"exports": {
		"import": "./dist/index.esm.js",
		"require": "./dist/index.cjs.js",
		"types": "./dist/types/index.d.ts"
	},
	"buildOptions": {
		"formats": [
			"iife",
			"cjs",
			"umd",
			"esm"
		],
		"moduleName": "Tools"
	},
	"files": [
		"dist/**/*",
		"README.md"
	],
	"keywords": ["关键字"],
	"author": "作者信息",
	"license": "ISC",
	"repository": {
		"type": "git",
		"url": "https://github.com/xxx/tools"
	},
	"bugs": {
		"url": "https://github.com/xxx/tools/issues"
	},
	"homepage": "主页"
}

```

> `index.ts` & `README.md`

```
...
```

# 常见问题

1. 每个项目需独立入口
2. 依赖安装：各子项目执行 pnpm i
3. 打包/开发方式：各自独立
4. Monorepo 内项目默认无需发布到 npm
5. 端口管理与以前一致

# 调试方式

[pnmp link ↪](https://pnpm.io/zh/cli/link)，模拟实际项目引用

![](./IMGS/law7jksx0wjf.png)

这种方式的优点：可以模拟实际项目引用 **库** 的情况

缺点：对于开发 **库** 来说，略显繁琐。对于开发过程，更期望的是热更新效果。

# Changesets

① 安装 @changesets/cli

```shell
$ pnpm add -D -w @changesets/cli
```

② 初始化配置

```shell
$ pnpm changeset init
```

此命令会在项目根目录生成 .changeset/config.json 文件。

③ 创建变更集

```shell
$ pnpm changeset
```

运行后，命令行会引导你创建新的变更集，描述此次更新内容（如新功能、修复、API 变动等）。

④ 生成发布版本

```shell
$ pnpm changeset version
```

- 根据变更集自动更新各包版本号及依赖
- 默认选择为 major，直接回车可依次生成 minor 或 patch

⑤ 发布到npm

最后，您可以运行以下命令来将变更应用到 npm 包并发布它们：

```shell
$ pnpm changeset publish --access public
```

- 会自动生成 Changelog
- 更新版本号
- 将包发布到 npm

> 💡 提示：Changesets 可保证 Monorepo 内各项目版本同步，并记录完整发布历史，适合多人协作管理。

# 镜像

```markdown
# 官方:
npm config set registry https://registry.npmjs.org/
# 淘宝: 
npm config set registry https://registry.npmmirror.com
```











