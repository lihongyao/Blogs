import * as echarts from "echarts";
import type { CallbackDataParams } from "echarts/types/dist/shared";
import { memo, useEffect, useRef } from "react";

const data = {
  dates: ["2025/10/01", "2025/10/02", "2025/10/03", "2025/10/04", "2025/10/05", "2025/10/06", "2025/10/07"],
  products: [
    {
      name: "3+1",
      data: [120, 132, 101, 134, 90, 230, 210],
    },
    {
      name: "369",
      data: [220, 182, 191, 234, 290, 330, 310],
    },
    {
      name: "企业抵债",
      data: [150, 232, 201, 154, 190, 330, 410],
    },
    {
      name: "委托管理",
      data: [320, 332, 301, 334, 390, 330, 320],
    },
    {
      name: "全风险",
      data: [820, 932, 901, 934, 1290, 1330, 1320],
    },
  ],
};

export default memo(function AreaLineChat() {
  const container = useRef<HTMLDivElement | null>(null);
  const echartsRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (container.current) {
      // 基于准备好的dom，初始化echarts实例
      echartsRef.current = echarts.init(container.current);
      // 绘制图表
      echartsRef.current.setOption({
        title: { text: "产品销售趋势", left: "center", top: "0%" },
        grid: { top: 100 },
        tooltip: {
          trigger: "axis",
          backgroundColor: "#eff5fd",
          borderWidth: 0,
          formatter: (params: CallbackDataParams[]) => {
            return `
              <div style="background-color: #eff6fd; ">
                <div style="font-size: 14px; color: #666; font-weight: bold">${params[0].name}</div>
                <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 6px">
                  ${(() => {
                    return params
                      .map((item) => {
                        return `<div style="display: flex; justify-content: space-between; gap: 24px; background: #fff; padding: 6px 12px; border-radius: 8px;">
                          <div>${item.marker} ${item.seriesName}</div>
                          <div style="color: #000; font-weight: bold;">${item.value} 元</div>
                        </div>`;
                      })
                      .join("");
                  })()}
                </div>
              </div>`;
          },
        },
        legend: { data: data.products.map((item) => item.name), top: 40 },
        xAxis: [{ type: "category", boundaryGap: false, data: data.dates }],
        yAxis: [{ type: "value", show: false }],
        series: data.products.map((product) => ({
          name: product.name,
          type: "line",
          stack: "Total",
          areaStyle: { opacity: 0.1 },
          emphasis: { focus: "series" },
          data: product.data,
        })),
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
