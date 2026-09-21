# 前言

Vite 是一款速度极快的前端构建工具，为下一代 Web 应用程序提供支持。

> 提示：关于Vite的更多介绍，请移步至 [官网 >>](https://cn.vite.dev/)

# 搭建项目

环境配置：

- Node.js：`v25.1 LTS`
- Vite：`v8.1.0`

```shell
# Vue
$ pnpm create vite <PROJECT-Name> --template vue-ts
# React
$ pnpm create vite <PROJECT-Name> --template react-ts


│
│
◇  Which linter to use?
│  Oxlint
◇  Install with pnpm and start now?
│  Yes
...
```

> 🔖 **提示**
>
> - 你可以使用 `.` 作为项目名称，在当前目录中创建项目脚手架。
>
> - 关于如何基于 Vite 创建项目，可以参考 [这里 >>](https://cn.vite.dev/guide/#scaffolding-your-first-vite-project)。

# 配置

@See https://cn.vitejs.dev/config/

首先安装 Node.js 提供的类型定义的包 @types/node，解决 **找不到模块 path 或其相对应的类型声明** 的问题。

```shell
$ pnpm add -D @types/node
```

基本配置如下：

> 📖 ***Vue.js***

```js
import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  return {
    plugins: [vue()],
  };
});
```
> 📖 ***React.js***
```ts
import type { UserConfig, ConfigEnv } from 'vite';
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://cn.vitejs.dev/config/
export default defineConfig(({ mode }: ConfigEnv): UserConfig => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  console.log(env)
  return {
    plugins: [react()],
  };
});
```

## 取别名

@See https://cn.vitejs.dev/config/shared-options#resolve-alias

在 `vite.config.ts` 中配置 `resolve.alias` ，使用 `@` 符号代表 `src`。

> **`vite.config.js`**

```ts
import type { UserConfig, ConfigEnv } from 'vite';
import { defineConfig, loadEnv } from 'vite'
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react'

// https://cn.vitejs.dev/config/
export default defineConfig(({ mode }: ConfigEnv): UserConfig => {

  // -- 获取当前工作目录路径
  const root = process.cwd();
  const pathResolve = (path: string) => resolve(root, '.', path);
  // -- 获取环境变量
  const env = loadEnv(mode, root, "VITE_");
  console.log(env);
  return {
    resolve: {
      alias: {
        "@": pathResolve('src'),
      },
    },
    plugins: [react()],
  };
});
```

> **`tsconfig.app.json`**

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    },
  },
}
```

> 提示：您可以根据需求配置，通常来说，配置 `@/` 指向 `src/*` 目录即可。
>

## 开发服务器选项 & 代理

@See https://cn.vitejs.dev/config/server-options

```js
server: {
  host: "0.0.0.0",
  port: 8888,
  strictPort: false,
  open: true,
  cors: true,
  allowedHosts: [],
  proxy: {
    // 代理规则：将所有以 /v1 开头的请求转发到目标服务器
    '/v1': {
      target: 'http://106.53.69.189', // 后端服务器地址
      changeOrigin: true, // 修改请求头中的 Origin 为目标服务器地址
      secure: false, // 如果是https接口，需要配置为false
      rewrite: (path) => path.replace(/^\/v1/, ''), // 可选：移除路径前缀

    }
  }
}
```

## 环境变量

@See https://cn.vitejs.dev/guide/env-and-mode

**①. 在根目录新建 `.env.development`、`.env.production`、`.env.qa`**

```shell
$ touch .env.development .env.production .env.qa
```

大致内容如下：

> **`.env.development`**

```ini
# 当前环境（开发）
VITE_APP_ENV=development

# 服务器地址
VITE_APP_HOST=http://localhost:5173

# 微信公众号 / 支付宝生活号 ID
VITE_APP_APPID_WEIXIN=wx169565989539bf7d
VITE_APP_APPID_ALIPAY=

# 基础路径（如果你的项目需部署在二级目录请填写二级目录名，如：/appName/)
VITE_APP_BASE=""

# 输出目录
VITE_OUT_DIR="h5-dev"

# 支持环境
# - default：默认支持H5、原生嵌套H5、公众号、生活号
# - mp：仅支持公众号或生活号
VITE_APP_SOURCE="default"
```

> **`.env.production`**

```ini
# 当前环境（生产）
VITE_APP_ENV=production

# 服务器地址
VITE_APP_HOST=生产环境服务器地址

# 微信公众号 / 支付宝生活号 ID
VITE_APP_APPID_WEIXIN=
VITE_APP_APPID_ALIPAY=

# 基础路径（如果你的项目需部署在二级目录请填写二级目录名，如：/appName/)
VITE_APP_BASE=""

# 输出目录
VITE_OUT_DIR="h5-prod"

# 支持环境
# - default：默认支持H5、原生嵌套H5、公众号、生活号
# - mp：仅支持公众号或生活号
VITE_APP_SOURCE="default"
```

> **`.env.qa`**

```ini
# 当前环境（测试）
VITE_APP_ENV=qa

# 服务器地址
VITE_APP_HOST=测试环境服务器地址

# 微信公众号 / 支付宝生活号 ID
VITE_APP_APPID_WEIXIN=
VITE_APP_APPID_ALIPAY=

# 基础路径（如果你的项目需部署在二级目录请填写二级目录名，如：/appName/)
VITE_APP_BASE=""

# 输出目录
VITE_OUT_DIR="h5-qa"

# 支持环境
# - default：默认支持H5、原生嵌套H5、公众号、生活号
# - mp：仅支持公众号或生活号
VITE_APP_SOURCE="default"
```

> ⚠️ **注意**：
>
> 1. 环境变量名必须以 `VITE_` 开头；
> 2. 配置文件的内容请根据项目需要设置；
> 3. 所有环境变量值后面，**不要加分号！！！！！！**

**②. 修改 `package.json` 指令**

为了使命令在 Windows 和 macOS/Linux 下都能正常运行，我们可以使用 [cross-env](https://www.npmjs.com/package/cross-env)。

```shell
$ pnpm add -D cross-env
```

> 📖 ***Vue.js***

```json
{
  "scripts": {
    "dev": "vite --mode development",
    "build:qa": "vue-tsc && vite build --mode qa",
    "build:prod": "vue-tsc && vite build --mode production"
  }
}
```

> 📖 ***React.js***

```json
{
  "scripts": {
    "dev": "vite --mode development",
    "build:qa": "tsc -b && vite build --mode qa",
    "build:prod": "tsc -b && vite build --mode production",
  }
}
```

**③. 配置 TypeScript 智能提示**

> **`@/vite-env.d.ts`**

```ts
interface ViteTypeOptions {
  strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
  readonly VITE_APP_ENV: "development" | "qa" | "production";
  readonly VITE_APP_HOST: string;
  readonly VITE_APP_APPID_WEIXIN: string;
  readonly VITE_APP_APPID_ALIPAY: string;
  readonly VITE_APP_BASE?: string;
  readonly VITE_OUT_DIR?: string;
  readonly VITE_APP_SOURCE: "default" | "mp";
}
```

**④. 使用环境变量**

```tsx
import.meta.env.VITE_APP_HOST
```

## 构建相关

@See https://cn.vite.dev/config/build-options

Vite 8 使用 Rolldown 进行打包，并默认使用 Oxc 压缩 JavaScript。通常只需要覆盖项目明确需要修改的选项，其余选项保留默认值即可。

常用构建选项及其默认值如下：

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // 浏览器兼容目标
    target: 'baseline-widely-available',
    // 输出目录
    outDir: 'dist',
    // 静态资源目录，相对于 outDir
    assetsDir: 'assets',
    // 小于此阈值的资源内联为 base64，单位为字节；设置为 0 可禁用
    assetsInlineLimit: 4096,
    // 是否拆分异步 chunk 中的 CSS
    cssCodeSplit: true,
    // 是否生成 source map
    sourcemap: false,
    // outDir 位于项目根目录内时，构建前默认清空该目录
    emptyOutDir: true,
    // 客户端构建默认使用 Oxc 压缩；SSR 构建默认为 false
    minify: 'oxc',
    // chunk 体积警告阈值，单位为 kB
    chunkSizeWarningLimit: 500,
    // 是否报告 gzip 压缩后的体积
    reportCompressedSize: true,
  },
});
```

> 注意：当 `outDir` 位于项目根目录之外时，Vite 默认不会清空该目录。不要在未确认目录内容的情况下强制设置 `emptyOutDir: true`。

一般项目可以只保留以下配置：

```ts
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    build: {
      outDir: env.VITE_OUT_DIR || 'dist',
      // 大型项目可关闭压缩体积报告，以缩短构建时间
      reportCompressedSize: false,
    },
  };
});
```

不建议仅为消除警告而提高 `chunkSizeWarningLimit`。出现大 chunk 时，应先通过动态导入、路由懒加载或合理拆包减少初始加载体积。

### 静态资源预压缩（可选）

Vite 不会默认生成 `.gz` 或 `.br` 文件。如需在构建阶段生成预压缩资源，可以使用 `vite-plugin-compression2`。

安装依赖：

```shell
$ pnpm add -D vite-plugin-compression2
```

```ts
import { defineConfig } from 'vite';
import { compression } from 'vite-plugin-compression2';

export default defineConfig({
  plugins: [
    compression({
      // 只生成 gzip 文件；也可以增加 'brotliCompress'
      algorithms: ['gzip'],
      // 保留原始构建文件
      deleteOriginalAssets: false,
    }),
  ],
});
```

运行构建命令后，可以在 `outDir` 中看到对应的 `.gz` 文件。

> 提示：生成预压缩文件并不代表浏览器会自动使用它们。Nginx、CDN 或应用服务器还需要根据客户端的 `Accept-Encoding` 请求头返回正确的压缩文件和 `Content-Encoding` 响应头。如果服务器已经支持动态压缩，则通常不需要该插件。

### 旧版浏览器兼容（可选）

@See https://github.com/vitejs/vite/tree/v8.1.0/packages/plugin-legacy

Vite 默认面向支持现代 JavaScript 的浏览器。只有项目明确需要支持低于默认 Baseline 范围的浏览器时，才需要安装 `@vitejs/plugin-legacy`。

```shell
$ pnpm add -D @vitejs/plugin-legacy terser
```

`terser` 是 `@vitejs/plugin-legacy` 的 peer dependency，必须同时安装。

```ts
import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  plugins: [
    // 默认根据插件内置的 Browserslist 范围生成 legacy chunks 和 polyfills
    legacy(),
  ],
});
```

> 注意：Vite 8 不支持将代码转换到 ES5 及更早版本，因此不能用于支持 IE 11。需要自定义范围时，请根据项目实际的 Browserslist 目标设置 `targets`。

### 打包分析可视化（可选）

`rollup-plugin-visualizer` 支持 Vite 8 使用的 Rolldown，可以生成模块体积分析报告。

```shell
$ pnpm add -D rollup-plugin-visualizer
```

```ts
import { defineConfig, type PluginOption } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    visualizer({
      filename: 'stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }) as PluginOption,
  ],
});
```

运行构建命令后，项目根目录会生成 `stats.html`。如需构建后自动打开报告，可以设置 `open: true`。

> 提示：建议把 `stats.html` 加入 `.gitignore`，避免提交构建分析文件。

### 删除生产调试代码（可选）

@See https://cn.vite.dev/guide/migration#javascript-minification-by-oxc

Vite 8 的 `esbuild` 配置已经弃用。若需要在生产构建中删除所有 `console.*` 和 `debugger`，应配置 Rolldown 使用的 Oxc Minifier：

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        minify: {
          compress: {
            dropConsole: true,
            dropDebugger: true,
          },
        },
      },
    },
  },
});
```

`dropConsole: true` 会删除所有 `console.*` 调用。如果只需要删除 `console.log`，可以改用 Terser：

```shell
$ pnpm add -D terser
```

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_debugger: true,
        pure_funcs: ['console.log'],
      },
    },
  },
});
```



# 项目配置

## 开发规范

### 代码规范检查与修复

选择 [Oxlint ↪](https://oxc.rs/docs/guide/usage/linter.html)

Oxlint 是一个使用 Rust 编写的 JavaScript/TypeScript linter，支持 React、Vue、类型感知规则和自动修复。项目应提交统一的配置文件，确保本地、编辑器和 CI 使用相同规则。

1、安装依赖。`oxlint-tsgolint` 用于执行需要 TypeScript 类型信息的规则。

```shell
$ pnpm add -D oxlint oxlint-tsgolint
```

2、在根目录新建 `.oxlintrc.json`：

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["eslint", "typescript", "unicorn", "oxc", "import", "promise", "react", "jsx-a11y"],
  "categories": {
    "correctness": "error",
    "suspicious": "warn"
  },
  "options": {
    "typeAware": true
  },
  "rules": {
    "eslint/no-shadow": "off",
    "import/no-unassigned-import": [
      "warn",
      {
        "allow": ["**/*.css", "**/*.scss", "**/*.sass", "**/*.less"]
      }
    ],
    "react/react-in-jsx-scope": "off",
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }],
    "typescript/no-floating-promises": "error"
  },
  "ignorePatterns": ["dist/**", "coverage/**", "h5-qa/**", "h5-prod/**"]
}
```

> 提示：如果项目不需要类型感知规则，可以不安装 `oxlint-tsgolint`，同时删除 `options.typeAware` 和 `typescript/no-floating-promises` 配置。

3、在 `package.json` 中添加检查命令：

```json
{
  "scripts": {
    "lint": "oxlint",
    "lint:fix": "oxlint --fix",
    "lint:ci": "oxlint --deny-warnings"
  }
}
```

其中，`lint:fix` 只应用安全修复；`lint:ci` 会在发现警告或错误时返回非零退出码，适合在 CI 中执行。

4、在项目中创建 `.vscode/settings.json` 和 `.vscode/extensions.json`，统一 VS Code、Cursor 等兼容编辑器的行为。

> **`.vscode/settings.json`**

```json
{
  "editor.formatOnSave": true,
  "editor.insertSpaces": true,
  "editor.tabSize": 2,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "prettier.requireConfig": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.oxc": "always"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[jsonc]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "tailwindCSS.lint.suggestCanonicalClasses": "ignore"
}

```

这里不再配置 `source.organizeImports`，避免它与后续 Prettier 导入排序插件重复处理 import。

> **`.vscode/extensions.json`**

```json
{
  "recommendations": [
    "oxc.oxc-vscode",
    "esbenp.prettier-vscode"
  ]
}
```

Oxc 扩展会调用项目本地安装的 Oxlint，并读取根目录配置。运行以下命令可以分别检查、修复或执行严格的 CI 检查：

```shell
$ pnpm lint
$ pnpm lint:fix
$ pnpm lint:ci
```

### 代码格式化

选择 [Prettier ↪](https://prettier.io/) + [prettier-plugin-tailwindcss ↪](https://github.com/tailwindlabs/prettier-plugin-tailwindcss)

使用 Prettier 统一代码格式，配合 `prettier-plugin-tailwindcss` 排序 Tailwind 类名，并使用 `@trivago/prettier-plugin-sort-imports` 统一导入顺序。Prettier 只负责格式化和排序，不负责删除未使用的 import。

1、安装依赖

```shell
$ pnpm add -D prettier prettier-plugin-tailwindcss @trivago/prettier-plugin-sort-imports
```

2、根目录新建 `.prettierrc` 文件

```json
{
  "plugins": [
    "@trivago/prettier-plugin-sort-imports",
    "prettier-plugin-tailwindcss"
  ],
  "tailwindStylesheet": "./src/index.css",
  "importOrder": [
    "<BUILTIN_MODULES>",
    "^vue$",
    "^react$",
    "^react-dom$",
    "<THIRD_PARTY_MODULES>",
    "^@/(.*)$",
    "^[./]"
  ],
  "importOrderSeparation": true,
  "importOrderSortSpecifiers": true,
  "importOrderSideEffects": false,
  "singleQuote": true,
  "semi": true,
  "trailingComma": "all",
  "printWidth": 100,
  "bracketSpacing": true,
  "jsxSingleQuote": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

3、在 package.json 中添加格式化脚本

```json
{
  "scripts": {
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

4、配置 VS Code / Cursor

安装 [Prettier - Code formatter ↪](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) 扩展，编辑器设置已在上方【代码规范检查与修复】章节第 4 步配置完成。

> **提示**：
>
> - `plugins` 数组中，`prettier-plugin-tailwindcss` 必须放在最后，以确保 Tailwind 类名排序正确
> - Tailwind CSS v4 必须通过 `tailwindStylesheet` 指定 CSS 入口；Vue 项目如果使用 `src/style.css`，请相应修改路径
> - `importOrder` 配置导入排序规则：Node.js 内置模块 → Vue → React → 第三方库 → 项目内部（@/） → 相对路径
> - `importOrderSeparation` 为 `true` 时，不同组之间会插入空行
> - `importOrderSortSpecifiers` 为 `true` 时，同一导入语句中的多个导入会按字母顺序排序
> - `importOrderSideEffects` 设置为 `false`，可以避免改变 polyfill、全局样式等副作用导入的执行顺序
> - 未使用的 import 由 Oxlint 检查，Prettier 不会自动删除

### Commit 规范检查

推荐：Conventional Commits + Husky + lint-staged + Commitlint

这套组合可以在提交前检查暂存文件，并校验 commit message 是否符合 Conventional Commits。交互式提交属于可选功能，需要额外安装 Commitizen。

> 环境基线：Node.js 24 LTS。以下命令均安装当前最新版依赖，不再考虑旧版 Node.js 的兼容方案。

1、安装依赖

```shell
$ pnpm add -D husky lint-staged @commitlint/cli @commitlint/config-conventional
```

2、在 `package.json` 中配置 `lint-staged`

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx,mjs,cjs,vue}": [
      "oxlint --fix",
      "prettier --write"
    ],
    "*.{json,jsonc,md,yml,yaml,css,scss,less,html}": "prettier --write"
  }
}
```

当你执行 git commit 时，lint-staged 会自动：

- 只把已暂存且匹配规则的文件传给对应命令
- 使用 `oxlint --fix` 应用安全修复
- 使用 `prettier --write` 格式化代码
- 将命令产生的修改重新加入本次提交

未被上述 glob 匹配的文件不会处理，应根据项目使用的文件类型继续补充。

3、初始化 Husky

```shell
$ pnpm exec husky init
```

该命令必须在已经执行过 `git init` 的仓库中运行。它会创建 `.husky/pre-commit`，并在 `package.json` 中添加以下脚本：

```json
{
  "scripts": {
    "prepare": "husky"
  }
}
```

`prepare` 会在安装依赖后设置 Git 的 hooks 路径。请将 `package.json` 和 `.husky` 目录一起提交到仓库。

4、配置 `pre-commit` 钩子，编辑 `.husky/pre-commit`：

```bash
pnpm exec lint-staged
```

这里展示的是 hook 文件的实际内容，不要把命令行提示符 `$` 写入文件。提交前会对暂存文件执行上面配置的 Oxlint 和 Prettier 命令。

5、配置 `commit-msg` 钩子，新建 `.husky/commit-msg`：

```bash
pnpm exec commitlint --edit "$1"
```

这里的 `$1` 是 Git 调用 `commit-msg` hook 时传入的提交信息文件路径，不是让用户在终端中手动提供的参数。该钩子会在创建 commit 前校验提交信息。

6、在项目根目录新建 `commitlint.config.mjs`：

```js
export default {
  extends: ['@commitlint/config-conventional'],
};
```

`@commitlint/config-conventional` 已内置 `build`、`chore`、`ci`、`docs`、`feat`、`fix`、`perf`、`refactor`、`revert`、`style` 和 `test` 等常用类型。只有项目需要增加自定义类型或规则时，才需要覆盖 `rules`。

7、手动验证配置与常见提示

先暂存需要检查的文件，再运行 `lint-staged`：

```shell
$ git add <file...>
$ pnpm exec lint-staged
```

`lint-staged` 只读取 Git 暂存区。出现 `lint-staged could not find any staged files` 表示当前没有已暂存且匹配配置的文件，不是配置错误。

仓库还没有首次提交时，Git 不存在可供 `lint-staged` 创建备份 stash 的 `HEAD`，因此会看到：

```text
Skipping backup because there’s no initial commit yet.
```

这也是首次提交阶段的预期提示。执行前应确认工作区内容已自行备份，并用 `git diff --cached` 检查暂存内容；完成首次提交后，`lint-staged` 就能正常创建备份。

不要在普通终端中直接执行 hook 里的 `pnpm exec commitlint --edit "$1"`。此时 Git 没有传入 `$1`，而 `.git/COMMIT_EDITMSG` 通常也不存在。手动检查一条提交信息应通过标准输入：

```shell
$ echo "feat: add login page" | pnpm exec commitlint
```

现在，执行 `git commit` 时会触发：

| 阶段   | 钩子名     | 执行内容                           | 目的                 |
| ------ | ---------- | ---------------------------------- | -------------------- |
| 提交前 | pre-commit | `pnpm exec lint-staged`            | 检查并格式化暂存文件 |
| 提交时 | commit-msg | `pnpm exec commitlint --edit "$1"` | 校验提交信息格式     |

8、在 CI 中执行完整检查

Git hooks 可以通过 `git commit --no-verify` 绕过，因此团队项目还应在 CI 中执行完整检查。以下命令中的分支名应根据仓库实际情况调整：

```shell
$ pnpm lint:ci
$ pnpm format:check
$ pnpm exec commitlint --from origin/main --to HEAD
```

9、引导式提交（可选）

如果需要交互式生成 commit message，可以使用 Commitizen 和 `@commitlint/cz-commitlint`。该适配器会读取现有的 `commitlint.config.mjs`，避免维护两套提交类型配置。

```shell
$ pnpm add -D commitizen @commitlint/cz-commitlint inquirer@9
```

在 `package.json` 中添加：

```json
{
  "config": {
    "commitizen": {
      "path": "@commitlint/cz-commitlint"
    }
  },
  "scripts": {
    "commit": "git-cz"
  }
}
```

暂存需要提交的文件后执行：

```shell
$ git add .
$ pnpm commit
```

Commitizen 会根据 Commitlint 配置引导填写提交信息，最终仍由 `commit-msg` 钩子进行校验。

## 样式

### less & sass
Vite 内置对 Less 和 Sass 的支持，安装对应的包后即可直接使用，无需额外配置。

```shell
# 安装 Less
$ pnpm add -D less 

# 安装 Sass
$ pnpm add -D sass 
```

### tailwindcss

> 英文官网（推荐）：https://tailwindcss.com/
>
> 中文官网：https://www.tailwindcss.cn/

1. 安装 Tailwind CSS

```shell
$ pnpm add tailwindcss @tailwindcss/vite
```

2. 配置 Vite 插件：在 vite.config.ts 配置文件中添加 @tailwindcss/vite 插件

```js
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  plugins: [
    ...
    tailwindcss(),
  ],
})
```

3. 导入 Tailwind CSS：在您的 CSS 文件（*通常是 index.css*）中导入 Tailwind CSS 的内容

```js
@import "tailwindcss";
```

> 🔖 **提示**：
>
> - 如果你使用 PostCSS，请参考 [这里 >>](https://tailwindcss.com/docs/installation/using-postcss)
> - 如果你是开发H5，特别是需要高度还原设计稿，暂时不太建议使用 tailwindcss，你应该结合 rem 实现移动端布局。

## svgr

```
pnpm add -D vite-plugin-svgr @svgr/plugin-svgo
```

```
svgoConfig: {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          convertColors: { currentColor: true },
        },
      },
    },
    'prefixIds',
  ],
},
```



## mockjs（可选）

@See https://github.com/vbenjs/vite-plugin-mock/blob/main/README.zh_CN.md

**①. 安装依赖：**

```shell
$ pnpm add -D vite-plugin-mock  
```

**②. 引入插件**

> **`vite.config.ts`**

```js
import type { UserConfig, ConfigEnv } from 'vite';
import { defineConfig } from 'vite'
import { viteMockServe } from 'vite-plugin-mock'

// https://cn.vitejs.dev/config/
export default defineConfig(({ mode }: ConfigEnv): UserConfig => {
  return {
    plugins: [
      ...
      viteMockServe({
        mockPath: 'mock',
        enable: true,
      }),
    ],
});
```

**③. 新建 <u>mock/api.ts</u> 文件**

```js
export default [
  {
    url: '/api/infos',
    method: 'GET',
    response: ({ query }) => {
      return {
        code: 0,
        msg: 'success',
        data: {
          name: 'vite-react-template',
          version: '0.0.0'
        }
      }
    }
  }
]
```

**④. 验证**

浏览器输入 [http://localhost:5173/api/infos  ↪](http://localhost:5173/api/infos) 查看响应结果

## Axios（可选）

**①. 安装相关依赖：**

```shell
$ pnpm add axios
```

**②. 新建目录**

```shell
$ mkdir -p src/api/{apiConfig,apiServer} && touch src/api/apiConfig/index.ts src/api/apiServer/{index.ts,apiExample.ts} src/api/typings.d.ts
```

生成目录如下：

```ini
.
├── api
    ├── apiConfig
    │   └── index.ts
    ├── apiServer 
    │   ├── apiExample.ts
    │   └── index.ts
    └── typings.d.ts
```

> **`apiConfig/index.ts`**

```ts
import type {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import axios from 'axios';

// 1. 基础类型定义
interface ApiResponse<T = any> {
  code: number;
  data: T;
  msg: string;
}

// 2. 创建实例
const instance = axios.create({
  baseURL: import.meta.env.VITE_APP_HOST,
  timeout: 60000,
  withCredentials: false,
  headers: {
    'Access-Control-Allow-Origin': '*',
  },
});



// 3. 请求拦截器
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {

    // -- GET请求拼接随机值
    if (/GET/i.test(config.method ?? '')) {
      const t = Math.random().toString(36).slice(2, 9);
      config.params = { ...config.params, t };
    }

    // -- 拼接token
    const token = localStorage.getItem('AUTHORIZATION_TOKEN') ?? '';
    const whiteList = ['/api/login'];

    if (token && !whiteList.some((path) => config.url?.startsWith(path))) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// 4. 响应拦截器
instance.interceptors.response.use(
  (response) => {

    // 处理流数据
    if (response.request.responseType === 'blob') {
      return { code: 200, data: response.data, msg: 'success' };
    }

    // 业务错误处理
    const { code } = response.data as unknown as ApiResponse;
    if (code === 401) {
      localStorage.removeItem('AUTHORIZATION_TOKEN');
      window.location.href = '/login';
    }
    return response.data;
  },
  (error: AxiosError) => {

    console.log('[request error] > ', error);
    return { code: 0, msg: error.message, data: null };
  },
);

// 5. 统一的 request 方法
const request = <R = any>(
  options: AxiosRequestConfig,
): Promise<ApiResponse<R>> => {
  return instance(options);
};


export default request;

```

> **`typings.d.ts`**

```ts
declare namespace API {
  interface ListParams {
    page?: number;
    size?: number;
    [__prop__: string]: unknown;
  }
  interface ListResponse<T> {
    items: T[];
    current: number;
    size: number;
    total_items: number;
    total_pages: number;
  }
}
```

> 提示：这个文件主要定义一些接口请求或响应的数据类型。

> **`apiServer/apiExample.ts`**

```ts
import request from "@/api/apiConfig";

export async function infos() {
  return request<{ name: string; version: string }>({
    url: '/api/infos',
    method: 'GET',
  })
}
```

> 提示：这个文件主要定义实际业务需求中的接口，你应该根据不同的业务场景创建不同的文件，文件名义 `apiXXX` 开头。

> **`apiServer/index.ts`**

```ts
import * as  apiExample from './apiExample'

export { apiExample }
```

提示：这个文件主要是统一导出接口请求。

调用：

```tsx
const handleLogin = async () => {
	try {
		const resp = await apiExamples.login({
			username: '15888888888',
			password: '123456'
		});
		console.log(resp);
	} catch (error) {
		console.log(error);
	}
};
```

## 全局类型声明

有时，当我们引入三方SDK时，需要在window上访问，可以定义全局类型声明：

> **`@/typings/index.d.ts`**

```ts
export {};

declare global {
  // 👉 定义全局属性
  interface Window {
    /** 百度统计 */
    _hmt: any;
    /** 微信S*/
    wx: any;
    /** 百度地图 */
    AMap: any;
    /** 腾讯地图 */
    qq: any;
    /** 支付宝 */
    AlipayJSBridge: any;
    /** iOS回调地址 */
    CONFIG_URL_FOR_IOS: string;
  }
}
```

## 动态加载静态资源

在使用 webpack 动态引入静态资源可以使用 `require` 形式，但是在vite中不可取，会抛出 <u>*require is not defined*</u> 的错误。

不过我们可以通过 [import.meta.url](https://cn.vitejs.dev/guide/assets.html#new-url-url-import-meta-url) 的形式引入，它是一个 ESM 的原生功能，会暴露当前模块的 URL。将它与原生的 [URL 构造器](https://developer.mozilla.org/en-US/docs/Web/API/URL) 组合使用，在一个 JavaScript 模块中，通过相对路径我们就能得到一个被完整解析的静态资源 URL，其语法形式如下：

```js
new URL(url, import.meta.url).href
```

使用示例：

```js
const imgs = [
  { imgUrl: new URL('./assets/logo_1.png', import.meta.url).href, text: "标题1" },
  { imgUrl: new URL('./assets/logo_2.png', import.meta.url).href, text: "标题2" },
];
```

```react
// => react
{imgs.map((item) => (
  <img src={item.imgUrl} key={item.title} />
))}
```

值得注意的是，在生产环境中会抛出 “*URL is not defined xxx*”  的错误，这个时我们需要使用一个插件：[rollup-plugin-import-meta-url-to-module](https://www.npmjs.com/package/rollup-plugin-import-meta-url-to-module)。

使用方式比较简单，首先安装依赖：

```shell
$ pnpm add rollup-plugin-import-meta-url-to-module
```

然后再 **`vit.config.js`** 中配置plugins：

```js
import urlToModule from 'rollup-plugin-import-meta-url-to-module';

