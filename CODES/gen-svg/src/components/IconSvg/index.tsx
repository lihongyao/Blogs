import React, { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { SVG_PATH_NAMES } from "./svgPath_all";

// ==================== 类型定义 ====================
export type SvgPathTypes = (typeof SVG_PATH_NAMES)[number];
export interface IconProps {
  /** SVG 文件名（不含后缀） */
  name: SvgPathTypes;
  /** 应用于 <svg> 容器 div 的类名（Tailwind 或自定义类） */
  className?: string;
  /** 图标主色，可为颜色值 / Tailwind 类名（fill-xxx / stroke-xxx）/ CSS 变量 */
  color?: string;
  /** 图标尺寸，可为数字或字符串（如 20 / '1.5rem'） */
  size?: number | string;
  /** 内联样式 */
  style?: React.CSSProperties;
  /** 最外层 div 的类名 */
  wrapperClass?: string;
  /** 加载或解析异常时的占位符 */
  fallback?: React.ReactNode;
  /** 点击事件 */
  onClick?: () => void;
}

// ====================  缓存逻辑  ====================
const MAX_CACHE_SIZE = 200;
const svgCache = new Map<string, string>();
function cacheSet(key: string, value: string) {
  if (svgCache.has(key)) svgCache.delete(key);
  svgCache.set(key, value);
  if (svgCache.size > MAX_CACHE_SIZE) {
    const firstKey = svgCache.keys().next().value;
    if (typeof firstKey === "string") {
      svgCache.delete(firstKey);
    }
  }
}

// ====================  工具函数  ====================
/** 保留这些颜色（不替换为 currentColor） */
const preserveColors = ["none", "transparent", "inherit", "currentcolor"];
function shouldPreserve(color: string) {
  const c = (color || "").trim().toLowerCase();
  return c === "" || preserveColors.includes(c) || c.startsWith("url(");
}

/** 检查 className 是否包含尺寸类（w-, h-, size-, min/max-w/h-） */
function hasSizeClass(className?: string): boolean {
  if (!className) return false;
  return /\b(?:w|h|size|(?:min|max)-(?:w|h))-/.test(className);
}
/**
 * 清理 SVG：
 * - 去除危险标签与事件属性
 * - 去除 width/height/xml 声明
 * - 转换 JSX 兼容属性（如 class → className）
 */
function sanitizeSvg(svgText: string): string {
  if (!svgText) return "";

  return (
    svgText
      // 移除 script / foreignObject
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/<foreignObject[\s\S]*?>[\s\S]*?<\/foreignObject>/gi, "")
      // 移除事件属性与 js 协议
      .replace(/\son\w+="[^"]*"/gi, "")
      .replace(/\son\w+='[^']*'/gi, "")
      .replace(/javascript:[^"']*/gi, "")
      .replace(/<!ENTITY[\s\S]*?>/gi, "")
      // 移除 XML 声明和 DOCTYPE
      .replace(/<\?xml[\s\S]*?\?>/gi, "")
      .replace(/<!DOCTYPE[\s\S]*?>/gi, "")
      // 去除 width / height / 其他无意义属性
      .replace(/\s+(width|height|t|p-id|version)\s*=\s*(["'][^"']*["']|\S+)/gi, "")
      // JSX 属性名转换
      .replace(/\bclass=/gi, "className=")
      .replace(/\bclip-rule=/gi, "clipRule=")
      .replace(/\bfill-rule=/gi, "fillRule=")
      .replace(/\bstroke-width=/gi, "strokeWidth=")
      .replace(/\bstroke-linecap=/gi, "strokeLinecap=")
      .replace(/\bstroke-linejoin=/gi, "strokeLinejoin=")
      // 清理多余空格
      .replace(/\s{2,}/g, " ")
      .trim()
  );
}

// ====================  颜色处理  ====================
/** 从 props 中提取 SVG 的 fill / stroke 颜色 */
function extractSvgColor({ color, className, style }: Pick<IconProps, "color" | "className" | "style">): {
  fill?: string;
  stroke?: string;
} {
  const result: { fill?: string; stroke?: string } = {};

  // 1️⃣ 优先使用显式 props
  if (style?.fill) result.fill = style.fill;
  if (style?.stroke) result.stroke = style.stroke;
  if (color) result.fill = color;

  // 2️⃣ TailwindCSS 类名解析
  if (className) {
    const fillMatch = className.match(/\bfill-([a-zA-Z0-9-_]+)/);
    const strokeMatch = className.match(/\bstroke-([a-zA-Z0-9-_]+)/);
    if (fillMatch) result.fill = `var(--${fillMatch[0]})`;
    if (strokeMatch) result.stroke = `var(--${strokeMatch[0]})`;
  }

  return result;
}

/** 替换 SVG 内部 fill/stroke 颜色 */
function applySvgColors(svg: string, { fill, stroke }: { fill?: string; stroke?: string }): string {
  if (!svg) return svg;

  if (fill) {
    svg = svg.replace(/\bfill\s*=\s*(['"]?)([^"'\s>]+)\1/gi, (m, _q, color) => (shouldPreserve(color) ? m : `fill="${fill}"`));
    svg = svg.replace(/<path(?![^>]*fill=)/gi, `<path fill="${fill}"`);
  }

  if (stroke) {
    svg = svg.replace(/\bstroke\s*=\s*(['"]?)([^"'\s>]+)\1/gi, (m, _q, color) => (shouldPreserve(color) ? m : `stroke="${stroke}"`));
    svg = svg.replace(/<path(?![^>]*stroke=)/gi, `<path stroke="${stroke}"`);
  }

  return svg;
}

// ====================  SVG 主处理函数  ====================
/** 整合 SVG 处理：清理 + 尺寸 + 颜色 */
function processSvg(svgText: string, props: Pick<IconProps, "color" | "className" | "style" | "size">): string {
  // 1️⃣ 清理
  svgText = sanitizeSvg(svgText);

  // 2️⃣ 确保存在 viewBox
  if (!svgText.includes("viewBox=")) {
    svgText = svgText.replace("<svg", '<svg viewBox="0 0 16 16"');
  }

  // 3️⃣ 若存在显式尺寸类 / props，则让 SVG 自适应外层容器
  const hasExplicitSize = hasSizeClass(props.className) || props.size || (props.style && (props.style.width || props.style.height));
  if (hasExplicitSize) {
    svgText = svgText.replace("<svg", '<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet"');
  } else {
    // 没有显式尺寸，给一个默认尺寸，比如 16x16
    svgText = svgText.replace("<svg", '<svg width="16" height="16" preserveAspectRatio="xMidYMid meet"');
  }

  // 4️⃣ 颜色处理
  const { fill, stroke } = extractSvgColor(props);

  if (!fill && !stroke) {
    // 若无显式颜色，默认加 fill="currentColor"
    svgText = svgText.replace("<path", '<path fill="currentColor"');
  } else {
    svgText = applySvgColors(svgText, { fill, stroke });
  }

  console.log(svgText);
  return svgText;
}

// ====================  组件主体部分     ====================
export default function Icon({ name, wrapperClass, className, color, style, size, fallback, onClick }: IconProps) {
  const [svgContent, setSvgContent] = useState<string>("");
  const [error, setError] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const iconPath = `/icons/${name}.svg`;

  useEffect(() => {
    if (!SVG_PATH_NAMES.includes(name)) {
      setError(true);
      return;
    }

    const loadSvg = async () => {
      controllerRef.current?.abort();
      controllerRef.current = new AbortController();

      if (svgCache.has(iconPath)) {
        // ✅ 缓存命中，不重新请求
        setSvgContent(svgCache.get(iconPath)!);
        return;
      }

      try {
        const res = await fetch(iconPath, { signal: controllerRef.current.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        cacheSet(iconPath, text);
        setSvgContent(text);
      } catch (e) {
        if (!(e instanceof DOMException && e.name === "AbortError")) {
          console.warn("❌ SVG load failed:", iconPath, e);
          setError(true);
        }
      }
    };

    loadSvg();
    return () => controllerRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  const processedSvg = useMemo(() => {
    return processSvg(svgContent, { color, className, style, size });
  }, [svgContent, color, className, style, size]);

  /** 计算最终样式 */
  const finalStyle = useMemo(() => {
    const baseStyle: CSSProperties = {
      display: "inline-block",
      lineHeight: "0",
      flexShrink: "0",
      ...(size ? { width: size, height: size } : {}),
      ...(style ? style : {}),
    };
    return baseStyle;
  }, [style, size]);

  if (error) return <>{fallback ?? <span className="text-general-warning">⚠</span>}</>;

  return (
    <div className={wrapperClass} onClick={onClick}>
      <div id={name} className={className} style={finalStyle} dangerouslySetInnerHTML={{ __html: processedSvg }} />
    </div>
  );
}
