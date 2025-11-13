import React, { useEffect, useMemo, useRef, useState } from "react";
import { SVG_PATH_NAMES } from "./svgPath_all";
import { LRUCache } from "lru-cache";

/* ==================== 类型定义 ==================== */
export type SvgPathTypes = (typeof SVG_PATH_NAMES)[number];
type IconSizeProps = { size?: number; width?: never; height?: never } | { size?: never; width: number; height: number };

/** IconSvg 组件 props 类型 */
export type IconProps = IconSizeProps & {
  /** SVG 名 */
  name: SvgPathTypes;
  /** 按出现顺序替换已有 fill/stroke 的颜色（只替换已有属性） */
  colors?: string[];
  /** 单独指定 fill 颜色 */
  fillColor?: string;
  /** 单独指定 stroke 颜色 */
  strokeColor?: string;
  /** 统一颜色（最低优先级） */
  color?: string;
  /** 加载失败时的备用内容 */
  fallback?: React.ReactNode;
  /** 点击事件 */
  onClick?: () => void;
};

/** 内部 SVG 处理选项 */
type ProcessSvgOptions = {
  colors?: string[];
  fillColor?: string;
  strokeColor?: string;
  color?: string;
  size?: number;
  width?: number;
  height?: number;
};

/* ==================== 缓存逻辑 ==================== */
/** 全局 SVG 缓存 */
const svgCache = new LRUCache<string, string>({ max: 200 });
/** 设置缓存 */
function cacheSet(key: string, value: string) {
  svgCache.set(key, value);
}

/* ==================== SVG 清理 ==================== */

