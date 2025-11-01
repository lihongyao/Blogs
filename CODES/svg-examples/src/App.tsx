import IconSvg from "./components/IconSvg";
export default function App() {
  return (
    <div className="p-20 flex flex-col justify-center items-center gap-6">
      {/* 尺寸 */}
      <div className="flex items-center gap-4">
        <IconSvg name="dollar" size={20} />
        <IconSvg name="checkbox" size={20} />
        <IconSvg name="wx" size={20} />
        <IconSvg name="tiktok" width={20} height={20} />
        <IconSvg name="profile/wx" width={20} height={20} />
      </div>
      {/* 颜色 */}
      <div className="flex items-center gap-4">
        <IconSvg name="dollar" size={20} colors={["#0FD3FF", "#16AAFF", "#0FD3FF"]} />
        <IconSvg name="checkbox" size={20} colors={["#16AAFF", "#0FD3FF", "#FFFFFF"]} />
        <IconSvg name="wx" size={20} fillColor="var(--text-primary-color)" />
        <IconSvg name="tiktok" width={20} height={20} fillColor="green" />
        <IconSvg name="profile/wx" width={20} height={20} color="red" />
      </div>
      {/* 异常 */}
      <div className="flex items-center gap-4">
        <IconSvg name="xxx" size={20} />
      </div>
    </div>
  );
}