export default {
  plugins: [
    urlToModule()
  ]
};
```

## 移动端配置（可选）

### vconsole

[vconsole](https://github.com/Tencent/vConsole/blob/dev/README_CN.md) 是一个轻量、可拓展、针对手机网页的前端开发者调试面板。

```shell
$ pnpm add -D vconsole
```

> **`main.tsx`**

```ts
if (import.meta.env.VITE_APP_ENV !== "production") {
  new vconsole();
}
```

### 移动端适配

现如今，移动端H5适配在需要高度还原设计稿的前提下，主要有两种便捷的方式：

- rem — postcss-pxtorem
- viewport — postcss-px-to-viewport-8-plugin（现代浏览器推荐）

#### 方案 1：基于 `rem`

1）安装依赖

```shell
$ pnpm add -D postcss-pxtorem @types/postcss-pxtorem autoprefixer
```

2）设置视窗

**`index.html`**

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
```

3）配置 postcss

**`vite.config.ts`**

```js
import px2rem from 'postcss-pxtorem'
import autoprefixer from 'autoprefixer'

...
css: {
  postcss: {
    plugins: [
      autoprefixer({
        overrideBrowserslist: ['last 2 versions', 'iOS >= 10']
      }),
      px2rem({
        // -- vant，ant-design-mobile 设计基准：375px
        rootValue: 37.5,
        // -- 转换所有属性
        propList: ['*'],
        // -- 排除 .norem 和 antd-mobile 的类名
        selectorBlackList: ['.norem', /^am-/],
        // -- 转换媒体查询中的 px
        mediaQuery: true,
        // 可选：完全排除库文件
        exclude: /node_modules\/antd-mobile/i
      })
    ]
  }
},
```

