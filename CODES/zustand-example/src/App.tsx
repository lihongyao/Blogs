import { useNestedStore } from "./store/nestedStore";

function Other() {
  const count = useNestedStore((state) => state.deep.nested.obj.count); // 仅订阅 count
  return <div>count: {count}</div>;
}

export default function App() {
  const { deep, increment } = useNestedStore();
  return (
    <div>
      <Other />
      <p>count: {deep.nested.obj.count}</p>
      <button onClick={increment}>increment</button>
    </div>
  );
}
