import * as echarts from "echarts";
import { memo, useEffect, useRef } from "react";
import geo_city from "./geo_city.json";
import geo_country from "./geo_country.json";
import geo_province from "./geo_province.json";
import type { GeoJSON } from "echarts/types/src/coord/geo/geoTypes.js";
interface GeoRoamParams {
  type: "georoam"; // 固定事件类型标识
  componentType: "geo" | "series"; // 触发事件的组件类型
  seriesId?: string; // 系列ID（可选）

  // 缩放相关参数
  zoom: number; // 单次缩放倍数（从v5.5.1开始提供totalZoom替代）
  totalZoom: number; // 累计缩放倍数（v5.5.1+）

  // 平移相关参数
  originX?: number; // 缩放原点X坐标（相对容器）
  originY?: number; // 缩放原点Y坐标（相对容器）
  dx?: number; // 拖拽水平位移量（仅拖拽时存在）
  dy?: number; // 拖拽垂直位移量（仅拖拽时存在）

  // 动作类型（部分版本可能包含）
  action?: "zoom" | "drag"; // 区分缩放或拖拽
}

echarts.registerMap("china-country", geo_country as GeoJSON);
echarts.registerMap("china-province", geo_province as GeoJSON);
echarts.registerMap("china-city", geo_city as GeoJSON);

const data = [
  { name: "北京", coord: [116.404, 39.915], count: 150 },
  { name: "上海", coord: [121.4737, 31.2304], count: 130 },
  { name: "西安", coord: [108.934937, 34.271971], count: 130 },
  { name: "重庆", coord: [106.495972, 29.562707], count: 130 },
  { name: "成都", coord: [104.139404, 30.647364], count: 130 },
  { name: "广州", coord: [113.26, 23.13], count: 130 },
];

export default memo(function ChinaMap() {
  const container = useRef<HTMLDivElement | null>(null);
  const echartsRef = useRef<echarts.ECharts | null>(null);

  const createMapOption = (mapType: string) => {
    const baseOption: echarts.EChartsOption = {
      backgroundColor: "#333",
      grid: { top: 0, left: 0, right: 0, bottom: 0 },
      // tooltip: { trigger: 'item' },
      series: [
        {
          type: "map",
          map: mapType, // 必须与registerMap的名称一致
          roam: true, // 保留缩放拖拽功能但固定初始状态
          zoom: 4, // 初始缩放级别
          center: [104.066128, 30.572924], // 固定地图中心点坐标（经度,纬度） —— 成都
          layoutCenter: ["50%", "60%"], // 地图在容器中的位置居中
          layoutSize: "100%", // 地图占满容器
          label: { show: true, color: "#ccc" },
          selectedMode: false, // 禁用选中功能
          animation: false, // 禁用动画
          itemStyle: {
            // -- 地图区域填充颜色
            areaColor: "#182027",
            // -- 区域边界线颜色
            borderColor: "#0a1116",
            // -- 区域边界线粗细
            borderWidth: 2,
          },
          emphasis: {
            itemStyle: {
              // -- 地图区域填充颜色
              areaColor: "transparent",
              // -- 区域边界线颜色
              borderColor: "#99999950",
              // -- 区域边界线粗细
              borderWidth: 2,
            },
            label: { show: true, color: "#f5f5f5" },
          },
          markPoint: {
            label: {
              show: true,
              formatter: (params: any) => params.data.count,
              color: "#fff",
              fontSize: 12,
              fontWeight: "bolder",
            },
            // 根据地图类型显示不同标记点
            data: data?.map((item: any) => ({
              name: item.name,
              coord: item.coord,
              count: item.count,
              itemStyle: {
                color: "#888",
              },
            })),
          },
        },
      ],
    };
    return baseOption;
  };

  useEffect(() => {
    if (container.current) {
      // 基于准备好的dom，初始化echarts实例
      echartsRef.current = echarts.init(container.current);
      // 绘制图表
      echartsRef.current.setOption(createMapOption("china-province") as echarts.EChartsOption);
      // 事件监听
      echartsRef.current.on("georoam", (params: unknown) => {
        const roamParams = params as GeoRoamParams;
        const currentZoom = roamParams.totalZoom;
        const option = echartsRef.current?.getOption();
        if (!option) return;
        // 根据缩放级别切换地图
        if (currentZoom < 0.5) {
          (option.series as any)[0].map = "china-country";
        } else if (currentZoom < 6) {
          (option.series as any)[0].map = "china-province";
        } else {
          (option.series as any)[0].map = "china-city";
        }
        echartsRef.current?.setOption(option);
      });
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
