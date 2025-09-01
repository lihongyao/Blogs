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
  { name: "3+1", value: 1213 },
  { name: "369", value: 4382 },
  { name: "企业抵债", value: 3123 },
  { name: "委托管理", value: 1937 },
  { name: "全风险", value: 1245 },
];

export default memo(function HorizontalBarXChart() {
  const container = useRef<HTMLDivElement | null>(null);
  const echartsRef = useRef<echarts.ECharts | null>(null);

  /// 动态计算容器高度（基于柱条数量、高度和间距）
  const barHeight = 4; // 每条柱子的高度
  const barGap = 10; // 柱子之间的间距
  const chartHeight = data?.length * (barHeight + barGap) + barGap; // 总高度

  const f = (value: number) => {
    // 将数值转换为h,m格式
    const hours = Math.floor(value / 60);
    const minutes = value % 60;
    return hours > 0 ? `${hours}h，${minutes}m` : `${minutes}m`;
  };

  useEffect(() => {
    if (container.current) {
      // 基于准备好的dom，初始化echarts实例
      echartsRef.current = echarts.init(container.current);
      // 绘制图表
      echartsRef.current.setOption({
        grid: { top: barGap, right: 80, bottom: barGap },
        xAxis: {
          type: "value",
          inverse: true, // 从右向左延伸
          show: false,
          axisLine: { show: false }, // 隐藏轴线
          axisTick: { show: false }, // 隐藏刻度线
          axisLabel: { show: false }, // 隐藏数值标签
          splitLine: { show: false }, // 关键：移除垂直刻度线
        },
        yAxis: { type: "category", show: false },
        tooltip: { show: false },
        series: [
          {
            type: "bar",
            barWidth: barHeight,
            barCategoryGap: `${barGap}px`,
            silent: false,
            data: data?.map((item) => item.value),
            itemStyle: {
              color: (params) => colorList[params.dataIndex],
              borderRadius: 4,
            },
            label: {
              show: true,
              position: "right",
              fontWeight: "bold",
              formatter: (params) => f(params.data as number),
            },
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
