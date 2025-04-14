# 前言

最近接手公司一个多仓库项目，包含4个独立的Git代码库：两个历史遗留系统、一个PPT制作功能模块，以及新开发的集成平台。为实现渐进式整合，我们采用iframe方案将各系统嵌套集成。这种架构下需要解决跨域通信、权限控制、Token传递等一系列技术问题，本文将记录实际开发中遇到的iframe相关挑战及解决方案，持续更新维护

# 前置知识

在开始之前，我们需要了解一些前置知识。

## 1. 同源策略

浏览器的同源策略（Same-Origin Policy，SOP）是Web安全的核心机制，它通过限制不同源之间的交互来保护用户数据安全。该策略要求交互双方必须具有完全相同的协议（如https）、域名（如example.com）和端口（如443），否则将禁止数据共享。这种设计有效防范了XSS跨站脚本攻击和CSRF跨站请求伪造等常见Web安全威胁，为现代Web应用提供了基础安全防护。

同源策略的基本规则如下：

1. 协议：页面间的协议必须相同。例如，一个使用 HTTP 的页面不能直接访问使用 HTTPS 的页面中的数据。

2. 域名：页面间的域名必须相同，意味着子域名不同也被认为不同源。例如：`example.com` 和 `sub.example.com` 是不同的源。

3. 端口：如果指定了端口号，页面间的端口号必须相同。例如，使用 80 端口和使用 8080 端口的页面被视为不同源。

浏览器的同源策略（Same-Origin Policy，SOP）是客户端层面的安全机制，由浏览器主动执行而非服务器强制实施。这意味着即使服务器通过CORS（跨域资源共享）明确允许跨域访问，浏览器仍会首先根据同源策略对页面脚本和请求进行拦截验证。这种设计确保了即使服务端配置存在疏漏，客户端的核心安全防护依然有效，为Web安全提供了双重保障机制。

在同源策略的限制下，实现跨域访问的常见解决方案包括：

1. JSONP（**JSON** with **P**adding）：利用`<script>`标签不受同源策略限制的特性，通过动态创建脚本元素获取跨域数据。
2. 跨域资源共享（CORS）：服务端通过设置特定的HTTP响应头，明确声明允许跨域访问的源、方法和头部信息。
3. 代理服务：在相同域名下部署中间层服务，由该服务转发跨域请求，避免浏览器直接发起跨域访问。
4. postMessage API：通过HTML5提供的标准化消息传递机制，实现不同窗口或iframe之间的安全通信。

> 本文主要讨论基于`postMessage API`在不同窗口间实现通信。

## 2. Web通信

Web通信（Web Messaging）是现代浏览器提供的安全跨上下文数据交换机制，它通过标准化的API实现了不同浏览上下文间的安全数据传递。该机制主要包含两大核心实现方式：。

- **跨文档通信（cross-document messaging）** —— *适用于当前项目需求*

  - 专为解决同源策略下的跨iframe/窗口通信需求
  - 基于`window.postMessage()`API实现
  - 采用消息事件驱动模型
  - 支持任意窗口对象间的安全通信

- **通道通信（channel messaging）**

  - 通过`MessageChannel`接口建立双向通信管道
  - 提供更结构化的消息传递机制
  - 适用于需要持续对话的复杂场景

作为HTML5通信标准的重要组成部分，这些机制与Server-Sent Events、WebSocket等技术共同构成了现代Web应用的多层次通信体系。其设计既保证了DOM安全性，又提供了必要的跨源通信能力，有效平衡了安全与功能需求。

## 3. 通信事件

