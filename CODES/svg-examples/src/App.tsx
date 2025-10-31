import IconSvg from "./components/IconSvg";
export default function App() {
  // return (
  //   <div className="p-20 flex flex-col justify-center items-center gap-6">
  //     <IconSvg name="wx" color="#ff0000" />
  //   </div>
  // );
  return (
    <div className="p-20 flex flex-col justify-center items-center gap-6">
      {/* 默认 */}
      <div className="flex items-center gap-4">
        <IconSvg name="wx" />
        <IconSvg name="profile/wx" />
        <IconSvg name="dollar" className="fill-blue-500 stroke-orange-600" />
        <IconSvg name="checkbox_checked" className="fill-blue-500 stroke-orange-600" />
        <IconSvg name="checkbox_unchecked" className="fill-blue-500 stroke-orange-600" />
      </div>
      {/* 尺寸 */}
      <div className="flex items-center gap-4">
        <IconSvg name="profile/orders" style={{ width: 20, height: 20 }} />
        <IconSvg name="profile/orders" size={20} />
        <IconSvg name="profile/orders" className="w-5 h-5" />
        <IconSvg name="profile/orders" className="size-5" />
      </div>
      {/* 颜色 */}
      <div className="flex items-center gap-4">
        <IconSvg name="wx" size={20} style={{ color: "blue" }} />
        <IconSvg name="wx" size={20} color="red" />
        <IconSvg name="wx" size={20} color="var(--text-primary-color)" />
        <IconSvg name="wx" size={20} className=" fill-blue-600" />
      </div>
      <div className="flex items-center gap-4">
        <IconSvg name="profile/wx" size={20} style={{ color: "blue" }} />
        <IconSvg name="profile/wx" size={20} color="red" />
        <IconSvg name="profile/wx" size={20} color="var(--text-primary-color)" />
        <IconSvg name="profile/wx" size={20} className="fill-blue-600" />
      </div>
      {/* 容器 */}
      <div>
        <IconSvg wrapperClass="size-10 bg-black flex rounded-md justify-center items-center " name="tiktok" size={20} color="white" />
      </div>
    </div>
  );
}
