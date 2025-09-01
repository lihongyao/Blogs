import * as echarts from "echarts";
import { memo, useEffect, useRef } from "react";

const data = {
  total: 3735200,
  series: [
    { name: "3+1", value: 120 },
    { name: "369", value: 220 },
    { name: "企业抵债", value: 150 },
    { name: "委托管理", value: 320 },
    { name: "全风险", value: 820 },
  ],
};

export default memo(function SalesQuotaPie() {
  const container = useRef<HTMLDivElement | null>(null);
  const echartsRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (container.current) {
      // 基于准备好的dom，初始化echarts实例
      echartsRef.current = echarts.init(container.current);
      // 绘制图表
      echartsRef.current.setOption({
        title: {
          text: `{title|销售总额（元）}\n{total|${data.total}}`,
          left: "center",
          top: "center",
          textStyle: {
            rich: {
              title: { fontSize: 16, color: "#333", lineHeight: 24 },
              total: { fontSize: 16, color: "#333", lineHeight: 24, fontWeight: "bolder" },
            },
          },
        },
        tooltip: { trigger: "item" },
        legend: { type: "scroll", data: data.series.map((item) => item.name), top: 0 },
        series: [
          {
            type: "pie",
            radius: ["35%", "50%"],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 10, borderColor: "#fff", borderWidth: 2 },
            data: data.series,
            label: { show: true, formatter: "{d}%" },
          },
        ],
      } as echarts.EChartsOption);
    }
    return () => {
      echartsRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      echartsRef.current?.resize();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return <div ref={container} className="w-full h-full" />;
});