[`message`](https://developer.mozilla.org/zh-CN/docs/Web/API/MessageEvent) 事件作为Web通信的基础单元，是所有跨上下文交互的核心载体。该事件对象包含五个关键属性，构成完整的消息元数据：

1. **数据载体** (`data`)
   - 传输的实际消息内容
   - 支持结构化克隆算法允许的所有数据类型
   - 包括但不限于字符串、对象、数组等
2. **安全验证** (`origin`)
   - 完整的源标识符（协议+域名+端口）
   - 接收方必须验证此字段以确保消息来源可信
   - 示例：`https://example.com:443`
3. **消息追踪** (`lastEventId`)
   - 主要用于Server-Sent Events的连续性消息
   - 在跨文档通信中通常为空值
4. **发送方标识** (`source`)
   - 指向消息来源的引用对象
   - 可能是Window、MessagePort或ServiceWorker实例
   - 可用于建立双向通信通道
5. **端口扩展** (`ports`)
   - 附加的MessagePort对象集合
   - 支持建立额外的通信通道
   - 默认为空数组

> 技术说明：
>
> 作为DOM Event接口的扩展实现，MessageEvent具有不可冒泡、不可取消的特性，这种设计确保了通信过程的安全性和可靠性。开发者应当始终验证origin属性，并正确处理可能的消息类型，以构建安全的跨源通信系统。

# 通信方式

## 1. URL参数

在指定 iframe.src 属性时，可以在子页面的URL中添加 Query 参数，例如：

```html
https://examples.com?id=1
```

在子页面中，可以通过 `location.search` 读取：

```js
location.search → ?id=1
```

## 2. 锚点（Hash）

在指定iframe.src属性时，可以在子页面的URL中添加锚点，例如：

```html
https://examples.com#1
```

在子页面中，可以通过 `location.hash` 读取：

```js
location.hash → #1
```

## 3. Cookie

通过 Cookie 在 iframe 父子窗口间传递数据是一种经典的跨域通信方法，其核心实现要点如下：

### 基本原理

1. **同源场景**（最简实现）

- 父子窗口同源时可直接读写 document.cookie
- 自动遵循浏览器 Cookie 同源策略



2. **跨域场景**（需特殊配置）

- 要求父子窗口共享顶级域名（如 a.example.com 和 b.example.com）
- 必须设置 Cookie 的 domain 属性为 `.example.com`
- 需要设置 SameSite=None 和 Secure 属性

### 关键实现步骤

1. **发送方设置**

   ```js
   // 设置跨域 Cookie（需满足上述条件）
   document.cookie = `token=abc123; domain=.example.com; path=/; SameSite=None; Secure`;
   ```

2. **接收方获取**

   ```js
   // 子窗口读取 Cookie
   const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
   ```

## 4. postMessage *

### APIs

#### 消息发送接口

发送数据的核心js代码如下：

```javascript
otherWindow.postMessage(message, targetOrigin, [transfer]);
```

参数解析：

- `otherWindow`：表示其他窗口的引用，例如：
  - frame 的 `contentWindow` 属性
  - [`window.open()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/open) 返回的窗口对象
  - [`window.frames`](https://developer.mozilla.org/en-US/docs/Web/API/Window/frames) 集合中的窗口引用
- `message`：传输数据
  - 支持结构化克隆算法允许的所有数据类型
  - 包括字符串、对象、数组等复合类型
- `targetOrigin`：安全域限制
  - 格式：协议 + 域名 + 端口（如 `https://example.com:443`）
  - 特殊值 `"*"` 表示不限制目标源（慎用）
  - 生产环境建议始终指定精确的 origin
- `transfer`（可选）：可转移对象
  - 包含 ArrayBuffer、MessagePort 等 Transferable 对象
  - 所有权转移后发送方将无法继续使用

> 浏览器兼容性：所有现代浏览器均完整支持（包括移动端），IE8+ 提供基本支持。建议在实际使用前进行功能检测：
>
> ```js
> if (!window.postMessage) {
>     console.error('当前浏览器不支持postMessage');
> }
> ```
>
> 参考 [这里（CanIUse） >>](https://caniuse.com/?search=postmessage)

#### 消息接收处理

```js
window.addEventListener("message", messageHandler);
function messageHandler(event) {
    // 必须验证消息来源
    const allowedOrigins = ['https://trusted.example'];
    if (!allowedOrigins.includes(event.origin)) return;
    
    // 处理有效消息
    console.log('Received:', event.data);
}
```

### 示例

在进行跨文档消息发送之前，我们需要先创建新的iframe或新的窗口以创建新的Web浏览上下文。

```shell
$ mkdir project-1 project-2 && touch project-1/index.html project-2/index.html
```

**`project-1/index.html`**

```html
<!DOCTYPE html>
<html lang="zh-CN">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project 1</title>
</head>

<body>
  <header style="margin-bottom: 16px;">
    <h3>🖥 父窗口</h3>
    <input type="text" style="height: 19px;" placeholder="Enter message" />
    <button type="button" class="send">发送消息</button>
    <p>来自子窗口的消息：<span id="message"></span></p>
  </header>

  <iframe style="border: 1px solid #eee;" src="http://localhost:5501/index.html"></iframe>

  <script>

    const ifr = document.querySelector("iframe");
    const sendBtn = document.querySelector("button.send");
    const msgInput = document.querySelector("input")
    const msgSpan = document.querySelector("#message");

    // 1. 发送消息给子窗口
    sendBtn.addEventListener("click", function () {
      const postData = msgInput.value;
      ifr.contentWindow.postMessage(postData, '*');
    }, false);
    // 2. 接收子窗口发送的消息
    window.addEventListener('message', function (message) {
      msgSpan.textContent = message.data;
    }, false);

  </script>
</body>

</html>
```

**`project-2/index.html`**

```html
<!DOCTYPE html>
<html lang="zh-CN">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project 2</title>
</head>

<body>
  <h3>🖥 子窗口</h3>
  <p>来自父窗口的信息：<span id="message"></span></p>
  <script>

    const eleMessage = document.querySelector("#message");
    window.addEventListener("message", function (message) {
      // -- 接收父窗口发送的消息
      eleMessage.textContent = message.data;
      // -- 发送消息给父窗口
      const dateString = new Date().toLocaleString();
      const postData = `消息已收到，接收时间：${dateString}`;
      message.source.postMessage(postData, "*");
    }, false);


  </script>
</body>

</html>
```

运行之后的访问路径：

- project-1：http://localhost:5500/index.html
- project-2：http://localhost:5501/index.html

演示效果：

![](./IMGS/web_messaging_ifr.gif)

# 疑难杂症

## 1. 父窗口修改子窗口样式

需要考虑到跨域限制（Same-Origin Policy）

同源策略限制了一个网页只能访问来源相同（协议、域名和端口相同）的资源，以防止恶意网页窃取信息。

因此，如果你想在父窗口修改子窗口的样式，需要考虑同源和非同源的情况。

> **同源**

如果父窗口和子窗口同源，你可以通过以下步骤在父窗口中修改子窗口的样式。

1. 获取 `<iframe>` 元素：在父窗口 的 js 代码中，首先获取嵌套子窗口 的 `<iframe>` 元素。
2. 访问 `<iframe>` 内部文档：通过`iframe`元素的`contentWindow`属性，可以访问内部窗口对象，然后通过`document`属性可以获取内部文档对象。
3. 修改样式：一旦获取了内部文档对象，你可以像操作主窗口中的DOM元素一样操作子窗口中的文档节点。

以下是一个简单示例代码，展示如何在父窗口中修改嵌套在`<iframe>`中的网页的背景颜色：

```js
const ifr = document.getElementById('myIframe');
const ifrDocument = iframe.contentWindow.document;
const targetElement = iframeDocument.querySelector('.target-element');
if (targetElement) {
    targetElement.style.backgroundColor = 'orange';
}
```

> **跨域**

如果父窗口和子窗口不在同一个源下，浏览器的安全机制将阻止这种操作。在跨域情况下，你可能需要与目标网页 B 合作，在网页 B 中提供一些接口或方式来允许网页 A 修改样式。通常可以基于 postMessage 实现双向通信通知修改样式。

## 2. 权限相关

当我们在子窗口中需要获取浏览器权限时（比如全屏、访问摄像头/麦克风等等），可以添加 **`allow`** 属性。

`<iframe>` 元素的 allow 属性用于指定哪些功能和权限应该允许在嵌入的 iframe 中使用。这些属性可以用于增强安全性和控制嵌入内容的行为。以下是一些常见的 allow 属性及其描述：

- `allowcamera`：允许 iframe 使用设备的摄像头。*（常用）*
- `allowmicrophone`：允许 iframe 使用设备的麦克风。*（常用）*

- `allowfullscreen`：允许在 iframe 中启用全屏模式。如果未设置此属性，嵌入的内容可能无法进入全屏模式。*（常用）*
- `allowpaymentrequest`：允许 iframe 使用 Payment Request API，以便进行付款处理。*（常用）*
- `allowautoplay`：允许嵌入的音频或视频自动播放，即使自动播放被浏览器禁用。*（常用）*
- `allowvr`：允许 iframe 使用虚拟现实（VR）设备和功能，以便在 VR 环境中查看内容。
- `allowgeolocation`：允许 iframe 访问设备的地理位置信息。
- `allowencryptedmedia`：允许 iframe 使用加密媒体功能，如播放受 DRM 保护的内容。
- `allowpointerlock`：允许 iframe 请求鼠标指针锁定，以控制鼠标输入。
- `allowscripts`：允许 iframe 中执行脚本，通常与 `sandbox` 属性结合使用以提供更精细的脚本控制。

## 3. 事件穿透

[`pointer-events`](https://developer.mozilla.org/zh-CN/docs/Web/CSS/pointer-events)

## 4. 如何防止网页被他人通过 \<iframe> 嵌套？

为了防止你的网页被其他网站通过 `<iframe>` 嵌入（**点击劫持、内容盗用等安全风险**），可以采用以下几种防护措施：

> 📖 **使用 `X-Frame-Options` HTTP 头** —— 2009 年，IE8时代，基础防护，逐步淘汰。

```
X-Frame-Options: DENY          # 完全禁止嵌套（最安全）
X-Frame-Options: SAMEORIGIN    # 仅允许同域名嵌套
X-Frame-Options: ALLOW-FROM https://example.com  # 仅允许特定域名（部分浏览器支持）—— 已废弃
```

> 📖 **使用 `Content-Security-Policy (CSP)` HTTP 头** —— 2012 年（现代浏览器标准），综合防护，W3C推荐标准。

```
Content-Security-Policy: frame-ancestors 'none'                     # 完全禁止
Content-Security-Policy: frame-ancestors 'self'                     # 仅允许同域名 
Content-Security-Policy: frame-ancestors example.com *.example.com  # 仅允许特定域名
Content-Security-Policy: frame-ancestors https:                     # 允许所有HTTPS网站
```

> 📖 **前端 JavaScript 检测（辅助方案）**

如果无法修改服务器配置，可以用 JS 检测是否被嵌套，并强制跳转：

```js
if (window !== window.top) {
  window.top.location.href = window.location.href; // 强制跳出 iframe
}
```

**缺点**：

- 可以被绕过（如 `sandbox` 属性限制 JS 执行）。
- 不如 HTTP 头安全。

> 📖 **结合 `X-Frame-Options` + `CSP`（最佳实践）**

```
# 同时设置两者确保最大兼容性
add_header X-Frame-Options "SAMEORIGIN";
add_header Content-Security-Policy "frame-ancestors 'self'";
```

### 终极方案

如果网站涉及敏感操作（如支付、登录），建议：

1. **禁用所有 iframe 嵌套**（`X-Frame-Options: DENY`）。
2. **启用 HTTPS**，防止中间人攻击。
3. **使用 `SameSite` Cookie**，防止 CSRF 攻击。

### **测试是否生效**

访问你的网站，在浏览器控制台输入：

```javascript
// 尝试用 iframe 嵌套你的网站
document.body.innerHTML = '<iframe src="你的网站URL"></iframe>';
```

如果防护生效，浏览器会阻止加载或直接跳出 iframe。

# 参考文献

1. [MDN.window.postMessage](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/postMessage)
2. [张鑫旭.HTML5 postMessage iframe跨域web通信简介](https://www.zhangxinxu.com/wordpress/2012/02/html5-web-messaging-cross-document-messaging-channel-messaging/)
