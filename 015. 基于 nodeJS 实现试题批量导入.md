# 前言

新春将至，为丰富节日氛围，计划组织「**新春游园答题活动**」。本次活动采用 H5 页面形式，用户扫码即可参与答题。由于题库包含上百道题目，涵盖单选题、多选题和判断题类型，为了提高效率，决定通过批量导入试题的方式简化流程。本篇文章将详细介绍如何使用 Node.js 实现试题的批量导入。

# 试题模板设计

模板设计是批量导入的核心，合理的模板设计能简化 Excel 数据解析逻辑。以下是设计好的模板：

| 序号 | 试题类型 | 题干                   | 选项                                    | 答案 | 分值 | 解析                                |
| ---- | -------- | ---------------------- | --------------------------------------- | ---- | ---- | ----------------------------------- |
| 1    | 单选题   | 太阳系中最大的行星是？ | A.木星<br/>B.地球<br/>C.火星<br/>D.金星 | A    | 2    | 木星是太阳系中最大的行星。          |
| 2    | 多选题   | 下列哪些是哺乳动物？   | A.狮子<br/>B.海豚<br/>C.蛇<br/>D.青蛙   | A,B  | 2    | 狮子和海豚是哺乳动物，其余不是。    |
| 3    | 判断题   | 水的冰点是 0 摄氏度。  |                                         | 正确 | 2    | 水在标准大气压下的冰点为 0 摄氏度。 |

## 填写规则

1. 试题类型支持「单选题」、「多选题」和「判断题」。
2. 单选题、多选题选项需至少包含 4 个，使用换行符隔开，超过 4 个选项可继续增加。
3. 多选题答案以英文逗号隔开，如 `A,C,D`。
4. 判断题无需填写选项，仅在答案列填写「正确」或「错误」。

## 关于选项设计的讨论

最初选项设计为如下形式：

| 其他列 | 选项A | 选项B | 选项C | 选项D | 其他列 |
| ------ | ----- | ----- | ----- | ----- | ------ |
| ...    | 木星  | 地球  | 火星  | 金星  | ...    |

此设计解析简单，在解析 excel 列时，不需要对数据做特殊处理，但难以支持动态选项扩展，容易因列移位导致解析错误。因此，最终将选项集中在一列，用换行符分隔，实现更灵活的兼容性。

## 数据解析示例

以第一题为例，解析后数据为：

```js
{
  ...
  __EMPTY: '单选题',
  __EMPTY_1: '太阳系中最大的行星是？',
  __EMPTY_2: 'A.木星\nB.地球\nC.火星\nD.金星',
  __EMPTY_3: 'A',
  __EMPTY_4: 2,
  __EMPTY_5: '木星是太阳系中最大的行星。'
}
```

我们可用正则表达式将选项 `__EMPTY_2` 转换为数组：

```js
["木星", "地球", "火星", "金星"]
```

代码实现如下：

```js
rawChoices.match(/[^\r\n]+/g).map((item) => item.split(".")[1])
```

# 代码实现

**1）安装依赖**

```shell
$ pnpm add xlsx lodash
```

依赖解读：

- [`xlsx`](https://www.npmjs.com/package/xlsx)：`xlsx` 是一个强大的 Node.js 与浏览器端通用的 npm 包，能轻松实现 Excel 文件（XLSX、XLS 等格式）的读写操作，支持多种数据导入导出及样式处理。

- [`lodash`](https://www.npmjs.com/package/lodash)：`lodash` 是一个功能丰富且高效的 npm 包，提供了大量实用的工具函数，用于数组、对象、字符串等数据类型的操作和处理，能显著简化 JavaScript 编程

  由于小伙伴在准备试题时，是按类型来填充的，为了随机均匀，我使用了 `_.shuffle()` 方法打乱顺序。

**2）导入必要依赖**

```js
const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
```

**3）封装解析函数**

```tsx
function parseExcel(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData = xlsx.utils.sheet_to_json(sheet);
  return jsonData.slice(4).map((item) => {
    const fields = ["__EMPTY", "__EMPTY_1", "__EMPTY_2", "__EMPTY_3", "__EMPTY_4", "__EMPTY_5"];
    const [
      questionType, 
      questionText, 
      rawChoices, 
      correctAnswer, 
      points, 
      explanation
    ] = fields.map((field) => item[field]);
    let choices = rawChoices ? rawChoices.match(/[^\r\n]+/g).map((item) => item.split(".")[1]) : [];
    if (questionType === "判断题") {
      choices = ["正确", "错误"];
    }
    return {
      questionType,
      questionText,
      choices: choices,
      correctAnswer: correctAnswer || "",
      points: Number(points) || 0,
      analysis: explanation || "",
    };
  });
}

function getFileName(filePath) {
  return path.basename(filePath, path.extname(filePath));
}
```

> 温馨提示：在解析 excel 时，这里只是给到了一个参考，在实际应用中，将会更为复杂，你可能需要去判断导入数据是否根据试题模板要求或规则来填写等。

**4）调用解析并写入 JSON 文件**

```js
const filePath = path.join(__dirname, "./试题模板.xlsx");
const fileName = getFileName(filePath);
const data = _.shuffle(parseExcel(filePath));
const jsonData = JSON.stringify(data, null, 2);
fs.writeFileSync(path.join(__dirname, `${fileName}.json`), jsonData);
```

# 完整代码

完整代码如下：

```js
const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");

const filePath = path.join(__dirname, "./试题模板.xlsx");
const fileName = getFileName(filePath);
const data = _.shuffle(parseExcel(filePath));
const jsonData = JSON.stringify(data, null, 2);
fs.writeFileSync(path.join(__dirname, `${fileName}.json`), jsonData);

function parseExcel(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData = xlsx.utils.sheet_to_json(sheet);
  return jsonData.slice(4).map((item) => {
    const fields = ["__EMPTY", "__EMPTY_1", "__EMPTY_2", "__EMPTY_3", "__EMPTY_4", "__EMPTY_5"];
    const [questionType, questionText, rawChoices, correctAnswer, points, explanation] =
      fields.map((field) => item[field]);
    let choices = rawChoices ? rawChoices.match(/[^\r\n]+/g).map((item) => item.split(".")[1]) : [];
    if (questionType === "判断题") {
      choices = ["正确", "错误"];
    }
    return {
      questionType,
      questionText,
      choices,
      correctAnswer: correctAnswer || "",
      points: Number(points) || 0,
      analysis: explanation || "",
    };
  });
}

function getFileName(filePath) {
  return path.basename(filePath, path.extname(filePath));
}
```

# 尾言

通过本篇文章，希望你能快速掌握如何基于 Node.js 实现批量导入试题。如果你在实现过程中有任何疑问，欢迎在评论区留言讨论！

