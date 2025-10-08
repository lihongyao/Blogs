import Icon from "./components/IconSvg";
export default function App() {
  return (
    <div className="p-20 flex items-center gap-4">
      <Icon name="profile/orders" size={32} color="#4F46E5" />
      <Icon name="profile/orders" className="size-8 text-red-500" />
    </div>
  );
}
