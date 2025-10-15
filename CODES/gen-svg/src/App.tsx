import IconSvg from "./components/IconSvg";
export default function App() {
  return (
    <div className="p-20 flex flex-col gap-6">
      {/* 默认 */}
      <IconSvg name="wx" color="var(--text-primary-color)" />
      {/* 尺寸 */}
      <div className="flex items-center gap-4">
        <IconSvg name="profile/orders" style={{ width: 24, height: 24 }} />
        <IconSvg name="profile/orders" size={24} />
        <IconSvg name="profile/orders" className="w-6 h-6" />
        <IconSvg name="profile/orders" className="size-6" />
      </div>
      {/* 颜色 */}
      <div className="flex items-center gap-4">
        <IconSvg name="tiktok" style={{ color: "blue" }} />
        <IconSvg name="tiktok" color="red" />
        <IconSvg name="tiktok" color="var(--text-primary-color)" />
        <IconSvg name="tiktok" className=" fill-amber-600" />
      </div>
    </div>
  );
}