/** 清理 SVG 中潜在不安全或冗余内容 */
function sanitizeSvg(svg: string): string {
  if (!svg) return "";
  return svg
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<foreignObject[\s\S]*?>[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:[^"']*/gi, "")
    .replace(/<!ENTITY[\s\S]*?>/gi, "")
    .replace(/<\?xml[\s\S]*?\?>/gi, "")
    .replace(/<!DOCTYPE[\s\S]*?>/gi, "")
    .replace(/\s+(width|height|t|p-id|version)\s*=\s*(["'][^"']*["']|\S+)/gi, "")
    .replace(/\bclass=/gi, "className=")
    .replace(/\bclip-rule=/gi, "clipRule=")
    .replace(/\bfill-rule=/gi, "fillRule=")
    .replace(/\bstroke-width=/gi, "strokeWidth=")
    .replace(/\bstroke-linecap=/gi, "strokeLinecap=")
    .replace(/\bstroke-linejoin=/gi, "strokeLinejoin=")
    .replace(/<clipPath[\s\S]*?<\/clipPath>/gi, (m) => {
      const valid = /<(rect|path|circle|ellipse|polygon|use)[\s\S]*?(width|height|d)\s*=\s*["'][^"']+["']/i.test(m);
      return valid ? m : "";
    })
    .replace(/<defs>[\s\S]*<\/defs>/gi, (m) => {
      const inner = m.replace(/<\/?defs>/gi, "");
      return inner.trim() === "" ? "" : m;
    })
    .trim();
}

/* ==================== 颜色处理 ==================== */

const preserveColors = ["none", "transparent", "inherit", "currentcolor"];
function shouldPreserve(color: string): boolean {
  const c = (color || "").trim().toLowerCase();
  return c === "" || preserveColors.includes(c) || c.startsWith("url(");
}

/** 按出现顺序替换已有 fill/stroke 属性（跳过保留颜色） */
function applyColorsByList(svg: string, colors: string[]): string {
  if (!svg || !colors?.length) return svg;
  let idx = 0;
  return svg.replace(/\b(fill|stroke)\s*=\s*(['"]?)([^"'\s>]+)\2/gi, (match, attr, _q, val) => {
    if (shouldPreserve(val) || idx >= colors.length) return match;
    return `${attr}="${colors[idx++]}"`;
  });
}

/** 替换已有 fill/stroke（不新增） */
function applyColors(svg: string, opt: { color?: string; fillColor?: string; strokeColor?: string }): string {
  if (!svg) return svg;
  const { color, fillColor, strokeColor } = opt;

  if (fillColor) {
    svg = svg.replace(/\bfill\s*=\s*(['"]?)([^"'\s>]+)\1/gi, (m, _q, val) => (shouldPreserve(val) ? m : `fill="${fillColor}"`));
  }
  if (strokeColor) {
    svg = svg.replace(/\bstroke\s*=\s*(['"]?)([^"'\s>]+)\1/gi, (m, _q, val) => (shouldPreserve(val) ? m : `stroke="${strokeColor}"`));
  }
  if (color) {
    svg = svg.replace(/\b(fill|stroke)\s*=\s*(['"]?)([^"'\s>]+)\2/gi, (m, attr, _q, val) => (shouldPreserve(val) ? m : `${attr}="${color}"`));
  }

  return svg;
}

/** 如果 SVG 没有任何 fill/stroke，则添加默认颜色 */
function ensureDefaultColors(svg: string, opt: { color?: string; fillColor?: string; strokeColor?: string }): string {
  const { color, fillColor, strokeColor } = opt;
  const hasColor = /\b(fill|stroke)\s*=\s*(['"]?)([^"'\s>]+)\2/i.test(svg);
  if (hasColor) return svg;

  const fillVal = fillColor || color;
  if (fillVal) {
    svg = svg.replace(/<(path|rect|circle|ellipse|polygon)(?![^>]*\sfill=)/gi, `<$1 fill="${fillVal}"`);
  }
  if (strokeColor) {
    svg = svg.replace(/<(path|rect|circle|ellipse|polygon)(?![^>]*\sstroke=)/gi, `<$1 stroke="${strokeColor}"`);
  }

  return svg;
}

/* ==================== SVG 主处理逻辑 ==================== */

function processSvg(svgText: string, opt: ProcessSvgOptions): string {
  if (!svgText) return "";

  let svg = sanitizeSvg(svgText);

  // 补充 viewBox
  if (!svg.includes("viewBox=")) {
    svg = svg.replace("<svg", '<svg viewBox="0 0 16 16"');
  }

  // 设置尺寸
  const w = opt.width ?? opt.size ?? 16;
  const h = opt.height ?? opt.size ?? 16;
  svg = svg.replace("<svg", `<svg width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"`);

  // 替换颜色
  if (opt.colors?.length) {
    svg = applyColorsByList(svg, opt.colors);
  } else {
    svg = applyColors(svg, opt);
    svg = ensureDefaultColors(svg, opt);
  }

  return svg;
}

/* ==================== IconSvg 组件 ==================== */

export default function IconSvg(props: IconProps) {
  const { name, colors, fillColor, strokeColor, color, size, width, height, fallback, onClick } = props;

  const [svgContent, setSvgContent] = useState("");
  const [error, setError] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  /** 加载 SVG */
  useEffect(() => {
    if (!SVG_PATH_NAMES.includes(name)) {
      setError(true);
      return;
    }

    const iconPath = `/icons/${name}.svg`;

    controllerRef.current?.abort();
    controllerRef.current = new AbortController();

    const cached = svgCache.get(iconPath); // ✅ 使用 LRU Cache 读取
    if (cached) {
      setSvgContent(cached);
      return;
    }

    (async () => {
      try {
        const res = await fetch(iconPath, { signal: controllerRef.current!.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        cacheSet(iconPath, text); // ✅ 使用 LRU Cache 存储
        setSvgContent(text);
      } catch (e) {
        if (!(e instanceof DOMException && e.name === "AbortError")) {
          console.warn("❌ SVG load failed:", iconPath, e);
          setError(true);
        }
      }
    })();

    return () => controllerRef.current?.abort();
  }, [name]);

  /** 生成处理后的 SVG */
  const processedSvg = useMemo(() => processSvg(svgContent, { colors, fillColor, strokeColor, color, size, width, height }), [svgContent, colors, fillColor, strokeColor, color, size, width, height]);

  if (error) {
    return fallback ?? <span style={{ color: "red", fontSize: 16 }}>⚠</span>;
  }

  return <div onClick={onClick} dangerouslySetInnerHTML={{ __html: processedSvg }} />;
}
