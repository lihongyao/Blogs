import * as echarts from "echarts";
import type { CallbackDataParams } from "echarts/types/dist/shared";
import { memo, useEffect, useRef } from "react";

const data = {
  months: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
  series: [
    {
      name: "一级代理商",
      data: [120, 132, 101, 134, 90, 230, 210, 120, 132, 101, 134, 90],
    },
    {
      name: "准一级代理商",
      data: [220, 182, 191, 234, 290, 330, 310, 220, 182, 191, 234, 290],
    },
    {
      name: "二级代理商",
      data: [150, 232, 201, 154, 190, 330, 410, 150, 232, 201, 154, 190],
    },
    {
      name: "合伙人",
      data: [320, 332, 301, 334, 390, 330, 320, 320, 332, 301, 334, 390],
    },
  ],
};

export default memo(function HorizontalBarChart() {
  const container = useRef<HTMLDivElement | null>(null);
  const echartsRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (container.current) {
      // 基于准备好的dom，初始化echarts实例
      echartsRef.current = echarts.init(container.current);
      // 绘制图表
      echartsRef.current.setOption({
        title: { text: "新增趋势 2025 年", left: "center", top: "0%" },
        grid: { top: 35 },
        tooltip: {
          trigger: "axis",
          backgroundColor: "#eff5fd",
          borderWidth: 0,
          axisPointer: { type: "shadow" },
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
                          <div style="color: #000; font-weight: bold;">${item.value} 个</div>
                        </div>`;
                      })
                      .join("");
                  })()}
                </div>
              </div>`;
          },
        },
        legend: { data: data.series.map((item) => item.name), top: 40 },
        xAxis: { type: "category", data: data.months },
        yAxis: { show: false },
        series: data.series.map((item) => ({
          type: "bar",
          barCategoryGap: 10,
          name: item.name,
          data: item.data,
        })),
        dataZoom: [
          {
            type: "slider", // 滑动条型数据区域缩放
            show: true, // 显示滚动条
            xAxisIndex: 0, // 控制第一个x轴
            start: 0, // 初始显示范围的起始百分比（0%）
            end: 50, // 初始显示范围的结束百分比（20%，即默认展示前20%的数据）
            height: 20, // 滚动条高度
            bottom: 10, // 距离容器底部的距离
            filterMode: "filter", // 过滤数据点，提升性能
          },
          {
            type: "inside", // 内置型缩放，支持鼠标滚轮或触屏缩放
            xAxisIndex: 0,
            zoomOnMouseWheel: true, // 允许鼠标滚轮缩放
            moveOnMouseMove: true, // 拖动平移
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
