import answer from "./answer";
import { repeat } from "lodash";

// -- 定义一个无用变量，测试tree-shaking
const unUsedVar = "Hello, Rollup!";

export const printAnswer = () => {
  // 1. 打印输出
  console.log(`The answer is ${answer}.`);
  // 2. 测试 loadash 的能力，打印30个1
  console.log(repeat("1", answer));
};
