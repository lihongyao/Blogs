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
  /** 针对子项颜色映射，可按 selector 指定 fill/stroke */
  subColors?: {
    [selector: string]: {
      fill?: string;
      stroke?: string;
    };
  };
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

// ==================== 缓存逻辑 ====================
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

// ==================== 工具 & 颜色处理 ====================
const preserveColors = ["none", "transparent", "inherit", "currentcolor"];
function shouldPreserve(color: string): boolean {
  const c = (color || "").trim().toLowerCase();
  return c === "" || preserveColors.includes(c) || c.startsWith("url(");
}

function hasSizeClass(className?: string): boolean {
  if (!className) return false;
  return /\b(?:w|h|size|(?:min|max)-(?:w|h))-/.test(className);
}

/** 清理 SVG：危险标签、事件属性、宽高声明、JSX 属性名转换、空裁剪定义处理 */
function sanitizeSvg(svgText: string): string {
  if (!svgText) return "";

  // 基本清理流程
  svgText = svgText
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
    // 删除空或无效的 clipPath 定义
    .replace(/<clipPath[\s\S]*?<\/clipPath>/gi, (match) => {
      const hasValidShape = /<(?:rect|path|circle|ellipse|polygon|use)[\s\S]*?(?:width\s*=\s*["']\s*\d+\s*["']|height\s*=\s*["']\s*\d+\s*["']|d\s*=\s*["'][^"']+["'])/i.test(match);
      return hasValidShape ? match : "";
    })
    // 删除空 defs（如果内只剩空白）
    .replace(/<defs>[\s\S]*?<\/defs>/gi, (match) => {
      const inner = match.replace(/<\/?defs>/gi, "");
      const nonWhitespace = inner.replace(/\s+/g, "");
      return nonWhitespace === "" ? "" : match;
    })
    .replace(/\s{2,}/g, " ")
    .trim();

  return svgText;
}

/** 提取用户 props 中 fill / stroke / genericColor / subColors 信息 */
function extractSvgColorOptions(props: Pick<IconProps, "color" | "subColors" | "style" | "className">): {
  fill?: string;
  stroke?: string;
  genericColor?: string;
  subColors?: IconProps["subColors"];
} {
  const result: { fill?: string; stroke?: string; genericColor?: string; subColors?: IconProps["subColors"] } = {};

  if (props.subColors) {
    result.subColors = props.subColors;
  }

  // 从 style 中提取显式 fill / stroke
  if (props.style?.fill) {
    result.fill = props.style.fill;
  }
  if (props.style?.stroke) {
    result.stroke = props.style.stroke;
  }

  // 如果用户传 color，但是没有显式 fill 或 stroke
  if (props.color && result.fill === undefined && result.stroke === undefined) {
    result.genericColor = props.color;
  } else {
    // 如果用户同时传 color 并且希望作为 fill 或 stroke
    if (props.color) {
      result.fill = result.fill ?? props.color;
      result.stroke = result.stroke ?? props.color;
    }
  }

  // 从 className（如 Tailwind 类）提取 fill-xxx / stroke-xxx
  if (!result.fill && props.className) {
    const fillMatch = props.className.match(/\bfill-([a-zA-Z0-9-_]+)/);
    if (fillMatch) {
      result.fill = `var(--${fillMatch[0]})`;
    }
  }
  if (!result.stroke && props.className) {
    const strokeMatch = props.className.match(/\bstroke-([a-zA-Z0-9-_]+)/);
    if (strokeMatch) {
      result.stroke = `var(--${strokeMatch[0]})`;
    }
  }

  return result;
}

/**
 * 替换 SVG 内部 fill/stroke 颜色，并处理子项映射 subColors；
 * 对于 props.color（未明确分 fill/stroke）时，使用 genericColor 根据子项已有属性判断替换。
 */
function applySvgColors(
  svg: string,
  options: {
    fill?: string;
    stroke?: string;
    genericColor?: string;
    subColors?: IconProps["subColors"];
  }
): string {
  if (!svg) return svg;

  const { fill, stroke, genericColor, subColors } = options;

  // --- 1️⃣ 处理 subColors 映射（若提供） ---
  if (subColors) {
    Object.entries(subColors).forEach(([selector, { fill: subFill, stroke: subStroke }]) => {
      if (subFill) {
        const reFill = new RegExp(`(<${selector}[^>]*?)\\sfill=['"]?([^"'>\\s]+)['"]?`, "gi");
        svg = svg.replace(reFill, (m, p1) => `${p1} fill="${subFill}"`);
      }
      if (subStroke) {
        const reStroke = new RegExp(`(<${selector}[^>]*?)\\sstroke=['"]?([^"'>\\s]+)['"]?`, "gi");
        svg = svg.replace(reStroke, (m, p1) => `${p1} stroke="${subStroke}"`);
      }
    });
  }

  // --- 2️⃣ 如果用户明确指定 fill 或 stroke，则按其替换 ---
  if (fill) {
    svg = svg.replace(/\bfill\s*=\s*(['"]?)([^"'\s>]+)\1/gi, (m, _q, colorVal) => (shouldPreserve(colorVal) ? m : `fill="${fill}"`));
    // 给无 fill 的基本图形默认加 fill
    svg = svg.replace(/<(path|circle|rect|ellipse)(?![^>]*\sfill=)/gi, `<$1 fill="${fill}"`);
  }
  if (stroke) {
    svg = svg.replace(/\bstroke\s*=\s*(['"]?)([^"'\s>]+)\1/gi, (m, _q, colorVal) => (shouldPreserve(colorVal) ? m : `stroke="${stroke}"`));
    svg = svg.replace(/<(path|circle|rect|ellipse)(?![^>]*\sstroke=)/gi, `<$1 stroke="${stroke}"`);
  }

  // --- 3️⃣ 如果只有 genericColor（且 fill/stroke 均未明确） ---
  if (!fill && !stroke && genericColor) {
    svg = svg.replace(/<(path|circle|rect|ellipse)([^>]*)/gi, (match, tag, rest) => {
      const hasFill = /(\sfill=)/i.test(rest);
      const hasStroke = /(\sstroke=)/i.test(rest);

      if (hasFill && !hasStroke) {
        // 子项已用 fill → 替换 fill
        return match.replace(/(\sfill\s*=\s*['"]?)([^'"\s>]+)(['"]?)/i, `$1${genericColor}$3`);
      }
      if (hasStroke && !hasFill) {
        // 子项已用 stroke → 替换 stroke
        return match.replace(/(\sstroke\s*=\s*['"]?)([^'"\s>]+)(['"]?)/i, `$1${genericColor}$3`);
      }
      // 两者都有或都没有，则默认替换 fill（你也可改为 stroke）
      return match.replace(/<(path|circle|rect|ellipse)/, `<$1 fill="${genericColor}"`);
    });
  }

  return svg;
}
// ==================== SVG 主处理函数 ====================
function processSvg(svgText: string, props: Pick<IconProps, "color" | "className" | "style" | "size" | "subColors">): string {
  // 1️⃣ 清理
  svgText = sanitizeSvg(svgText);

  // 2️⃣ 确保存在 viewBox
  if (!svgText.includes("viewBox=")) {
    svgText = svgText.replace("<svg", '<svg viewBox="0 0 16 16"');
  }

  // 3️⃣ 尺寸处理：如果用户有显式尺寸类或 size/width/height，则让 SVG 自适应容器
  const hasExplicitSize = hasSizeClass(props.className) || props.size || (props.style && (props.style.width || props.style.height));
  if (hasExplicitSize) {
    svgText = svgText.replace("<svg", '<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet"');
  } else {
    svgText = svgText.replace("<svg", '<svg width="16" height="16" preserveAspectRatio="xMidYMid meet"');
  }

  // 4️⃣ 颜色提取
  const { fill, stroke, genericColor, subColors } = extractSvgColorOptions(props);
  svgText = applySvgColors(svgText, { fill, stroke, genericColor, subColors });

  return svgText;
}

// ==================== 组件主体 ====================
export default function Icon({ name, wrapperClass, className, color, subColors, style, size, fallback, onClick }: IconProps) {
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
  }, [name]);

  const processedSvg = useMemo(() => {
    return processSvg(svgContent, { color, className, style, size, subColors });
  }, [svgContent, color, className, style, size, subColors]);

  const finalStyle: CSSProperties = useMemo(() => {
    return {
      ...(size ? { width: size, height: size } : {}),
      ...(color ? { color } : {}),
      ...(style ? style : {}),
    };
  }, [style, size, color]);

  if (error) {
    return (
      <>
        {fallback ?? (
          <span className="text-general-warning" style={{ color: "red", fontSize: 16 }}>
            ⚠
          </span>
        )}
      </>
    );
  }

  return (
    <div className={wrapperClass} onClick={onClick}>
      <div id={name} className={className} style={finalStyle} dangerouslySetInnerHTML={{ __html: processedSvg }} />
    </div>
  );
}
