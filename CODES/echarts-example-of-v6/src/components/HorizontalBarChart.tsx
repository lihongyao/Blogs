import * as echarts from "echarts";
import { memo, useEffect, useRef } from "react";

const colorList = [
  "#4285F4",
  "#34A853",
  "#FBBC05",
  "#EA4335",
  "#0F9D58",
  "#FF6D00",
  "#7B1FA2",
  "#00ACC1",
  "#D81B60",
  "#43A047",
  "#5C6BC0",
  "#E53935",
  "#00897B",
  "#3949AB",
  "#F4511E",
  "#039BE5",
  "#8E24AA",
  "#C0CA33",
  "#6D4C41",
  "#E91E63",
];

const data = [
  { name: "3+1", value: 120 },
  { name: "369", value: 80 },
  { name: "企业抵债", value: 150 },
  { name: "委托管理", value: 90 },
  { name: "全风险", value: 200 },
];

export default memo(function HorizontalBarChart() {
  const container = useRef<HTMLDivElement | null>(null);
  const echartsRef = useRef<echarts.ECharts | null>(null);

  // 动态计算容器高度（基于柱条数量、高度和间距）
  const barHeight = 4; // 每条柱子的高度
  const barGap = 10; // 柱子之间的间距
  const chartHeight = data.length * (barHeight + barGap) + barGap; // 总高度

  const renderTooltip = () => {
    return `
    <div style="background-color: #eff6fd; position: relative; z-index: 100; ">
        <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 6px">
          ${(() => {
            return data
              .map((item, index) => {
                return `
                <div style="display: flex; justify-content: space-between; gap: 24px; background: #fff; padding: 6px 12px; border-radius: 6px;">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <div style="width:10px; height: 10px; border-radius: 50%; background-color: ${colorList[index]};"></div>
                    <div>${item.name}</div>
                  </div>
                  <div style="color: #000; font-weight: bold;">${item.value} 元</div>
                </div>`;
              })
              .join("");
          })()}
        </div>
    </div>
    `;
  };

  useEffect(() => {
    if (container.current) {
      // 基于准备好的dom，初始化echarts实例
      echartsRef.current = echarts.init(container.current);
      // 绘制图表
      echartsRef.current.setOption({
        grid: { top: barGap, bottom: barGap },
        xAxis: { show: false },
        yAxis: { show: false, type: "category" },
        tooltip: {
          trigger: "axis",
          backgroundColor: "#eff5fd",
          borderWidth: 0,
          formatter: () => renderTooltip(),
        },
        series: [
          {
            type: "bar",
            barWidth: barHeight,
            barCategoryGap: `${barGap}px`,
            silent: false,
            data: data.map((item) => item.value),
            itemStyle: {
              color: (params) => colorList[params.dataIndex],
              borderRadius: 4,
            },
            label: { show: false },
          },
        ],
      } as echarts.EChartsOption);
    }
    return () => {
      echartsRef.current?.dispose();
    };
  }, []);

  return <div ref={container} style={{ height: `${chartHeight}px`, width: "100%" }} />;
});
