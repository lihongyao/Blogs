# 前言

实际开发中，`H5` 页面在 部分 `iPhone` 机型上运行时，经常会被底部的横条恶心到，接下来就给大家分享如何处理这个恶心的问题。

# 解決方案

**#Steps 1**

新增 `viweport-fit` 属性，使得页面内容完全覆盖整个窗口

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=0, viewport-fit=cover" />
```

**#Steps 2**

将页面主体内容设定在安全区域内

```css
@supports (bottom: env(safe-area-inset-bottom)){
	body {
    	padding-bottom: env(safe-area-inset-bottom);
	}
}
```

**# Steps 3**

样式设置

> 类型1：如果页面底部是fixed完全吸底元素(bottom=0)

```css
/** 1. 可以通过加内边距 padding 扩展高度 */
div { padding-bottom: env(safe-area-inset-bottom); }

/** 2. 通过计算函数 calc 覆盖原来高度 */
div { height: calc(元素本身高度 + env(safe-area-inset-bottom))}

/** 3. 通过新增一个新的元素（空的颜色块，主要用于小黑条高度的占位），然后吸底元素可以不改变高度只需要调整位置 */
div { margin-bottom: env(safe-area-inset-bottom) }
```

> 类型2：fixed 非完全吸底元素（bottom ≠ 0），比如 “返回顶部”、“侧边广告” 等

```css
/** 1. 像这种只是位置需要对应向上调整，可以仅通过外边距 margin 来处理：*/
div { margin-bottom: env(safe-area-inset-bottom); }

/** 2. 你也可以通过计算函数 calc 覆盖原来 bottom 值 */
div { bottom: calc(元素本身高度 + env(safe-area-inset-bottom)) }
```

