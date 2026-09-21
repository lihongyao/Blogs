# 概述

使用 **App Router 的并行/拦截路由（parallel / intercepting routes）** 来把「模态内容」渲染为 overlay（能共享 URL），再通过一个 **全局的路由工具（ModalRouter）** 对 push/replace 做统一封装：当你在代码里想打开弹窗时调用 ModalRouter.pushModal(path, opts)（或 router.push(Routes.modalGames)），内部会导航到 modal 路径（保证能直接访问），**然后**按需**修改浏览器可见地址**为“普通 URL”（或在 push 时传入可见 URL），并维护 history state 以支持回退行为。

注：App Router 的并行/拦截路由为“把弹窗作为路由树的一部分”提供了官方方式 — 它能保证刷新或直接访问 /modal-xxx/... 时仍能打开弹窗（并可在服务器端决定背景页面）。