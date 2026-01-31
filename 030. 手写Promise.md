# 一、前言

现在基本上不管是大厂还是小厂，手写Promise已经成为了面试必考知识点，那么接下来，我们就一探究竟。首先我们看看关于Promise的常见面试题有哪些？

1. Promise 解决了什么问题？
2. Promise 的业界实现都有哪些？
3. Promise 常用的 API 有哪些？
4. 能不能手写一个符合 Promise/A+ 规范的 Promise?
5. Promise 在事件循环中的执行过程是怎样的？
6. Promise 有什么缺陷，可以如何解决？

这几个问题由浅入深，我们一个一个来看：

# 二、缘起 & 业界实现

在 Promise 出现以前，在我们处理多个异步请求嵌套时，代码往往是这样的：

```js
let fs = require("fs");
fs.readFile("./usrs.txt", "utf8", function (err, data) {
  fs.readFile(data, "utf8", function (err, data) {
    fs.readFile(data, "utf8", function (err, data) {
      console.log(data);
    });
  });
});
```

为了拿到回调的结果，我们必须一层一层的嵌套，可以说是相当恶心了。而且基本上我们还要对每次请求的结果进行一系列的处理，使得代码变的更加难以阅读和难以维护，这就是传说中臭名昭著的 **回调地狱**，产生**回调地狱**的原因归结起来有两点：

1. **嵌套调用**，第一个函数的输出往往是第二个函数的输入；
2. **处理多个异步请求并发**，开发时往往需要同步请求最终的结果。

原因分析出来后，那么问题的解决思路就很清晰了：

1. **消灭嵌套调用**：通过 Promise 的链式调用可以解决；
2. **合并多个任务的请求结果**：使用 Promise.all 合并请求。

Promise 正是用一种更加友好的代码组织方式，解决了异步嵌套的问题。我们来看看上面的例子用 Promise 实现是什么样的：

```js
let fs = require("fs");

function read(filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, "utf8", (err, data) => {
      if (err) reject(err);
      resolve(data);
    });
  });
}

read("./name.txt")
  .then((data) => {
    return read(data);
  })
  .then((data) => {
    return read(data);
  })
  .then(
    (data) => {
      console.log(data);
    },
    (err) => {
      console.log(err);
    }
  );
```

可见，臃肿的嵌套变得线性多了，这就是我们的异步神器 Promise！

让我们再次回归刚才的问题，**Promise为我们解决了什么问题？** 在传统的异步编程中，如果异步之间存在依赖关系，就需要通过层层嵌套回调的方式满足这种依赖，如果嵌套层数过多，可读性和可以维护性都会变得很差，产生所谓的“**回调地狱**”，而 Promise 将嵌套调用改为链式调用，增加了可阅读性和可维护性。也就是说，Promise 解决的是异步编码风格的问题。 **那 Promise 的业界实现都有哪些呢？** 业界比较著名的实现 Promise 的类库有 bluebird、Q、ES6-Promise。

# 三、手刃Promise

## 1. [Promise/A+](https://promisesaplus.com/)

我们想要手写一个 Promise，就要遵循 <u>Promise/A+</u> 规范，业界所有 Promise 的类库都遵循这个规范。

其实 Promise/A+ 规范对如何实现一个符合标准的 Promise 类库已经阐述的很详细了。每一行代码在 Promise/A+ 规范中都有迹可循，所以在下面的实现的过程中，我会尽可能的将代码和 Promise/A+ 规范一一对应起来。

## 2. 小试牛刀

**忆往昔**

我们先来回顾下最简单的 Promise 使用方式：

```js
function login(act, psw) {
  return new Promise((resolve, reject) => {
    if (act === "admin" && psw === "123") {
      resolve("登录成功");
    } else {
      reject("账号或密码错误");
    }
  });
}
login("admin", "123")
  .then((msg) => {
    console.log(msg);
  })
  .catch((error) => {
    console.log(error);
  });
```

> - 首先我们在调用 Promise 时，会返回一个 Promise 对象。
>
> - 构建 Promise 对象时，需要传入一个 **executor 函数**，Promise 的主要业务流程都在 executor 函数中执行。
>
> - 如果运行在 excutor 函数中的业务执行成功了，会调用 resolve 函数；如果执行失败了，则调用 reject 函数。
>
> - Promise 的状态不可逆，同时调用 resolve 函数和 reject 函数，默认会采取第一次调用的结果。

**基本特征**

