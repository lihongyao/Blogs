# 前言

`reduce()` 是一个有用的函数式编程技术，特别在需求上需要对象或数组降维的时候。其作为ES6新增的常规数组方法之一，对比`forEach`、`filter`和`map`，在实际使用上好像有些被忽略，发现身边的人极少使用它，导致这个如此强大的方法被逐渐埋没。

# 基础语法

下面对 `reduce` 的语法进行简单说明，详情可查看 `MDN` 的 [reduce()](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce) 的相关说明。

- 定义：对数组中的每个元素执行一个自定义的累计器，将其结果汇总为单个返回值
- 形式：`array.reduce((t, v, i, a) => {}, initValue)`
- 参数
  - **callback**：回调函数(`必选`)
  - **initValue**：初始值(`可选`)
- 回调函数的参数
  - **total**(`t`)：累计器完成计算的返回值(`必选`)
  - **value**(`v`)：当前元素(`必选`)
  - **index**(`i`)：当前元素的索引(`可选`)
  - **array**(`a`)：当前元素所属的数组对象(`可选`)
- 过程
  - 以`t`作为累计结果的初始值，不设置`t`则以数组第一个元素为初始值
  - 开始遍历，使用累计器处理`v`，将`v`的映射结果累计到`t`上，结束此次循环，返回`t`
  - 进入下一次循环，重复上述操作，直至数组最后一个元素
  - 结束遍历，返回最终的`t`

reduce 的精华所在是将累计器逐个作用于数组成员上，**把上一次输出的值作为下一次输入的值**。下面举个简单的栗子，看看`reduce`的计算结果。

```js
const arr = [3, 5, 1, 4, 2];
const a = arr.reduce((t, v) => t + v);
// 等同于
const b = arr.reduce((t, v) => t + v, 0);
```

代码不太明白没关系，贴一个 reduce 的作用动图应该就会明白了。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7ee0cc54777d42498fa32778bd78e6d5~tplv-k3u1fbpfcp-watermark.image)

`reduce` 实质上是一个累计器函数，通过用户自定义的累计器对数组成员进行自定义累计，得出一个由累计器生成的值。另外 `reduce` 还有一个胞弟`reduceRight`，两个方法的功能其实是一样的，只不过 `reduce` 是升序执行，`reduceRight` 是降序执行。

> 提示：对空数组调用 `reduce()` 和 `reduceRight()` 是不会执行其回调函数的，可认为 `reduce()` 对空数组无效

# 高级用法

## 1. 累加累乘

```js

/**
 * 累加
 * @param  {...any} vals 
 * @returns 
 */
function Accumulation(...vals) {
  return vals.reduce((t, v) => t + v, 0);
}

/**
 * 累乘
 * @param  {...any} vals 
 * @returns 
 */
function Multiplication(...vals) {
  return vals.reduce((t, v) => t * v, 1);
}
```

```js
(function () {
  console.log(accumulation(1, 2, 3, 4, 5)); // 15
  console.log(multiplication(1, 2, 3, 4, 5)); // 120
})();
```

## 2. 权重求和

```js
const scores = [
  { score: 90, subject: "Chinese", weight: 0.5 },
  { score: 95, subject: "Math", weight: 0.3 },
  { score: 85, subject: "English", weight: 0.2 },
];
const result = scores.reduce((t, v) => t + v.score * v.weight, 0); 
console.log(result); // 90.5
```

## 3. 代替reverse

```js
/**
 * 反转数组
 * @param {*} arr
 * @returns
 */
function reverse(arr) {
  return arr.reduceRight((t, v) => (t.push(v), t), []);
}
// 等价于
function reverse(arr) {
  return arr.reduceRight((t, v) => {
    t.push(v);
    return t;
  }, []);
}
```

```s
console.log(reverse([1, 2, 3, 4])) //  [4, 3, 2, 1]
```

## 4. 代替map和filter

```js
// 4. 代替map和filter
const arr = [0, 1, 2, 3];
// 代替map：[0, 2, 4, 6]
const a = arr.map((v) => v * 2);
const b = arr.reduce((t, v) => [...t, v * 2], []);

// 代替filter：[2, 3]
const c = arr.filter((v) => v > 1);
const d = arr.reduce((t, v) => (v > 1 ? [...t, v] : t), []);

// 代替map和filter：[4, 6]
const e = arr.map((v) => v * 2).filter((v) => v > 2);
const f = arr.reduce((t, v) => (v * 2 > 2 ? [...t, v * 2] : t), []);
```

## 5. 代替some和every

```js
const grades = [
  { score: 65, subject: "chinese" },
  { score: 60, subject: "math" },
  { score: 80, subject: "english" },
];

// 代替some：至少一门合格
const isAtLeastOneQualified = grades.reduce(
  (t, v) => (t || v.score >= 60 ? true : false),
  false
); // true

// 代替every：全部合格
const isAllQualified = grades.reduce((t, v) =>
  t && v.score >= 60 ? true : false,
  true                                   
); // false
```



