4）动态计算根字体大小

**`@/utils/rem.ts`**

```ts
const designWidth = 375;
const rootValue = 37.5; // 🤔 designWidth / 10 = 37.5

function setRem() {
  const scale = document.documentElement.clientWidth / designWidth;
  document.documentElement.style.fontSize = `${rootValue * Math.min(scale, 2)}px`;
}
setRem();
window.onresize = function () {
  setRem();
};
```

5）在 `mian.ts(x)`  引入：

```ts
import "@/utils/rem";
```

> 如果控制台抛出：
>
> *无法在 `--isolatedModules` 下编译 `rem.ts`，因为它被视为全局脚本文件。请添加导入、导出或空的  `export {}` 语句来使它成为模块*
>
> 此时你应该在 `tsconfig.json` 文件中将 `isolatedModules` 字段设置为 `false`。

#### 方案 2：基于 `viewport`

1）安装依赖

```shell
$ pnpm add -D postcss-px-to-viewport-8-plugin autoprefixer
```

2）设置视窗

**`index.html`**

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
```

3）配置 postcss 

**`vite.config.ts`**

```ts
import px2vw from 'postcss-px-to-viewport-8-plugin'
import autoprefixer from 'autoprefixer'

...
css: {
  postcss: {
    plugins: [
      autoprefixer({
        overrideBrowserslist: ['last 2 versions', 'iOS >= 10']
      }),
      px2vw({
        unitToConvert: 'px',
        viewportWidth: 375,
        unitPrecision: 5,
        propList: ['*'],
        viewportUnit: 'vw',
        fontViewportUnit: 'vw',
        selectorBlackList: [],
        minPixelValue: 1,
        mediaQuery: false
      })
    ]
  }
},
```

# 差异化配置

## 📖 Vue.js

### 路由配置

安装依赖：

```shell
$ pnpm add vue-router
```

新建文件：

```shell
$ mkdir -p src/router && touch src/router/index.ts src/router/routes.ts
```

> **`routes.ts`**

```ts
import { RouteRecordRaw } from "vue-router";

