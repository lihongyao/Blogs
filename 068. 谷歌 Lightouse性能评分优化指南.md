# 概述

[Lighthouse ↪](https://developer.chrome.com/docs/lighthouse?hl=zh-cn) 是一款自动化的开源工具，可帮助您提升网页质量。您可以在任何网页上运行该脚本。该工具可针对性能、无障碍、搜索引擎优化 (SEO) 等方面进行评估。

Lighthouse 评估类别：

- 效果审核

  衡量性能并寻找提升网页加载速度的机会。
  
- 无障碍功能审核

  确定是否所有用户都能有效访问网站内容并浏览您的网站。

- 最佳实践审核

  遵循以下最佳实践可改善网页的代码健康状况。

- SEO 审核

  确保您的网页针对搜索引擎结果排名进行了优化。

你可以在谷歌浏览器中使用 Lighthouse，参考 [在 Chrome 开发者工具中运行 Lighthouse  ↪](https://developer.chrome.com/docs/lighthouse/overview?hl=zh-cn#devtools)。

# 效果审核

## FCP

[First Contentful Paint (FCP) ↪](https://web.dev/articles/fcp?hl=zh-cn)

首次内容渲染 (FCP) 衡量从用户首次导航到网页到网页任何一部分内容呈现在屏幕上的时间。对于此指标，“内容”是指文本、图片（包括背景图片）、`<svg>` 元素或非白色 `<canvas>` 元素。

### 如何提高FCP？

- [移除阻塞渲染的资源 ↪](https://developer.chrome.com/docs/lighthouse/performance/render-blocking-resources?hl=zh-cn)
- [缩减 CSS 大小 ↪](https://developer.chrome.com/docs/lighthouse/performance/unminified-css?hl=zh-cn)
- [移除未使用的 CSS ↪](https://developer.chrome.com/docs/lighthouse/performance/unused-css-rules?hl=zh-cn)
- [移除未使用的 JavaScript ↪](https://developer.chrome.com/docs/lighthouse/performance/unused-javascript?hl=zh-cn)
- [预先连接到必需的源 ↪](https://developer.chrome.com/docs/lighthouse/performance/uses-rel-preconnect?hl=zh-cn)
- [缩短服务器响应时间 (TTFB) ↪](https://web.dev/articles/ttfb?hl=zh-cn)
- [避免多次网页重定向 ↪](https://developer.chrome.com/docs/lighthouse/performance/redirects?hl=zh-cn)
- [预加载密钥请求 ↪](https://developer.chrome.com/docs/lighthouse/performance/uses-rel-preload?hl=zh-cn)
- [避免网络载荷过大 ↪](https://developer.chrome.com/docs/lighthouse/performance/total-byte-weight?hl=zh-cn)
- [采用高效的缓存策略提供静态资源 ↪](https://developer.chrome.com/docs/lighthouse/performance/uses-long-cache-ttl?hl=zh-cn)
- [避免 DOM 规模过大 ↪](https://developer.chrome.com/docs/lighthouse/performance/dom-size?hl=zh-cn)
- [最大限度地缩短关键请求深度 ↪](https://developer.chrome.com/docs/lighthouse/performance/critical-request-chains?hl=zh-cn)
- [确保文本在网页字体加载期间保持可见状态 ↪](https://developer.chrome.com/docs/lighthouse/performance/font-display?hl=zh-cn)
- [请保持较低的请求数量和较小的传输大小 ↪](https://developer.chrome.com/docs/lighthouse/performance/resource-summary?hl=zh-cn)

# 无障碍功能审核

# 最佳实践审核

# SEO 审核
