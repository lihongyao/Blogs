# 概述

![](IMGS/webpack-des.png)

本质上，[webpack  ↪](https://webpack.docschina.org/) 是一个用于现代 JavaScript 应用程序的 静态模块打包工具。它能够将多个模块及其依赖关系打包成一个或多个最终的优化过的资源文件，用于在浏览器中加载和执行。

这段话有三个重点：

- 打包：将不同类型资源按模块处理进行打包。
- 静态：打包后最终产出静态资源。
- 模块：webpack 支持不同规范的模块化开发。

目前最新版本是：webpack 5.x，发布记录在 [这里 ↪](https://github.com/webpack/webpack/releases) 查阅。

## 2. 为什么需要Webpack？

Webpack是现代前端开发的核心工具，主要解决三个关键问题：

1. **模块化开发**
   将JS/CSS/图片等资源统一视为模块，支持import/require语法，告别全局变量污染
2. **工程化构建**
   - 代码压缩合并（减少HTTP请求）
   - ES6转译（兼容旧浏览器）
   - CSS预处理（Sass/Less）
   - 图片优化（自动压缩）
3. **开发提效**
   - 热更新（代码改动自动刷新）
   - 源码映射（方便调试）
   - 按需加载（提升首屏速度）

> 一句话总结：让杂乱的前端资源变成可维护、可优化、易开发的现代化工程

## 3. 模块化

模块化是将代码拆分为独立功能单元的开发方式，主要解决代码组织和复用问题。

### 主流规范对比

| 规范      | 特点                 | 使用场景     | 示例                         |
| --------- | -------------------- | ------------ | ---------------------------- |
| CommonJS  | 同步加载，简单直接   | Node.js环境  | `require()`/`module.exports` |
| AMD       | 异步加载，适合浏览器 | 传统Web项目  | `define()`/`require()`       |
| UMD       | 兼容CommonJS和AMD    | 跨环境模块   | 条件判断导出                 |
| ES Module | 官方标准，静态分析   | 现代前端开发 | `import`/`export`            |

### 核心优势

1. **隔离作用域**：避免全局变量污染
2. **明确依赖**：模块间引用关系清晰可见
3. **复用代码**：相同功能无需重复实现
4. **团队协作**：模块边界天然划分职责

> 现代开发建议：优先使用ES Module（浏览器原生支持+Tree Shaking优化）

> 提示：更多内容，可参考 [这里 ↪](https://juejin.cn/post/7046265436408643615)

## 4. 构建过程

Webpack 的构建过程是一个模块化流水线，主要分为六个阶段：

入口分析 → 依赖解析 → 加载器转换 → 插件处理 → 依赖优化 → 文件输出

核心阶段说明：

| 阶段         | 关键动作                                                    | 配置示例                       |
| :----------- | :---------------------------------------------------------- | ------------------------------ |
| **入口分析** | 从`entry`配置定位起始模块                                   | `entry: './src/index.js'`      |
| **依赖解析** | 递归分析`import/require`语句，生成依赖图谱                  | `resolve.extensions`配置       |
| **加载转换** | 按`module.rules`调用Loader处理非JS资源                      | `babel-loader` 转译ES6         |
| **插件处理** | 在特定生命周期执行插件逻辑（如`HtmlWebpackPlugin`生成HTML） | `plugins: [new Plugin()]`      |
| **依赖优化** | 进行Tree Shaking、Code Splitting等优化（v5特性）            | `optimization.splitChunks`     |
| **文件输出** | 根据`output`配置生成最终文件                                | `filename: '[name].[hash].js'` |

Webpack的构建过程包括以下几个主要步骤：

1. 入口点分析：Webpack根据配置文件中指定的入口点（entry）开始分析项目的依赖关系。入口点可以是一个或多个文件，Webpack会从这些文件开始构建整个应用程序的依赖图。
2. 依赖解析：Webpack通过递归地解析入口文件及其依赖，构建整个项目的依赖图。它会分析每个模块之间的依赖关系，并确定模块之间的引用关系。
3. 加载器转换：当遇到不同类型的模块时，Webpack会使用相应的加载器（Loader）对模块进行转换。加载器可以将模块转换为可执行的JavaScript代码、处理样式文件、压缩图片等。加载器是Webpack的一个核心概念，通过加载器，可以扩展Webpack的功能。
4. 插件应用：Webpack在构建过程中通过插件（Plugin）来执行额外的任务。插件可以用于代码优化、资源管理、环境变量注入等。通过使用插件，开发者可以根据自己的需求来定制构建过程。
5. 打包输出：经过依赖解析、加载器转换和插件应用后，Webpack会生成最终的打包结果。它将所有的模块和依赖打包成一个或多个最终的静态资源文件，通常是JavaScript、CSS和图片等文件。
6. 文件输出：Webpack将打包生成的文件输出到指定的目录中，通常是一个名为`dist`的目录。在输出过程中，Webpack可以根据配置文件中的设置对文件名进行处理、添加哈希值、分片等操作。

以上是Webpack的基本构建过程，它通过分析依赖关系、转换模块、应用插件和输出打包结果来完成项目的构建。Webpack的灵活性和可扩展性使得开发者可以根据项目的需求进行配置和定制，以获得更高效、优化的构建结果。

### 关键改进（v5.100.2特性）

1. **持久化缓存**：默认启用构建缓存，二次构建速度提升90%+
2. **资源模块**：无需loader即可处理图片字体（`type: 'asset'`）
3. **模块联邦**：支持跨应用共享模块
4. **优化策略**：更智能的Tree Shaking和代码分割

# 基础知识

在开始之前，我们先来看看配置文件：`webpack.config.js`

```js
/** @type {import('webpack').Configuration} */
const config = {
  // -- 环境
  mode: "production",
  // -- 打包的入口文件，注：如果不写entry默认是./src/index.js
  entry: "./src/index.js",
  // -- 打包的输出文件，注：如果不写output默认是./dist/main.js
  output: {
    filename: "bundle.js",
  },
  // -- Loader 配置
  module: {
    rules: [],
  },
  // -- 插件配置
  plugins: [],
};

module.exports = config;
```

> **提示：**
>
> - 你可能已经注意到 **`/** @type {import('webpack').Configuration} */`** 这段代码，他的作用是基于 [jsDoc](https://jsdoc.app/tags-type.html) 提供 **配置提示**。
> - 官方提供了一个 [自定义 webpack 配置的在线工具 ↪](https://createapp.dev/webpack/)，它允许你选择各种特性，其将会被添加到最后的配置文件中。它也会基于生成的 webpack 配置初始化一个示例项目，你可以在浏览器中查看该项目并且下载。
> - 你也可以在 [这里 ↪](https://webpack.docschina.org/configuration/) 查看官方完整配置指南。

## 1. 入口(entry)

[entry ↪](https://webpack.docschina.org/concepts/#entry)：入口起点，指示 webpack 应该使用哪个模块，来作为构建其内部依赖图的开始。进入入口起点后，webpack 会找出有哪些模块和库是入口起点（直接和间接）依赖的。

入口文件常用的配置形式如下：

```js
module.exports = {
  entry: {
    main: './src/js/main.js',
    news: './src/js/news.js',
  },
};
```

> 提示：在多页面项目中设置出口时，通过 `[name]`  即可获取文件名，其中文件名就是入口设置中的 `key` 项。

## 2. 输出(output)

[output ↪](https://webpack.docschina.org/concepts/#output)：该属性告诉 webpack 在哪里输出它所创建的 bundles，以及如何命名这些文件。你可以通过在配置中指定一个 output 字段，来配置这些处理过程。

出口文件常用的配置形式如下：

```javascript
const path = require('path');

module.exports = {
  ...
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'assets/[name]-[contenthash:8].js',
    clean: true // 清理输出目录，Webpack 5 内置清理功能
  },
};
```

- `[name]`：模块名称，也就是在指定入口时的 `key` 值。
- `[contenthash]`：打包后文件的 hash 值，md5，保证文件唯一性。

## 3. loader

[loader ↪](https://webpack.docschina.org/concepts/#loaders)：由于 webpack 只能理解 js 和 json 文件，所以需要 loader 来处理转换特定类型的文件，它的工作时机是在读取某个特定类型的文件时调用。

```javascript
module.exports = {
  module: {
    rules: [...loaders],
  },
};
```

> 注意：执行顺序，从右往左。

## 4. 插件(plugins)

[plugins ↪](https://webpack.docschina.org/concepts/#plugins)：插件是用来拓展 webpack 功能的，它们会在整个构建过程中生效，执行相关的任务，包括：打包优化，资源管理，注入环境变量。

`Loaders` 和 `Plugins` 对于新手常常被弄混，但是他们其实是完全不同的东西，可以这么来说，loaders 是在打包构建过程中用来处理源文件的，一次处理一个，插件并不直接操作单个文件，它直接对整个构建过程起作用。

webpack 有很多内置插件，同时也有很多第三方插件，可以让我们完成更加丰富的功能。

使用插件步骤：安装插件 → 导入插件 → 配置插件：在 plugins 数组中创建插件实例

## 5. 模式(mode)

[Mode ↪](https://webpack.docschina.org/concepts/#mode)：用于配置打包环境，它主要有以下两个值：

- `development`：开发环境
- `production`：生成环境（会自动压缩打包后的文件）

## 5. 浏览器兼容性(browser compatibility)

Webpack 支持所有符合 [ES5 标准](https://kangax.github.io/compat-table/es5/) 的浏览器（不支持 IE8 及以下版本）。webpack 的 `import()` 和 `require.ensure()` 需要 `Promise`。如果你想要支持旧版本浏览器，在使用这些表达式之前，还需要 [提前加载 polyfill](https://webpack.docschina.org/guides/shimming/)。

## 6. Context

[Context ↪](https://webpack.docschina.org/configuration/entry-context/)：上下文，基础目录，**绝对路径**，用于从配置中解析入口起点和 loader，入口起点会相对于此目录查找。默认使用 Node.js 进程的当前工作目录，即配置文件所在的目录。webpack 推荐在配置中传入一个值，这使得你的配置独立于 CWD(current working directory, 当前工作目录)。

一般当自定义配置文件之后，我们需要设置该属性，比如配置文件放在在 `build/` 目录中，则上下文配置如下：

```js
context: path.resolve(__dirname, "../");
```

## 7. 环境(environment)

Webpack 5 运行于 Node.js v10.13.0+ 的版本。

# 实战

了解了webpack的基础知识以后，接下来我们通过实战的形式帮助大家去理解webpack的配置。

本案例主要以单页配置为主，多页配置其实也就是在配置入口时根据实际需要配置多个入口即可。

## 1. 准备工作

### 1.1. 创建项目

```shell
$ mkdir webpack-examples && cd webpack-examples && npm init -y && code .
$ pnpm add -D webpack webpack-cli
```

### 1.2. 目录结构

```
.
├── package.json
├── pnpm-lock.yaml
├── public
│   ├── favicon.ico
│   └── index.html
├── src
│   └── main.js
└── webpack.config.js
```

### 1.3.**`.browserslistrc`**

在根目录新建 **`.browserslistrc`** 文件，填入如下内容：

```shell
> 1%             # 全球使用率超过1%的浏览器
last 2 version   # 每个浏览器的最后2个版本
not dead         # 排除已停止维护的浏览器（如IE10以下）
```

> 提示：
>
> - 通过 [caniuse.com  ↪](https://caniuse.com/usage-table) 查询浏览器支持率。
> - 通过 [browserslist ↪](https://browserslist.dev/?q=ID4gMSUsIGxhc3QgMiB2ZXJzaW9uLCBub3QgZGVhZA%3D%3D) 查询配置结果。

### 1.4. 配置编译脚本

**`package.json`**

```
"scripts": {
  "build": "webpack --config webpack.config.js"
},
```

### 1.5. Html

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!-- 定义常量值 BASE_URL 需通过 DefinePlugin 定义 -->
    <link rel="shortcut icon" href="<%= BASE_URL %>favicon.ico" type="image/x-icon" />
    <!-- 动态获取网页标题 -->
    <title><%= htmlWebpackPlugin.options.title %></title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

## 2. 资源管理

### 2.1. 打包页面

1）安装依赖：

```shell
$ pnpm add -D html-webpack-plugin
```

2）配置 **`webpack.config.js`**：

```javascript
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");

plugins: [
  // -- 定义全局变量
  new webpack.DefinePlugin({
    BASE_URL: "'./'",
  }),
  // -- HTML 模板
  new HtmlWebpackPlugin({
    title: "webpack-examples",
    template: "./public/index.html",
  }),
],
```

### 2.1. 打包 js

1）安装依赖：

```shell
$ pnpm add -D babel-loader @babel/core @babel/preset-env @babel/preset-typescript
```

2）配置 **`.babelrc`**：

```js
{
  "presets": [
    "@babel/preset-typescript",
    [
      "@babel/preset-env",
      {
        "useBuiltIns": "usage",
        "corejs": 3,
        "modules": false
      }
    ]
  ]
}
```

3）配置 **`webpack.config.js`**

```js
rules: [
  {
    test: /\.js$/,
    use: "babel-loader",
    exclude: /node_modules/,
    options: { cacheDirectory: true },
  },
],
```

### 2.2. 打包 ts

1）安装依赖

```shell
$ pnpm add -D typescript ts-loader
```

2）根目录新建 `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES5",
    "module": "ES6",
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "esModuleInterop": true
  },
  "include": ["src/**/*"]
}
```

> **提示**：
>
> - 这里我们添加一个基本的配置以支持 JSX，并将 TypeScript 编译到 ES5，你也可以选择使用 `npx tsc --init` 指令生成。
> - 参阅 [TypeScript 官方文档](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html) 了解更多关于 `tsconfig.json` 配置选项的信息。
> - `ts-loader` 使用 TypeScript 编译器 `tsc`，并依赖于 `tsconfig.json` 配置。请确保避免将 [`module`](https://www.typescriptlang.org/tsconfig#module) 设置为 `"CommonJS"`，否则 webpack 将无法对代码进行 [tree shaking](https://webpack.docschina.org/guides/tree-shaking)。

3）配置 **`webpack.config.js`**

```js
rules: [
  {
    test: /\.tsx?$/,
    use: "ts-loader",
    exclude: /node_modules/,
  },
],
```

### 2.3. 打包样式

#### 2.3.1. 处理CSS

1）安装依赖：

```shell
$ pnpm add -D style-loader css-loader postcss-loader postcss-preset-env less less-loader
```

依赖解读：

- [style-loader](https://www.npmjs.com/package/style-loader)：将CSS代码注入到HTML的 `<style>` 标签中，适用于开发环境
- [css-loader](https://www.npmjs.com/package/css-loader)：解析CSS文件的 `@import` 和 `url()` 语句，将其转换为CommonJS模块供Webpack处理
- [less-loader](https://www.npmjs.com/package/less-loader)：将Less语法编译为标准CSS，支持变量、嵌套等特性
- [postcss-loader](https://www.npmjs.com/package/postcss-loader)：通过插件链处理CSS（如自动前缀、压缩），需配合插件使用

- [postcss-preset-env](https://www.npmjs.com/package/postcss-preset-env)：集成PostCSS常用插件（如`autoprefixer`），无需单独配置浏览器前缀

2）配置 **`postcss.config.js`**：

```js
module.exports = {
  plugins: [require("postcss-preset-env")],
};
```

3）配置 **`webpack.config.js`**

```json
{
  test: /\.css$/,
  use: ["style-loader", "css-loader", "postcss-loader"],
},
{
  test: /\.less$/,
  use: ["style-loader", "css-loader", "postcss-loader", "less-loader"],
},
```

#### 2.3.2. 抽离CSS

安装依赖：

```shell
$ pnpm add -D mini-css-extract-plugin
```

配置 **`webpack.config.js`**

```javascript
const MiniCssExtractPlugin = require('mini-css-extract-plugin');


rules: [
  {
    test: /\.css$/,
    use: [MiniCssExtractPlugin.loader, "css-loader", "postcss-loader"],
  },
  {
    test: /\.less$/,
    use: [MiniCssExtractPlugin.loader, "css-loader", "postcss-loader", "less-loader"],
  },
],

  
plugins: [
  new MiniCssExtractPlugin({
    filename: "assets/[name]-[contenthash:8].css",
  }),
], 
```

> 提示：如果使用 `MiniCssExtractPlugin`，就不需要引入 `style-loader` 了。

#### 2.3.3. 压缩CSS

1）安装依赖：

```shell
$ pnpm add -D css-minimizer-webpack-plugin
```

2）配置 **`webpack.config.js`**

```javascript
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

plugins: [
  new MiniCssExtractPlugin(),
],
optimization: {
  minimizer: [new CssMinimizerPlugin()],
},
```

### 2.4. 打包图片

1）安装依赖：

```shell
$ pnpm add -D html-loader
```

> 提示：安装 `html-loader` 的目的是为了能够在 html 文件中通过 `src` 属性引入的图片资源，需将 `esModule: false`。

2）配置 **`webpack.config.js`**

```js
{
  test: /\.(png|svg|jpg|jpeg|gif)$/i,
  type: "asset",
  generator: {
    filename: "assets/[name]-[contenthash:8][ext][query]",
  },
  parser: {
    dataUrlCondition: {
      maxSize: 50 * 1024, // 50kb
    },
  },
},
{ test: /\.html$/i, loader: "html-loader" },
```

> ⚠️ 特别提示：
>
> 对于图片的处理，通常不建议直接在 html 文件中设置 img.src 属性来配置，当然，html-loader 可以为我们解决这个问题，但是可能导致我们之前设置的 htmlWebpackPlugin.options.title 失效，有几种方案可选：
>
> 1. 图片资源在脚本中通过 `import` 或者 `require` 导入。
> 2. 将图片放在 public 目录下，然后拷贝到输出目录，这样就可以直接访问如：/images/xxx.png

### 2.5. 打包字体

```javascript
{
  test: /\.(ttf|otf|eot|woff2?)$/,
  type: 'asset/resource',
  generator: {
    filename: 'assets/[name]-[contenthash:8][ext]',
  },
}
```

### 2.6. 拷贝资源

1）安装依赖：

```shell
$ pnpm add -D copy-webpack-plugin
```

2）配置 **`webpack.config.js`**

```javascript
const CopyWebpackPlugin = require('copy-webpack-plugin');

new CopyWebpackPlugin({
  patterns: [
    {
      from: 'public',
      globOptions: {
        ignore: ['**/index.html'],
      },
    },
  ],
})
```

## 3. DevServer

[DevServer ↪](https://webpack.docschina.org/configuration/dev-server/) 配置本地服务器

1）安装依赖

```shell
$ pnpm add -D webpack-dev-server
```

2）配置脚本

```json
"scripts": {
  "build": "webpack --config webpack.config.js --progress",
  "serve": "webpack serve --config webpack.config.js"
}
```

3）配置 **`webpack.config.js`**

```js
devServer: {
  static: { directory: path.join(__dirname, "dist") },
  host: "0.0.0.0",
  port: 3000,
  open: true,
  hot: true,
  compress: true,
  historyApiFallback: true,
  liveReload: true,
  watchFiles: ["src/**/*", "public/**/*"],
},
```

## 4. DevServer.Proxy

[devServer.proxy](https://webpack.docschina.org/configuration/dev-server/#devserverproxy)：配置代理

为了方便演示，我们先安装 axios 一来：

```shell
$ npm i axios -S
```

请求地址：GET https://api.github.com/users

正常请求资源：

```js
axios.get('https://api.github.com/users').then((resp) => {
  console.log(resp.data);
});
```

现在我们改用代理来实现，修改代码如下：

```js
axios.get('/api/users').then((resp) => {
  console.log(resp.data);
});
```

配置文件：

```js
devServer: {
  proxy: {
    '/api': {
      target: 'https://api.github.com',
      pathRewrite: { '^/api': '' },
      changeOrigin: true,
    },
  },
}
```

解读：

1. 配置文件中 `/api` 为标识，可以随便取名，当检测到发送http请求路径为 `/api/xxx` 时将会被代理，如 *`/api/users`*。
2. target：目标服务器地址，这里是 *`https://api.github.com`*
3. pathRewrite：发送请求时，请求路径重写：将 *`/api/xxx`* → *`/xxx`* （去掉 `/api`）
4. changeOrigin：
   - 为false时：请求头中host仍然是浏览器发送过来的host;
   - 为true时：送请求头中host会设置成target的值;

## 5. 代码分离

常用的代码分离有三种：

1. 入口起点：使用entry配置手动分离代码
2. 防止重复：使用Entry Dependencies或者SplitChunksPlugin去重和分离代码
3. 动态导入：通过模块的内联函数调用来分离代码

配置文件：
```js
optimization: {
  // -- 代码分离
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      // -- vendor 缓存组用于将来自 node_modules 目录的模块打包到名为 vendors 的块中。
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        priority: -10, // 指定缓存组的优先级。数字越大，优先级越高
        chunks: 'initial', // 指定在哪些类型的块中应用该缓存组
      },
      // -- common缓存组用于将多次被引用的模块打包到名为 common 的块中
      common: {
        name: 'common',
        minChunks: 2,
        priority: -20,
        chunks: 'initial',
        reuseExistingChunk: true, // 指定是否重用已经存在的块
      },
    },
  },
}
```

## 6. Resolve

[Resolve](https://webpack.docschina.org/configuration/resolve/)：解析

```js
resolve: {
  // -- 支持后缀（供webpack识别处理）
  extensions: ['.js', '.json', '.ts', '.jsx', '.tsx', '.vue'],
  // -- 别名
  alias: {
    '@': path.resolve(__dirname, 'src'),
  },
}
```

> **提示：**当你设置别名以后，需要在 **`jsconfig.json`** 或者 **`tsconfig.json`** 文件中写入如下配置：
>
> ```json
> {
>   "compilerOptions": {
>     "baseUrl": "./",
>     "paths": {
>       "@/*": ["src/*"]
>     }
>   },
> }
> ```

## 7. 配置文件（完整）

```js
const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

/** @type {import('webpack').Configuration} */
const config = {
  mode: "development",
  entry: "./src/main.js",
  output: {
    filename: "assets/[name]-[contenthash:8].js",
    path: path.resolve(__dirname, "dist"),
    // -- 在生成文件之前清空 output 目录
    // -- 5.20之前使用 clean-webpack-plugin 插件
    clean: true,
  },
  resolve: {
    // -- 支持后缀（供webpack识别处理）
    extensions: [".js", ".json", ".ts", ".jsx", ".tsx", ".vue"],
    // -- 别名
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            cacheDirectory: true,
          },
        },
      },
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader", "postcss-loader"],
      },
      {
        test: /\.less$/,
        use: [MiniCssExtractPlugin.loader, "css-loader", "postcss-loader", "less-loader"],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource",
        generator: {
          filename: "assets/[name]-[contenthash:8][ext][query]",
        },
        parser: {
          dataUrlCondition: {
            maxSize: 50 * 1024, // 50kb
          },
        },
      },
      {
        test: /\.(ttf|otf|eot|woff2?)$/,
        type: "asset/resource",
        generator: {
          filename: "assets/[name]-[contenthash:8][ext]",
        },
      },
    ],
  },
  plugins: [
    // -- 定义全局变量
    new webpack.DefinePlugin({
      BASE_URL: "'/'",
    }),
    // -- HTML 模板
    new HtmlWebpackPlugin({
      title: "webpack-examples",
      template: "./public/index.html",
    }),
    // -- 分离 CSS 文件
    new MiniCssExtractPlugin({
      filename: "assets/[name]-[contenthash:8].css",
    }),
    // -- 压缩 CSS 文件
    new MiniCssExtractPlugin(),
    // -- 复制文件
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "public",
          globOptions: {
            ignore: ["**/index.html"],
          },
        },
      ],
    }),
  ],
  optimization: {
    minimizer: [new CssMinimizerPlugin()],
  },
  devServer: {
    static: { directory: path.join(__dirname, "dist") },
    host: "0.0.0.0",
    port: 3000,
    open: true,
    hot: true,
    compress: true,
    historyApiFallback: true,
    liveReload: true,
    watchFiles: ["src/**/*", "public/**/*"],
  },
};

module.exports = config;

```

# 延伸

## 1. 指定配置文件编译

在实际开发过程中，你可能会分环境创建不同的配置文件来满足不同的开发需求，比如你在开发阶段，通常会创建一个 `webpack.dev.config.js` 文件，那么你在执行编译指令的时候需要指向该配置文件，如下所示：

```shell
$ ./node_modules/.bin/webpack --config ./build/webpack.dev.config.js
```

> 提示：假设配置文件的路径是：`./build/webpack.dev.config.js`，那你需要在配置文件中做如下修改：
>
> ```js
> module.exports = {
>  context: path.resolve(__dirname, "../"),
>  output: {   
>      path: path.resolve(__dirname, "../dist/"),
>  }
> };
> ```

> 注意：
>
> - 一旦修改了webpack的配置文件，必须重启服务或重新build。否则失效。
> - 如果自定义配置文件，切记在执行打包时一定要指定配置文件路径

## 2. 编译参数配置

webpack 自身提供了一些参数来优化编译任务，以下简单列出了一些参数：

| 参数         | 描述               |
| ------------ | ------------------ |
| `--config`   | 指定配置文件       |
| `--watch`    | 监听变动并自动打包 |
| `-p`         | 压缩混淆脚本       |
| `--progress` | 显示进度条         |

> 提示：想了解webpack更多参数，可在终端输入 `./node_modules/.bin/webpack -h`  查看

## 3. 引用三方库

**→ 局部引入**

```js
import $ from 'jquery';
```

**→ 全局引入**

```js
new webpack.ProvidePlugin({
  $: 'jquery',
  jQuery: 'jquery',
}),
```

```
{
  test: /\.html$/,
  exclude: /node_modules/,
  loader: 'html-loader',
  options: {
    esModule: false,
  },
},
```

# 推荐阅读

- [Webpack 中那些最易混淆的 5 个知识点](https://juejin.cn/post/6844904007362674701)

- [玩转 webpack，使你的打包速度提升 90%](https://juejin.cn/post/6844904071736852487)

- https://cloud.tencent.com/developer/article/1953196



