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
