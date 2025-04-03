module.exports = ({ types: t }) => ({
  /** 插件名称 */
  name: "babel-plugin-xxx",
  /** 访问者 */
  visitor: {
    FunctionDeclaration(path) {
      const param = path.node.params[0];
      paramName = param.name;
      param.name = "x";
    },

    Identifier(path) {
      if (path.node.name === paramName) {
        path.node.name = "x";
      }
    },
  },
});
