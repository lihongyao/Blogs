// #1 初体验
const component = () => {
  const element = document.createElement("h1");
  element.innerHTML = "Hello, webpack!";
  return element;
};
const root = document.getElementById("root");
root.appendChild(component());

const fetchX = async () => {
  return "X";
};
fetchX().then((resp) => {
  console.log(resp);
});

// # 2 打包TS
import Tools from "@/utils/tools";
Tools.sayHello();

// # 3. 打包样式
import "@/styles/common.css";
import "@/styles/main.less";
