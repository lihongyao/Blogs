// -- 导入模块
const { src, dest, parallel, series, watch } = require("gulp");
const browserSync = require("browser-sync");
const bs = browserSync.create();
const del = require("del");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const purgecss = require("@fullhuman/postcss-purgecss");
const $ = require("gulp-load-plugins")();

// -- 清除文件
const clean = () => {
  return del(["dist"]);
};

// -- 服务 & 热更新
const serve = () => {
  // watch(被监视的文件，对应的任务)
  watch("src/index.html", html);
  watch("src/**/*.less", style);
  watch("src/**/*.js", script);
  watch("src/images/**", image);
  // 初始化服务
  bs.init({
    notify: false, // 禁用浏览器右上角的 browserSync connected 提示框
    files: "dist/**", // 监视 dist 下 文件的变化，然后在浏览器上实时更新
    server: {
      baseDir: "./dist", // 指定服务启动的目录
    },
    port: 5000,
  });
};

// -- 处理样式
const style = () => {
  var plugins = [
    autoprefixer({ overrideBrowserslist: ["last 2 version"] }),
    cssnano(),
    purgecss({
      content: ["./src/**/*.html"],
    }),
  ];
  return src("src/styles/*.less", { base: "src" })
    .pipe($.less())
    .pipe($.postcss(plugins))
    .pipe($.rename({ extname: ".min.css" }))
    .pipe(dest("dist"));
};

// -- 处理脚本
const script = () => {
  return src("src/**/*.js")
    .pipe(
      $.babel({
        presets: ["@babel/preset-env"],
      })
    )
    .pipe($.uglify())
    .pipe($.rename({ extname: ".min.js" }))
    .pipe(dest("dist"));
};

// -- 处理模板
const html = () => {
  return src("src/**/*.html")
    .pipe(
      $.htmlmin({
        collapseWhitespace: true, // 去除标签之间多余的空行和空白
        minifyCSS: true, // 压缩HTML中的CSS代码
        minifyJS: true, // 压缩HTML中的JS代码
      })
    )
    .pipe(dest("dist"));
};

// -- 处理图片
const image = () => {
  return src("src/images/**", { base: "src" }).pipe($.imagemin()).pipe(dest("dist"));
};

const build = series(clean, parallel([style, script, html, image]));
const dev = series(build, serve);

module.exports = {
  build,
  dev,
  serve,
};
