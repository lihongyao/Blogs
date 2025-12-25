"use client";

import Icon from "./components/Icon";

export default function App() {
  return (
    <div className="p-20 flex flex-col justify-center items-center gap-8">
      {/* 1. 尺寸示例 */}
      <div className="flex items-center gap-4">
        <Icon name="dollar" className="w-6 h-6" />
        <Icon name="checkbox" className="w-6 h-6" />
        <Icon name="wx" className="w-6 h-6" />
        <Icon name="tiktok" style={{ width: 24, height: 24 }} />
        <Icon name="profile/wx" style={{ width: 24, height: 24 }} />
      </div>

      {/* 2. 颜色示例 */}
      <div className="flex items-center gap-4">
        {/* 高级 colors 数组模式 */}
        <Icon name="dollar" className="w-6 h-6" colors={["#0FD3FF", "#16AAFF", "#0FD3FF"]} />
        <Icon name="checkbox" className="w-6 h-6" colors={["#16AAFF", "#0FD3FF", "#FFFFFF"]} />

        {/* 普通 color / currentColor 模式 */}
        <Icon name="wx" className="w-6 h-6" color="green" />
        <Icon name="tiktok" style={{ width: 24, height: 24 }} color="red" />
        <Icon name="profile/wx" className="w-6 h-6" color="blue" />
      </div>

      {/* 3. 远程 SVG */}
      <div className="flex items-center gap-4">
        <Icon src="https://test-dev-img.kapok.net/10401/69117aeec8934eb6bfb65e80246abfc2.svg" wrapperClass="size-10 bg-[blue] rounded-full" className="size-5 text-white" />
      </div>

      {/* 4. fallback / 异常示例 */}
      <div className="flex items-center gap-4">
        <Icon name="xxx" className="w-6 h-6" fallback={<span className="text-red-500">❌</span>} />
      </div>
    </div>
  );
}