以上简单介绍了 Promise 的一些主要的使用方法，结合 [Promise/A+](https://promisesaplus.com/) 规范，我们可以分析出 Promise 的基本特征：

> 1. promise 有三个状态：`pending`，`fulfilled`，or `rejected`；「规范 Promise/A+ 2.1」
>
> 2. `new promise`时， 需要传递一个`executor()`执行器，执行器立即执行；
>
> 3. `executor`接受两个参数，分别是`resolve`和`reject`；
>
> 4. promise  的默认状态是 `pending`；
>
> 5. promise 有一个`value`保存成功状态的值，可以是`undefined/thenable/promise`；「规范 Promise/A+ 1.3」
>
> 6. promise 有一个`reason`保存失败状态的值；「规范 Promise/A+ 1.5」
>
> 7. promise 只能从`pending`到`rejected`, 或者从`pending`到`fulfilled`，状态一旦确认，就不会再改变；
>
> 8. promise 必须有一个`then`方法，then 接收两个参数，分别是 promise 成功的回调 onFulfilled, 和 promise 失败的回调 onRejected；「规范 Promise/A+ 2.2」
>
> 9. 如果调用 then 时，promise 已经成功，则执行`onFulfilled`，参数是`promise`的`value`；
>
> 10. 如果调用 then 时，promise 已经失败，那么执行`onRejected`, 参数是`promise`的`reason`；
>
> 11. 如果 then 中抛出了异常，那么就会把这个异常作为参数，传递给下一个 then 的失败的回调`onRejected`；

**实现**

```js

// 定义三种状态
const PENDING = Symbol('PENDING'); // 进行中
const FULFILLED = Symbol('FULFILLED'); // 已成功
const REJECTED = Symbol('REJECTED'); // 已失败

class Promise {
  /**
   * 构造函数
   * @param {*} exector
   */
  constructor(exector) {
    // 初始化状态
    this.status = PENDING;
    // 将成功、失败结果放在this上，便于then、catch访问
    this.value = undefined;
    this.reason = undefined;
    // 成功态回调函数队列
    this.onFulfilledCallbacks = [];
    // 失败态回调函数队列
    this.onRejectedCallbacks = [];

    const resolve = (value) => {
      // 只有进行中状态才能更改状态
      if (this.status === PENDING) {
        this.status = FULFILLED;
        this.value = value;
        // 成功态函数依次执行
        this.onFulfilledCallbacks.forEach((fn) => fn(this.value));
      }
    };

    const reject = (reason) => {
      // 只有进行中状态才能更改状态
      if (this.status === PENDING) {
        this.status = REJECTED;
        this.reason = reason;
        // 失败态函数依次执行
        this.onRejectedCallbacks.forEach((fn) => fn(this.reason));
      }
    };

    try {
      // 立即执行executor
      // 把内部的resolve和reject传入executor，用户可调用resolve和reject
      exector(resolve, reject);
    } catch (e) {
      // executor执行出错，将错误内容reject抛出去
      reject(e);
    }
  }

  /**
   * 链式语法
   * @param {*} onFulfilled
   * @param {*} onRejected
   */
  then(onFulfilled, onRejected) {
    onFulfilled =
      typeof onFulfilled === 'function' ? onFulfilled : (value) => value;
    onRejected =
      typeof onRejected === 'function'
        ? onRejected
        : (reason) => {
            throw new Error(reason instanceof Error ? reason.message : reason);
          };
    // 保存this
    const self = this;
    return new Promise((resolve, reject) => {
      if (self.status === PENDING) {
        self.onFulfilledCallbacks.push(() => {
          // try捕获错误
          try {
            // 模拟微任务
            setTimeout(() => {
              const result = onFulfilled(self.value);
              // 分两种情况：
              // 1. 回调函数返回值是Promise，执行then操作
              // 2. 如果不是Promise，调用新Promise的resolve函数
              result instanceof Promise
                ? result.then(resolve, reject)
                : resolve(result);
            });
          } catch (e) {
            reject(e);
          }
        });
        self.onRejectedCallbacks.push(() => {
          // 以下同理
          try {
            setTimeout(() => {
              const result = onRejected(self.reason);
              // 不同点：此时是reject
              result instanceof Promise
                ? result.then(resolve, reject)
                : resolve(result);
            });
          } catch (e) {
            reject(e);
          }
        });
      } else if (self.status === FULFILLED) {
        try {
          setTimeout(() => {
            const result = onFulfilled(self.value);
            result instanceof Promise
              ? result.then(resolve, reject)
              : resolve(result);
          });
        } catch (e) {
          reject(e);
        }
      } else if (self.status === REJECTED) {
        try {
          setTimeout(() => {
            const result = onRejected(self.reason);
            result instanceof Promise
              ? result.then(resolve, reject)
              : resolve(result);
          });
        } catch (e) {
          reject(e);
        }
      }
    });
  }
  /**
   * 捕获异常
   * @param {*} onRejected
   * @returns
   */
  catch(onRejected) {
    return this.then(null, onRejected);
  }

  /**
   * 静态方法：resolve
   * @param {*} value
   * @returns
   */
  static resolve(value) {
    if (value instanceof Promise) {
      // 如果是Promise实例，直接返回
      return value;
    } else {
      // 如果不是Promise实例，返回一个新的Promise对象，状态为FULFILLED
      return new Promise((resolve, reject) => resolve(value));
    }
  }

  /**
   * 静态方法：reject
   * @param {*} reason
   * @returns
   */
  static reject(reason) {
    return new Promise((resolve, reject) => {
      reject(reason);
    });
  }

  /**
   * 静态方法：all
   * @param {*} promiseArr
   * @returns
   */
  static all(promiseArr) {
    return new Promise((resolve, reject) => {
      const len = promiseArr.length;
      const values = new Array(len);
      let count = 0; // 记录已经成功执行的promise个数
      for (let i = 0; i < len; i++) {
        // Promise.resolve()处理，确保每一个都是promise实例
        Promise.resolve(promiseArr[i]).then(
          (val) => {
            values[i] = val;
            count++;
            // 如果全部执行完，返回promise的状态就可以改变了
            if (count === len) resolve(values);
          },
          (err) => reject(err)
        );
      }
    });
  }

  /**
   * 静态方法：race
   * @param {*} promiseArr
   * @returns
   */
  static race(promiseArr) {
    return new Promise((resolve, reject) => {
      promiseArr.forEach((p) => {
        Promise.resolve(p).then(
          (val) => resolve(val),
          (err) => reject(err)
        );
      });
    });
  }
}
```









