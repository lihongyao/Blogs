// → 导入模块
const parser = require("@babel/parser");
const traverse = require("@babel/traverse");
const generator = require("@babel/generator").default;
const t = require("@babel/types");

// → 定义一段代码字符串
const codeString = `function square(n) {
  return n * n;
}`;

// → 解析代码
const ast = parser.parse(codeString, {
  sourceType: "module",
  plugins: ["jsx", "flow"],
});

// → 遍历节点
traverse.default(ast, {
  Identifier(path) {
    // 判断是否是 name 为 n 的标志符
    if (t.isIdentifier(path.node, { name: "n" })) {
      path.node.name = "x";
    }
  },
});

// → 将AST输出为目标代码
const { code, map } = generator(
  ast,
  {
    // 生成选项（可选）
    retainLines: false, // 是否保留原始行号
    compact: false, // 是否压缩代码
    comments: true, // 是否保留注释
    sourceMaps: false, // 是否生成 source map
    // 更多选项...
  },
  codeString // 原始代码（用于 source map）
);
console.log(code);
/**
 * 输出结果示例：
 * function square(x) {
 *   return x * x;
 * }
 */