import Layouts from "@/layouts/index.vue";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "layouts",
    redirect: "/index-page",
    component: Layouts,
    children: [
      {
        path: "/index-page",
        name: "index",
        component: () => import("@/pages/Tabs/IndexPage.vue"),
        meta: { title: "首页" },
      },
      {
        path: "/special-sale",
        name: "SpecialSale",
        component: () => import("@/pages/Tabs/SpecialSale.vue"),
        meta: { title: "特卖" },
      },
      {
        path: "/friends",
        name: "Friends",
        component: () => import("@/pages/Tabs/Friends.vue"),
        meta: { title: "好友" },
      },
      {
        path: "/mine",
        name: "Mine",
        component: () => import("@/pages/Tabs/Mine.vue"),
        meta: { title: "我的" },
      },
    ],
  },
  {
    path: "/download",
    name: "Download",
    component: () => import("@/pages/Download/index.vue"),
    meta: {
      title: "下载",
    },
  },
  {
    path: "/not-found",
    name: "NotFound",
    component: () => import("@/pages/NotFound/index.vue"),
  },
  {
    path: "/:pathMatch(.*)",
    redirect: "/not-found",
  },
];

export default routes;

```

> **`index.ts`**

```ts
import { createRouter, createWebHistory } from "vue-router";
import routes from "./routes";

