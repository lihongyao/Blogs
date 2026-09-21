# 概述

[uni-app x](https://doc.dcloud.net.cn/uni-app-x/)，是下一代 uni-app，是一个跨平台应用开发引擎。

IDE：[HBuilderX 安装指南 ↪](https://hx.dcloud.net.cn/README)

# 新建项目

[参考指南  ↪](https://doc.dcloud.net.cn/uni-app-x/project.html#%E6%96%B0%E5%BB%BA)

> **注意**：勾选 **`uni-app x`**

# 目录结构

[参考指南 ↪](https://doc.dcloud.net.cn/uni-app-x/project.html#%E9%A1%B9%E7%9B%AE%E7%BB%93%E6%9E%84)

# HBuilderXs

## 01. 格式化处理

问题描述：**HBuilderX自带格式化，只要识别到花括号就换行，如何解决？**

解决方案：修改编辑器格式化的配置文件

- 快捷键 `CMD` + `,` 进入偏好设置 → 插件配置 → **`jsbeautifyrc.js`**
- 将 **`brace_style`** 值设为 **`preserve-inline`**

# Technologies

## 01. 小程序与H5通信

问题描述：**开发微信小程序时使用webview加载H5页面，如何通信？**

- [参考指南 >>](https://uniapp.dcloud.net.cn/component/web-view.html#web-view)

- [微信小程序相关文档 >>](https://developers.weixin.qq.com/miniprogram/dev/component/web-view.html)

**👉小程序传递数据至H5**

目前微信小程序官方不支持小程序传参至H5，不过我们可以通过URI-query传递数据。

**👉H5传递数据至小程序**

1. 引入JS-SDK

   ```html
   <script src="https://res.wx.qq.com/open/js/jweixin-1.6.0.js"></script>
   ```

2. 下载 [uni.webview.js >>](https://gitee.com/dcloud/uni-app/raw/dev/dist/uni.webview.1.5.4.js) 至本地H5目录，然后格式化，修改代码：

   ```js
   // -- 修改前
   ((e = e || self).uni = n())
   // -- 修改后
   ((e = e || self).webUni = n())
   ```

   > **提示：**此举是为了避免命名冲突，将 `uni` 修改为 `webUni`。

3. 在 **main.ts** 文件中引入

   ```js
   import './libs/uni.webview.1.5.4';
   
   document.addEventListener('UniAppJSBridgeReady', function () {
     console.log('__UniAppJSBridgeReady__');
   });
   ```

4. 在需要交互的地方通过 **postMessage** 发送消息：

   ```tsx
   window.webUni.postMessage({
     data: {
       action: '传递的数据',
     }
   });
   ```

5. 在uniapp中，绑定 **@message** 事件监听：

   ```vue
   <web-view :src="APP_H5_URI" @message='getMessage'></web-view>
   
   <script>
     const getMessage = ({ detail: { data } }) => {
   		console.log(data[0]);
   	}
   </script>
   ```

   > **提示：**
   >
   > - 向小程序发送消息，会在特定时机（小程序后退、组件销毁、分享）触发组件的 message 事件。
   > - 返回的数据是一个列表

# 真机调试

## iOS

```shell
# 1. 列出所有可用设备
$ xcrun simctl list devices
# 2. 选择模拟器（iPhone 16 Pro Max 必须是 xcrun simctl list devices 输出里对应的设备名字）
$ xcrun simctl boot "iPhone 16 Pro Max"
# 3. 启动
$ open -a Simulator
```

## Android

```shell
# 1. 进入 emulator 目录
$ cd ~/Library/Android/sdk/emulator
# 2. 查看已有的虚拟设备列表：
$ ./emulator -list-avds
# 3. 启动某个模拟器：
$ ./emulator -avd Pixel_9a   
```

> **提示**：Pixel_4_API_34 为某个模拟器名称，注意修改。
