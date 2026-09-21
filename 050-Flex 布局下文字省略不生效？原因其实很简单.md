# 概述

![](./imgs/flex_layout_ellipsis.png)

在开发中，我们常遇到这种布局：A、B、C 三段文本长度不固定，其中 A、C 占用空间较少，需要完整显示，B 是自适应区域，超出部分需省略显示。A 与 B 属同一容器，该容器与 C 同级，容器应占据除 C 之外的所有剩余空间，HTML 结构如下：

```html
<div class="wrap">
  <div class="infos">
    <div>Soccer</div>
    <div class="self">Campeonato De Reserva De Primera Division C</div>
  </div>
  <div class="live">Live</div>
</div>
```

如果按照常规思路编写 CSS，如：

```css
.wrap {
  display: flex;
  align-items: center;
  width: 350px;
  border: 1px dashed #ccc;
  padding: 4px 16px;
  gap: 16px;
}

.infos {
  flex: 1;
  display: flex;
  gap: 8px;
  align-items: center;
}

.self {
  flex: 1;
  padding: 4px;
  background-color: silver;
  border-radius: 6px;
   /* 文字超出隐藏 */
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.live {
  padding: 4px 16px;
  background: cornflowerblue;
  border-radius: 6px;
  color: white;
  flex-shrink: 0;
}
```

渲染效果往往会出现问题，如下所示：

![](./imgs/flex_layout_wrong.png)

可以看到，.self 被内容撑开，导致右侧 “Live” 按钮被挤出容器。

# 异常分析

为什么会出现这样的情况呢？问题的根源在于 **Flex 子项的默认行为**：

> 在 Flex 布局中，子元素的默认 min-width 是 auto，意味着它会根据内容宽度确定最小值，导致内容不会被压缩。

因此，当 .wrap 的空间不足时，.infos 会拒绝被压缩，从而让内部的 .self 也失去“省略”的机会。

要让 .self 的 text-overflow: ellipsis 生效，必须确保它在空间不足时可以被压缩。

解决方案也很简单：**给 .infos 设置 min-width: 0 即可。**

这告诉浏览器，“.infos 可以比它内容更窄”，从而允许内部 .self 根据空间自动裁切。

# 实现


```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Flex 布局下文字省略不生效？原因其实很简单</title>
    <style>
      * {
        margin: 0;
        padding: 0;
      }
      body {
        width: 100vw;
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .wrap {
        display: flex;
        align-items: center;
        width: 350px;
        border: 1px dashed #ccc;
        padding: 4px 16px;
        gap: 16px;
      }

      .infos {
        flex: 1;
        display: flex;
        gap: 8px;
        align-items: center;
        min-width: 0; /* ✅ 关键：允许内部文字被压缩 */
      }

      .self {
        flex: 1;
        padding: 4px;
        background-color: silver;
        border-radius: 6px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      .live {
        padding: 4px 16px;
        background: cornflowerblue;
        border-radius: 6px;
        color: white;
        flex-shrink: 0;
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="infos">
        <div>Soccer</div>
        <div class="self">Campeonato De Reserva De Primera Division C</div>
      </div>
      <div class="live">Live</div>
    </div>
  </body>
</html>
```

# 总结

| **层级** | **是否需要** min-width: 0 | **原因**                                                   |
| -------- | ------------------------- | ---------------------------------------------------------- |
| .wrap    | ❌                         | 最外层容器，无需压缩                                       |
| .infos   | ✅                         | 是 .wrap 的 flex 子项，默认 min-width: auto 会阻止内部压缩 |
| .self    | ❌                         | 父层已允许压缩，无需重复设置                               |

> 结论：在 Flex 布局中，当内部文字的省略不生效时，**优先检查文字外层的容器** 是否设置了 min-width: 0。大多数情况下，只需在容器层加上这一行，就能彻底解决问题。
