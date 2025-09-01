import AreaLineChat from "./components/AreaLineChat";
import GroupBarChat from "./components/GroupBarChat";
import HorizontalBarChart from "./components/HorizontalBarChart";
import HorizontalBarXChart from "./components/HorizontalBarXChart";
import SalesQuotaPie from "./components/SalesQuotaPie";
import StackBarChat from "./components/StackBarChat";

export default function App() {
  return (
    <div className="m-4">
      <header>
        <h1 className="text-center mt-10">
          <span className="text-3xl tracking-wider">Echarts Examples</span>
        </h1>
      </header>
      <main className="mt-8 flex flex-col gap-6">
        <div className="w-1/2 h-[300px] mx-auto">
          <GroupBarChat />
        </div>
        <div className="flex justify-center">
          <div className="w-[300px] ">
            <HorizontalBarChart />
          </div>
          <div className="w-[300px] ">
            <HorizontalBarXChart />
          </div>
        </div>
        <div className="w-1/2 h-[400px] mx-auto">
          <AreaLineChat />
        </div>
        <div className="flex justify-center">
          <div className="w-[400px] h-[400px] ">
            <SalesQuotaPie />
          </div>
        </div>
        <div className="w-[500px] h-[300px] mx-auto">
          <StackBarChat />
        </div>
      </main>
      <footer className="h-[200px]"></footer>
    </div>
  );
}