const router = createRouter({
  // -- 部署二级目录：createWebHistory(base?: string)
  history: createWebHistory(import.meta.env.VITE_APP_BASE),
  // -- 路由
  routes,
  // -- 滚动行为
  scrollBehavior: () => ({
    el: "#app",
    top: 0,
    behavior: "smooth",
  }),
});

// 导航守卫
router.beforeEach(async (to, _) => {});

router.afterEach((to) => {
  // → 设置标题
  if (to.path !== "/favicon.icon") {
    document.title = to.meta.title ? (to.meta.title as string) : "";
  }
  // → 滚动
  window.scrollTo(0, 0);
});

export default router;

```

> 提示：这里只是简单演示如何配置路由，实际上你应该根据你的业务需求来配置。关于 vue-router 的使用，可以参考 [这里 >>](https://router.vuejs.org/)

在main.ts挂载路由

```ts
import App from "@/App.vue";
import router from "@/router";

// App配置/挂载相关
// 1. 创建App
const app = createApp(App);
// 2. 注入
app.use(router);
// 3. 挂载
app.mount("#app");
```

### 状态管理

```shell
$ pnpm add pinia
```

> 提示：关于 Pinia 的使用，可以参考 [这里 >>](https://pinia.vuejs.org/zh/)

**`@/stores/index.ts`**

```ts
import { defineStore } from 'pinia';

