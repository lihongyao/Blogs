import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { SVG_PATH_NAMES } from "./svgPath_all";

export type SvgPathTypes = (typeof SVG_PATH_NAMES)[number];

export interface IconProps {
  name: SvgPathTypes;
  wrapperClass?: string;
  className?: string;
  color?: string;
  style?: React.CSSProperties;
  size?: number | string;
  fallback?: React.ReactNode;
  onClick?: (e: React.MouseEvent | React.KeyboardEvent) => void;
}

/* ----------------------------- Cache logic ----------------------------- */
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

/* ----------------------------- Helpers ----------------------------- */

const preserveColors = ["none", "transparent", "inherit", "currentcolor"];
const shouldPreserve = (color: string) => {
  const c = (color || "").trim().toLowerCase();
  return c === "" || preserveColors.includes(c) || c.startsWith("url(");
};

function replaceColors(svg: string): string {
  if (!svg) return svg;

  // 1) fill / stroke / stop-color / etc.
  svg = svg.replace(/\b(fill|stroke|stop-color|flood-color|lighting-color|color)\s*=\s*(['"]?)([^"'>;\s]+)\2/gi, (m, attr: string, q: string, color: string) => {
    return shouldPreserve(color) ? m : m.replace(color, "currentColor");
  });

  // 2) inline style (e.g. fill:#000; stroke:#fff)
  svg = svg.replace(/(fill|stroke|stop-color|flood-color|lighting-color|color)\s*:\s*([^;}"'\s]+)/gi, (m, prop: string, color: string) => {
    return shouldPreserve(color) ? m : `${prop}:currentColor`;
  });

  // 3) <style> ... </style> blocks
  svg = svg.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (full, cssContent) => {
    const replacedCss = cssContent.replace(/(fill|stroke|stop-color|flood-color|lighting-color|color)\s*:\s*([^;}"'\s]+)/gi, (m2, prop, color) => {
      return shouldPreserve(color) ? m2 : `${prop}: currentColor`;
    });
    return full.replace(cssContent, replacedCss);
  });

  return svg;
}

function removeSvgDimensions(svgText: string) {
  return svgText.replace(/(<svg[^>]*?)\s*(width|height)\s*=\s*(['"][^'"]*['"]|\S+)/gi, "$1");
}

function sanitizeSvg(svgText: string) {
  return svgText.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
}

function hasSizeClass(className?: string) {
  return !!className && /\b(?:w|h|min|max|size)-/.test(className);
}

function extractSizeClasses(className?: string) {
  if (!className) return "";
  return (className.match(/\b(?:w|h|min|max|size)-[^\s]+/g) || []).join(" ");
}

// Inject <svg style="color: ...">
function injectSvgColorStyle(svg: string, color: string) {
  if (!color) return svg;
  return svg.replace(/<svg\b([^>]*)>/i, (match, attrs) => {
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
      return `<svg${attrs} style="color: ${color};">`;
    }
  });
}

/* ----------------------------- SVG Processor ----------------------------- */

function processSvg(svg: string, { color, className, style, size }: Pick<IconProps, "color" | "className" | "style" | "size">): string {
  let content = sanitizeSvg(svg);

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

  if (color) {
    content = injectSvgColorStyle(content, color);
  }

  return content;
}

/* ----------------------------- Component ----------------------------- */

export default function Icon({ name, wrapperClass, className, color, style, size, fallback, onClick }: IconProps) {
  const [svgContent, setSvgContent] = useState<string>("");
  const [error, setError] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const iconPath = `/icons/${name}.svg`;
  const clickable = !!onClick;

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
        setSvgContent(processSvg(svgCache.get(iconPath)!, { color, className, style, size }));
        return;
      }

      try {
        const res = await fetch(iconPath, { signal: controllerRef.current.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        cacheSet(iconPath, text);
        setSvgContent(processSvg(text, { color, className, style, size }));
      } catch (e) {
        if (!(e instanceof DOMException && e.name === "AbortError")) {
          console.warn("❌ SVG load failed:", iconPath, e);
          setError(true);
        }
      }
    };

    load();
    return () => controllerRef.current?.abort();
  }, [name, color, className, style, size]);

  const finalStyle: React.CSSProperties = {
    display: "inline-block",
    lineHeight: 0,
    flexShrink: 0,
    color: color || undefined,
    width: size || style?.width,
    height: size || style?.height,
    ...style,
  };

  const finalWrapperClass = clsx("inline-flex items-center justify-center", extractSizeClasses(className), clickable && "cursor-pointer select-none", wrapperClass);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick(e);
    }
  };

  if (!SVG_PATH_NAMES.includes(name) || error) return <>{fallback ?? <span className="text-general-warning">⚠</span>}</>;

  const WrapperTag: any = clickable ? "button" : "div";

  return (
    <WrapperTag
      className={finalWrapperClass}
      onClick={onClick ? (e) => onClick(e) : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={handleKeyDown}
      aria-label={name}
      title={name}
      style={{ border: "none", background: "transparent", padding: 0 }}
    >
      <div id={name} className={className} style={finalStyle} dangerouslySetInnerHTML={{ __html: svgContent }} />
    </WrapperTag>
  );
}
