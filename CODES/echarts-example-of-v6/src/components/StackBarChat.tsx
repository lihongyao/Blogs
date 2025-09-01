import * as echarts from "echarts";
import type { CallbackDataParams } from "echarts/types/dist/shared";
import { memo, useEffect, useRef } from "react";
const data = [
  { name: "3+1", salesAmount: 724, refundedAmount: 387, refundRate: 0.53 },
  { name: "369", salesAmount: 563, refundedAmount: 215, refundRate: 0.38 },
  { name: "企业抵债", salesAmount: 892, refundedAmount: 421, refundRate: 0.47 },
  { name: "委托管理", salesAmount: 315, refundedAmount: 142, refundRate: 0.45 },
  { name: "全风险", salesAmount: 678, refundedAmount: 333, refundRate: 0.49 },
];

export default memo(function StackBarChat() {
  const container = useRef<HTMLDivElement | null>(null);
  const echartsRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (container.current) {
      // 基于准备好的dom，初始化echarts实例
      echartsRef.current = echarts.init(container.current);
      // 绘制图表
      echartsRef.current.setOption({
        tooltip: {
          trigger: "item",
          formatter: (params: CallbackDataParams) => {
            const item = data?.find((d: any) => d.name === params.name);
            return `
              ${params.name}<br/>
              销售额: ${item?.salesAmount}元<br/>
              退款额: ${item?.refundedAmount}元<br/>
              退款比: ${item?.refundRate}%
            `;
          },
        },
        legend: { data: ["销售额", "退款额"], top: 0 },
        xAxis: { show: false },
        yAxis: {
          type: "category",
          data: data?.map((item: any) => item.name),
          inverse: true,
        },
        series: [
          {
            name: "销售额",
            type: "bar",
            // stack: "total",
            itemStyle: { color: "#4285F4" },
            data: data?.map((item: any) => item.salesAmount),
            barWidth: 10,
          },
          {
            name: "退款额",
            type: "bar",
            // stack: "total",
            itemStyle: { color: "#4285F450" },
            data: data?.map((item: any) => item.refundedAmount),
            barWidth: 10,
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
