// -- 导入必要的模块
const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");

const filePath = path.join(__dirname, "./试题模板导入（拆分）（纯企业文化试题）.xlsx");
const fileName = getFileName(filePath);
const data = _.shuffle(parseExcel(filePath));

// -- 将数据写入 JSON 文件
const jsonData = JSON.stringify(data, null, 2);
fs.writeFileSync(path.join(__dirname, `${fileName}.json`), jsonData);

/**
 *  读取并解析 Excel 文件
 * @param {*} filePath
 * @returns
 */
function parseExcel(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData = xlsx.utils.sheet_to_json(sheet);
  return jsonData.slice(4).map((item) => {
    const fields = ["__EMPTY", "__EMPTY_1", "__EMPTY_2", "__EMPTY_3", "__EMPTY_4", "__EMPTY_5"];
    const [questionType, questionText, rawChoices, correctAnswer, points, explanation] = fields.map((field) => item[field]);
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

/**
 * 获取文件名
 * @param {*} filePath
 * @returns
 */
function getFileName(filePath) {
  return path.basename(filePath, path.extname(filePath));
}
