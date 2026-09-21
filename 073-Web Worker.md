# 概述

[Web Worker](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Workers_API)（Web 工作线程）是浏览器提供的一种在**独立于主线程**的后台线程中运行脚本的能力。主线程负责渲染和交互，Worker 线程负责执行耗时任务，二者通过 **postMessage** 通信，从而避免大量计算阻塞页面，保持界面流畅。

**主要用途：**

1. **耗时计算**：大数组处理、复杂运算、加密/编解码
2. **数据处理**：大 JSON 解析、CSV/Excel 解析、图像数据处理
3. **轮询与定时**：在后台定时拉取数据而不阻塞 UI

**特点**：独立线程、不访问 DOM、与主线程通过 postMessage 通信、**依附于页面**（页面关闭 Worker 即终止）。

---

# 前置概念

## Web Worker vs. 主线程

| **对比项**   | **主线程**           | **Web Worker**           |
| ------------ | -------------------- | ------------------------ |
| 职责         | 渲染、事件、DOM 操作 | 纯计算、无 DOM           |
| 阻塞影响     | 耗时任务会卡顿页面   | 不阻塞主线程             |
| 可访问 DOM   | ✅ 可以               | ❌ 不可以                 |
| 通信方式     | —                    | postMessage / onmessage  |
| 生命周期     | 页面存活即存在       | 由页面创建，页面关闭即结束 |

## Web Worker vs. Service Worker

| **对比项**       | **Web Worker**               | **Service Worker**                 |
| ---------------- | ---------------------------- | ---------------------------------- |
| 主要作用         | 耗时计算，避免阻塞主线程     | 拦截请求、缓存、离线、后台能力     |
| 是否拦截网络请求 | ❌ 不可以                     | ✅ 可以（fetch 事件）               |
| 生命周期         | 依附于页面，页面关闭即结束   | 独立于页面，可长期存在             |
| 使用场景         | 大量计算、编解码、数据处理   | 离线缓存、PWA、推送、后台同步      |
| 运行环境         | HTTP/HTTPS 均可               | 仅 HTTPS 或 localhost              |

---

# 从 0 到 1：Web Worker 怎么用

## 1. 创建 Worker

主线程通过 `new Worker(scriptURL, options)` 创建 Worker：

- **scriptURL**：Worker 脚本的 URL（同源或符合 CORS）
- **options.type**：`'classic'`（默认）或 `'module'`（ES Module）
- **options.name**：Worker 名称，便于调试

```javascript
const worker = new Worker('/workers/calc.js', { type: 'module', name: 'calc' });
```

## 2. 主线程 → Worker：发消息

通过 `worker.postMessage(data)` 发送数据。`data` 会经过**结构化克隆**，可传对象、数组、Map、Set 等（不能传函数、DOM、部分特殊对象）。

```javascript
worker.postMessage({ type: 'sum', payload: [1, 2, 3, 4, 5] });
```

## 3. Worker → 主线程：收消息

通过 `worker.onmessage` 或 `worker.addEventListener('message', handler)` 接收 Worker 发来的数据。

```javascript
worker.onmessage = (event) => {
  console.log('Worker 返回:', event.data);
};
```

## 4. 错误与终止

- **worker.onerror**：Worker 内部未捕获错误会在这里收到
- **worker.terminate()**：主线程主动终止 Worker，立即释放

---

# 从 0 到 1：手写一个最小可用 Worker

**主线程（页面）：**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Web Worker 示例</title>
</head>
<body>
  <button id="run">执行耗时计算</button>
  <pre id="result"></pre>

  <script>
    const worker = new Worker('/workers/heavy.js');

    worker.onmessage = (e) => {
      document.getElementById('result').textContent = `结果: ${e.data}`;
    };

    worker.onerror = (e) => {
      document.getElementById('result').textContent = `错误: ${e.message}`;
    };

    document.getElementById('run').onclick = () => {
      worker.postMessage({ n: 10000000 }); // 计算 1 到 n 的和
    };
  </script>
</body>
</html>
```

**Worker 脚本 `/workers/heavy.js`：**

```javascript
self.onmessage = (event) => {
  const { n } = event.data;
  let sum = 0;
  for (let i = 0; i <= n; i++) {
    sum += i;
  }
  self.postMessage(sum);
};
```

把 `heavy.js` 放在站点可访问路径（如 `public/workers/heavy.js`），页面中 `new Worker('/workers/heavy.js')` 即可。这样耗时计算在 Worker 中执行，主线程不卡顿。

---

# 常见用法

## 1. 内联 Worker（Inline Worker）

通过 Blob URL 把脚本内容内联，不单独发请求，适合脚本很短、不想多一个文件的场景：

```javascript
const code = `
  self.onmessage = (e) => {
    const result = e.data.a + e.data.b;
    self.postMessage(result);
  };
`;
const blob = new Blob([code], { type: 'application/javascript' });
const url = URL.createObjectURL(blob);
const worker = new Worker(url);

