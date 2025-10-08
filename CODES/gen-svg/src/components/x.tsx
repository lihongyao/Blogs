import React, { useEffect, useRef, useState } from "react";
import { SVG_PATH_NAMES } from "./svgPath_all";

export type SvgPathTypes = (typeof SVG_PATH_NAMES)[number];

type IconProps = {
  name: SvgPathTypes;
  wrapperClass?: string;
  className?: string;
  color?: string;
  style?: React.CSSProperties;
  size?: number | string;
  fallback?: React.ReactNode;
  onClick?: (e: React.MouseEvent | React.KeyboardEvent) => void;
};

const MAX_CACHE_SIZE = 200;
const svgCache = new Map<string, string>();
function cacheSet(key: string, value: string) {
  if (svgCache.has(key)) svgCache.delete(key);
  svgCache.set(key, value);
  if (svgCache.size > MAX_CACHE_SIZE) {
    const firstKey = svgCache.keys().next().value;
    svgCache.delete(firstKey);
  }
}

const preserveColors = ["none", "transparent", "inherit", "currentcolor"];
function shouldPreserve(color: string) {
  const c = (color || "").trim().toLowerCase();
  return c === "" || preserveColors.includes(c) || c.startsWith("url(");
}

// 更全面的颜色替换：属性、inline style、以及 <style> 块内的 CSS
function replaceColors(svg: string) {
  if (!svg) return svg;

  // 1) attribute form: fill="#000"  fill='#000'  fill=#000  stroke="rgb(...)" etc.
  svg = svg.replace(/\b(fill|stroke|stop-color|flood-color|lighting-color|color)\s*=\s*(['"]?)([^"'>;\s]+)\2/gi, (m, attr: string, q: string, color: string) => {
    return shouldPreserve(color) ? m : m.replace(color, "currentColor");
  });

  // 2) inline style attributes or style properties: "fill:#000; stroke: #fff"
  svg = svg.replace(/(fill|stroke|stop-color|flood-color|lighting-color|color)\s*:\s*([^;}"'\s]+)/gi, (m, prop: string, color: string) => {
    return shouldPreserve(color) ? m : `${prop}:currentColor`;
  });

  // 3) CSS inside <style>...</style>
  svg = svg.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (full, cssContent) => {
    const replacedCss = cssContent.replace(/(fill|stroke|stop-color|flood-color|lighting-color|color)\s*:\s*([^;}"'\s]+)/gi, (m2, prop, color) => {
      return shouldPreserve(color) ? m2 : `${prop}: currentColor`;
    });
    return full.replace(cssContent, replacedCss);
  });

  return svg;
}

function removeSvgDimensions(svgText: string) {
  return svgText.replace(/(<svg[^>]*?)\s*(width|height)=["'][^"']*["']/gi, "$1");
}

function sanitizeSvg(svgText: string) {
  return svgText.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
}

function hasSizeClass(className?: string) {
  if (!className) return false;
  return /\b[wh]-/.test(className) || /\bsize-/.test(className);
}

function extractSizeClasses(className?: string) {
  if (!className) return "";
  const patterns = [/\b[wh]-[^\s]+/g, /\b(?:w|h)(?:Size)?-[^\s]+/g, /\b(?:min|max)-[wh]-[^\s]+/g, /\bsize-[^\s]+/g];
  return patterns.flatMap((p) => className?.match(p) || []).join(" ");
}

// 如果传了 color，将该 color 写入 <svg style="color: ...">（保底，确保 currentColor 有来源）
function injectSvgColorStyle(svg: string, color: string) {
  if (!color) return svg;
  return svg.replace(/<svg\b([^>]*)>/i, (match, attrs) => {
    // 如果已有 style 属性，追加或替换 color
    if (/\bstyle\s*=/.test(attrs)) {
      return match.replace(/\bstyle=(["'])(.*?)\1/, (m, q, styleContent) => {
        if (/color\s*:/i.test(styleContent)) {
          const newStyle = styleContent.replace(/color\s*:\s*[^;]+;?/i, `color: ${color};`);
          return `style=${q}${newStyle}${q}`;
        } else {
          const appended = styleContent.trim().length ? (styleContent.trim().endsWith(";") ? styleContent + ` color: ${color};` : styleContent + `; color: ${color};`) : `color: ${color};`;
          return `style=${q}${appended}${q}`;
        }
      });
    } else {
      // 没有 style 属性则直接加入
      return `<svg${attrs} style="color: ${color};">`;
    }
  });
}

export const Icon: React.FC<IconProps> = ({ name, wrapperClass, className, color, style, size, fallback, onClick }) => {
  const [svgContent, setSvgContent] = useState<string>("");
  const [error, setError] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const iconPath = `/icons/${name}.svg`;

  useEffect(() => {
    if (!SVG_PATH_NAMES.includes(name)) {
      setError(true);
      return;
    }

    const load = async () => {
      setError(false);
      controllerRef.current?.abort();
      controllerRef.current = new AbortController();

      if (svgCache.has(iconPath)) {
        const cached = svgCache.get(iconPath)!;
        setSvgContent(processSvg(cached));
        return;
      }

      try {
        const res = await fetch(iconPath, { signal: controllerRef.current.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        cacheSet(iconPath, text);
        setSvgContent(processSvg(text));
      } catch (e) {
        if (!(e instanceof DOMException && e.name === "AbortError")) {
          console.warn("SVG load failed:", iconPath, e);
          setError(true);
        }
      }
    };

    load();
    return () => controllerRef.current?.abort();
  }, [name]);

  const processSvg = (svg: string) => {
    let content = sanitizeSvg(svg);

    // 只在需要时转换颜色（避免破坏本来想保留原色的 svg）
    if (color || className?.match(/text-|fill-|stroke-/)) {
      content = replaceColors(content);
    }

    content = removeSvgDimensions(content);
    if (!content.includes("viewBox=")) {
      content = content.replace("<svg", '<svg viewBox="0 0 16 16"');
    }

    const hasExplicitSize = hasSizeClass(className) || size || (style && (style.width || style.height));
    if (hasExplicitSize) {
      content = content.replace("<svg", '<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet"');
    }

    // 如果显式传了 color，强制将 color 注入到 <svg> style（保证 currentColor 有来源）
    if (color) {
      content = injectSvgColorStyle(content, color);
    }

    return content;
  };

  const finalStyle: React.CSSProperties = {
    display: "inline-block",
    lineHeight: 0,
    flexShrink: 0,
    color: color || undefined,
    width: size || style?.width,
    height: size || style?.height,
    ...style,
  };

  const finalClass = className || undefined;
  const finalWrapperClass = `flex items-center justify-center ${extractSizeClasses(className)} ${wrapperClass || ""}`.trim();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick(e);
    }
  };

  if (!SVG_PATH_NAMES.includes(name) || error) return <>{fallback ?? <span className="text-general-warning">⚠</span>}</>;

  const WrapperTag: any = onClick ? "button" : "div";

  return (
    <WrapperTag
      className={finalWrapperClass}
      onClick={onClick ? (e) => onClick(e) : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={handleKeyDown}
      style={{ border: "none", background: "transparent", padding: 0 }}
    >
      <div id={name} className={finalClass} style={finalStyle} dangerouslySetInnerHTML={{ __html: svgContent }} />
    </WrapperTag>
  );
};