interface StoreProps {
  count: number;
}

interface ActionProps {
  increment: () => void;
  decrement: () => void;
}

export const useStore = defineStore<string, StoreProps, any, ActionProps>(
  'appStore',
  {
    state: () => ({ count: 0 }),
    actions: {
      async increment() {},
      async decrement() {},
    },
  }
);
```

挂载：在main.ts挂载数据中心

```ts
import { createApp } from "vue";
import { createPinia } from "pinia";
import { useStore } from "@/stores";
import App from "@/App.vue";

// 👉 app
// 1. 创建app
const app = createApp(App);
// 2. 注入依赖
app.use(createPinia());

// 4. 挂在app
app.mount("#app");

// 👉 持久化pinia
const store = useStore();
// 页面进入：合并状态
const localState = localStorage.getItem("PINIA_PERSISTENCE");
if (localState) {
  console.log("[温馨提示]：合并Store...");
  store.$state = JSON.parse(localState);
}
// 页面刷新：存储状态
window.addEventListener("beforeunload", () => {
  console.log("[温馨提示]：缓存Store...");
  localStorage.setItem("PINIA_PERSISTENCE", JSON.stringify(store.$state));
});

```

### Vant

[Vant](https://vant.pro/vant/#/zh-CN) 是一个**轻量、可定制的移动端组件库**，Vue 首选移动端UI框架，

```shell
$ pnpm add vant
```

> 提示：配置指南，参考 [这里 >>](https://vant.pro/vant/#/zh-CN/quickstart)

**①. 安装依赖**

```shell
$ pnpm add @vant/auto-import-resolver unplugin-vue-components -D
```

**② . 配置插件**

> **`vite.config.ts`**

```ts
import { defineConfig } from "vite";
import { VantResolver } from "@vant/auto-import-resolver";
import Components from "unplugin-vue-components/vite";