worker.onmessage = (e) => console.log(e.data);
worker.postMessage({ a: 1, b: 2 });

URL.revokeObjectURL(url); // 用完后可释放
```

## 2. Worker 中引用脚本：importScripts（Classic Worker）

在 Classic Worker 里可用 `importScripts(url1, url2, ...)` 同步加载脚本：

```javascript
// worker.js (classic)
importScripts('/utils/helper.js');
self.onmessage = (e) => {
  const result = helperProcess(e.data);
  self.postMessage(result);
};
```

## 3. Module Worker（type: 'module'）

创建时加 `{ type: 'module' }`，在 Worker 里可直接用 `import` / `export`：

```javascript
// worker.mjs
import { heavyCompute } from './utils.mjs';
self.onmessage = (e) => {
  const result = heavyCompute(e.data);
  self.postMessage(result);
};
```

```javascript
const worker = new Worker('/workers/worker.mjs', { type: 'module' });
```

---

# 在 React / Next.js 中的使用

在 React 或 Next.js 中，Worker 一般在 **客户端** 创建（`useEffect` 或事件回调里），因为 `new Worker()` 依赖 `window`。下面以 Next.js 16+ App Router 为例。

## 1. 目录与文件

```
your-next-app/
├── app/
│   └── page.tsx
├── public/
│   └── workers/
│       └── heavy.js      # Worker 脚本（或放 src 里通过打包生成）
└── components/
    └── HeavyTask.tsx     # 使用 Worker 的客户端组件
```

若希望 Worker 参与打包（便于用 TypeScript、import），可使用 `worker-loader` 或 Next.js 的约定，这里先用 `public/workers/heavy.js` 做静态文件方式。

## 2. Worker 脚本（public/workers/heavy.js）

```javascript
self.onmessage = (event) => {
  const { type, payload } = event.data;
  if (type === 'sum') {
    const sum = payload.reduce((a, b) => a + b, 0);
    self.postMessage({ type: 'sum', result: sum });
  }
  if (type === 'fib') {
    const n = payload;
    const fib = (n) => (n <= 1 ? n : fib(n - 1) + fib(n - 2));
    self.postMessage({ type: 'fib', result: fib(n) });
  }
};
```

## 3. 客户端组件（使用 Worker）

```tsx
// components/HeavyTask.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export function HeavyTask() {
  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker('/workers/heavy.js');
    workerRef.current.onmessage = (e) => {
      setResult(e.data.result);
      setLoading(false);
    };
    workerRef.current.onerror = () => {
      setLoading(false);
    };
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const runSum = useCallback(() => {
    if (!workerRef.current) return;
    setLoading(true);
    workerRef.current.postMessage({ type: 'sum', payload: [1, 2, 3, 4, 5] });
  }, []);

  return (
    <div>
      <button onClick={runSum} disabled={loading}>
        {loading ? '计算中...' : '执行求和'}
      </button>
      {result !== null && <p>结果: {result}</p>}
    </div>
  );
}
```

## 4. 在页面中挂载

```tsx
// app/page.tsx
import { HeavyTask } from '@/components/HeavyTask';

export default function Page() {
  return (
    <main>
      <h1>Web Worker 示例</h1>
      <HeavyTask />
    </main>
  );
}
```

注意：Worker 脚本放在 `public/workers/` 时，路径为 `/workers/heavy.js`；若通过打包生成 Worker 文件，需按你使用的构建方式配置路径。

---

# 小结

- Web Worker 在**独立线程**中执行脚本，用于耗时计算，**不阻塞主线程**，**不能访问 DOM**。
- 使用步骤：**创建 Worker → postMessage 发数据 → onmessage 收结果 → 不用时 terminate**。
- 与主线程之间通过 **postMessage** 传递可结构化克隆的数据，不能传函数、DOM。
- 在 Next.js / React 中在**客户端**创建 Worker，可在 `useEffect` 里 `new Worker(...)`，在卸载时 `terminate()`。
- 脚本可放在 `public/workers/` 或通过打包工具生成；需要模块化时使用 `type: 'module'` 或 `importScripts`（Classic）。

---

# 参考

[1]. [Web Worker - MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Workers_API)
