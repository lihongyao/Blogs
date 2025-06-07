# 概述

https://master--5fc05e08a4a65d0021ae0bf2.chromatic.com/?path=/story/core-draggable-hooks-usedraggable--basic-setup

`react-beautiful-dnd` 是 Atlassian 开源的 React 拖拽库，专注于实现优雅、高性能的列表拖拽交互

# 核心概念

三大组件：

- **`DragDropContext`**：拖拽根容器，管理全局状态（必须包裹整个拖拽区域
- **`Droppable`**：定义可放置区域（通过 `droppableId` 标识）
- **`Draggable`**：定义可拖拽元素（需唯一 `draggableId` 和 `index`）

关键特性：

- **高性能**：虚拟列表支持，流畅处理大量数据
- **无障碍支持**：键盘操作和屏幕阅读器兼容
- **灵活样式**：可自定义拖拽动画和外观

# 基础用法

1、安装

```shell
$ pnpm add react-beautiful-dnd
$ pnpm add @types/react-beautiful-dnd -D
```