export default defineConfig(({ mode }) => {
  return {
    plugins: [
    	...
      Components({
        resolvers: [VantResolver()],
      }),
    ],
  };
});
```

> 提示：有赞团队也提供了React 版本 —— [React Vant >>](https://react-vant.3lang.dev/)

### 二级目录部署

**方案1：**

打包时设置 `-base` 选项：

```js
"build": "vue-tsc --noEmit && vite build --mode production --base=/二级目录名/",
```

然后再 `router/index.ts` 中配置如下：

```js
const router = createRouter({
  // 部署二级目录：createWebHistory(base?: string)
  history: createWebHistory("/二级目录名/"),
  routes,
});
```

**方案2：**

在 `vite.config.js` 配置项中添加 `base` 配置，如：

```js
base:"/YOUR_PROJECT_NAME/"
```

然后再 `router/index.ts` 中配置如下：

```js
const router = createRouter({
  // 部署二级目录：createWebHistory(base?: string)
  history: createWebHistory("/二级目录名/"),
  routes,
});
```

## 📖 React

### 路由配置

**①. 目录结构**

```
.
├── src
    ├── ...
    ├── layouts
    │   └── index.tsx
    ├── main.tsx
    ├── pages
    │   ├── 404
    │   │   └── index.tsx
    │   ├── Details
    │   │   └── index.tsx
    │   ├── Home
    │   │   └── index.tsx
    │   └── Login
    │       └── index.tsx
    └── router
        └── index.tsx
```

> 提示：这里只例举部分目录，仅供参考。

**②. 安装依赖**

```shell
$ pnpm add react-router
```

> 提示：目前我使用的版本是 `^7.6.3`，关于 v7 版本的路由使用请 [参考这里 >>](https://reactrouter.com/)

**③. 文件代码**

> `src/layouts/index.tsx`

```tsx
import { Outlet } from "react-router";
export default function Layout() {
  return (
    <>
      {/* 视图容器 */}
      <Outlet />
    </>
  );
}

```

> `src/router/index.tsx`

```tsx
import Layouts from "@/layouts";
import { createBrowserRouter, RouterProvider } from "react-router";
import HomePage from "@/pages/Home";
import LoginPage from "@/pages/Login";
import { lazy } from "react";

const DetailsPage = lazy(() => import("@/pages/Details"));
const NotFoundPage = lazy(() => import("@/pages/404"));
const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <Layouts />,
      children: [
        { index: true, element: <HomePage /> },
        { path: "/details", element: <DetailsPage /> },
      ],
    },
    { path: "/login", element: <LoginPage /> },
    { path: "*", element: <NotFoundPage /> },
  ],
  {
    /** 部署二级目录时必须指定 */
    basename: import.meta.env.VITE_APP_BASE,
  }
);

const AppRoutes = () => <RouterProvider router={router} />;

export default AppRoutes;

```

> `src/main.tsx`

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AppRoutes from "@/router";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppRoutes />
  </StrictMode>
);
```

### 组件库

#### Ant Design（PC）

[Ant Design](https://ant-design.antgroup.com/index-cn) 是一款基于 React 的企业级 UI 组件库，由阿里巴巴 Ant Group 开发，主要用于构建现代化、高效、优雅的中后台管理系统。它提供了丰富的 UI 组件、强大的主题定制能力，以及良好的国际化支持，是 React 生态中最受欢迎的 UI 库之一。

1）安装依赖

```shell
$ pnpm add antd
```

2）使用：修改 `src/App.js`，引入 antd 的按钮组件。

```tsx
import { Button } from 'antd';

export default function App() {
	return (
		<div>
			<Button type="primary">Button</Button>
		</div>
	);
}
```

> ❗️注意：
>
> 截止到发文， Ant 系列暂时还未完全适配 React 19，在使用过程中会有警告甚至错误，如下所示：
>
> *Warning: [antd: compatible] antd v5 support React is 16 ~ 18. see https://u.ant.design/v5-for-19 for compatible.*
>
> 官方已经推出了兼容方案（参考 [这里 >>](https://ant.design/docs/react/v5-for-19-cn/)），就是安装兼容包  @ant-design/v5-patch-for-react-19

3）设置组件默认语言为中文

```tsx
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN'; // 引入中文语言包

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN}>
      <App />
    </ConfigProvider>
  </React.StrictMode>
);Ï
```

#### Material-UI（PC）

[Material-UI  ↪](https://mui.com/material-ui/getting-started/)

```shell
$ pnpm add @mui/material @emotion/react @emotion/styled
```

#### Ant Design Mobile

[Ant Design Mobile](https://mobile.ant.design/zh) 是 Ant Design 的移动端版本，它继承了 Ant Design 优秀的设计理念，拥有丰富的高质量移动端组件，提供良好的交互体验和视觉效果，支持 React 和 Vue 等多种技术栈，方便集成到现有项目中，并且注重性能优化与兼容性，适合用于构建企业级移动端应用，能让开发保持统一设计风格且高效。

```shell
$ pnpm add antd-mobile@5.40.0
```

> 💡提示：置指南，参考 [这里 ↪](https://mobile.ant.design/zh/guide/quick-start/)

> ⚠️注意：antd-mobile v5 默认兼容 React 16 ~ 18 版本，对于 React 19 版本，可以参考 [这里 ↪](https://mobile.ant.design/zh/guide/v5-for-19) 进行适配。

### 二级目录部署

**①. 在 `package.json` 文件中配置指令时时设置 `--base=/二级目录名/`**。

**②. 在各环境配置文件中根据需要设置 `VITE_APP_BASE` 字段值**。

**②. 在配置路由时设置 `basename` 属性，如下所示：**

```tsx
/**
 * src/router/index.tsx
 * appRouter
 * @returns
 */
export const AppRouter: React.FC = ({ children }) => {
  return (
    <Suspense fallback={Fallback}>
      <Router basename={import.meta.env.VITE_APP_BASE}>{children}</Router>
    </Suspense>
  );
};
```

### React-Query



# 模板地址

闲暇之余，结合 `Vite` 封装了两个模板，大家可以参考：

- [Vite6 + Vue3 + TypeScript + Vant4 >>](https://github.com/LiHongyao/vite-vue-template)

- [Vite8 + React19 +_TypeScript + Ant Design Mobile 5.x >>](https://github.com/LiHongyao/vite-react-template)

> 提示：本文中的代码片段均摘自上述模板文件。
