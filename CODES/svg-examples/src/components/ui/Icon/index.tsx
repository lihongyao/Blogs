"use client";

import { LRUCache } from "lru-cache";
import { type CSSProperties, type KeyboardEvent, type MouseEvent, type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { SVG_PATH_NAMES } from "./svgPath_all";

/* ==================== 缓存配置 ==================== */

// SVG 内容缓存，用于避免重复请求
const svgCache = new LRUCache<string, string>({ max: 100 });

// 加载中的 Promise 缓存，防止重复 fetch
const loadingCache = new LRUCache<string, Promise<string>>({
  max: 100,
  ttl: 60_000, // 1 分钟过期
});

/* ==================== 类型定义 ==================== */

export type SvgPathTypes = (typeof SVG_PATH_NAMES)[number];

export type IconProps = {
  /** 本地图标名称（必须在 SVG_PATH_NAMES 中） */
  name?: SvgPathTypes;

  /** 远程 SVG 文件 URL，优先级高于 name */
  src?: string;

  /**
   * 按 SVG 出现顺序覆盖颜色（偏方模式）：
   * - fill / stroke
   * - linearGradient / radialGradient 内的 stop-color
   * 会统一顺序消耗
   */
  colors?: string[];

  /** 用于内部 <div> 的 className，可控制尺寸/颜色 */
  className?: string;

  /** 外层 wrapper <div> 的 className */
  wrapperClass?: string;

  /** 内联样式，会和 className 一起应用 */
  style?: CSSProperties;

  /** 普通颜色值，会转换为 currentColor，用于 UI icon */
  color?: string;

  /** 加载失败或无效图标时显示的 fallback 元素 */
  fallback?: ReactNode;

  /** 点击事件处理，支持鼠标和键盘回车/空格触发 */
  onClick?: (e: MouseEvent | KeyboardEvent) => void;
};

/* ==================== SVG 安全清理 ==================== */

/**
 * 对 SVG 内容做安全清理：
 * - 移除 <script>、<foreignObject>、on* 事件等危险内容
 * - 去掉无关属性 version/p-id
 * - 清理空 <defs>
 */
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
    .replace(/\s+(version|p-id)\s*=\s*(["'][^"']*["']|\S+)/gi, "")
    .replace(/<defs>\s*<\/defs>/gi, "")
    .trim();
}

/* ==================== 颜色处理 ==================== */

const COLOR_ATTRS = ["fill", "stroke", "stop-color", "flood-color", "lighting-color", "color"];

const PRESERVE_COLORS = ["none", "transparent", "inherit", "currentcolor"];

/** 判断当前颜色是否应保留，不被覆盖 */
function shouldPreserveColor(color: string) {
  const c = color.trim().toLowerCase();
  return c === "" || PRESERVE_COLORS.includes(c) || c.startsWith("url(");
}

/** 替换属性颜色为 currentColor（保留特殊颜色） */
function replaceAttrColor(svg: string, attr: string) {
  const reg = new RegExp(`${attr}=(["'])([^"']+)\\1`, "gi");
  return svg.replace(reg, (m, q, val) => (shouldPreserveColor(val) ? m : `${attr}=${q}currentColor${q}`));
}

/** 替换 <style> 内的颜色为 currentColor */
function replaceCssColors(css: string) {
  return css.replace(/(fill|stroke|stop-color|flood-color|lighting-color|color)\s*:\s*([^;}\s]+)/gi, (m, _p, val) => (shouldPreserveColor(val) ? m : m.replace(val, "currentColor")));
}

/**
 * 高级模式（偏方）：
 * 按 SVG 出现顺序覆盖颜色：
 * - fill
 * - stroke
 * - gradient stop-color
 */
function applyColorsByList(svg: string, colors: string[]): string {
  if (!svg || !colors.length) return svg;

  let idx = 0;

  const nextColor = (val: string) => {
    if (shouldPreserveColor(val)) return val;
    if (idx >= colors.length) return val;
    return colors[idx++];
  };

  // 1️⃣ fill / stroke
  svg = svg.replace(/\b(fill|stroke)\s*=\s*(['"])([^"']+)\2/gi, (match, attr, quote, val) => {
    const replaced = nextColor(val);
    return replaced === val ? match : `${attr}=${quote}${replaced}${quote}`;
  });

  // 2️⃣ gradient stop-color（属性形式）
  svg = svg.replace(/\bstop-color\s*=\s*(['"])([^"']+)\1/gi, (match, quote, val) => {
    const replaced = nextColor(val);
    return replaced === val ? match : `stop-color=${quote}${replaced}${quote}`;
  });

  // 3️⃣ gradient stop-color（style 形式，增强但不强制）
  svg = svg.replace(/stop-color\s*:\s*([^;}\s]+)/gi, (m, val) => {
    const replaced = nextColor(val);
    return replaced === val ? m : m.replace(val, replaced);
  });

  return svg;
}

/* ==================== 尺寸处理 ==================== */

/** 判断 className 中是否含有尺寸类 */
function hasSizeClass(cls?: string) {
  return !!cls && /\b(?:w|h|size|min|max)-/.test(cls);
}

/** 判断 className 中是否含有颜色类 */
function hasColorClass(cls?: string) {
  return !!cls && /\b(text|fill|stroke)-/.test(cls);
}

/** 对 SVG 添加 viewBox、处理宽高 */
function normalizeSvg(svg: string, hasExplicitSize: boolean) {
  // 移除 width / height
  svg = svg.replace(/(<svg[^>]*?)\s*(width|height)=["'][^"']*["']/gi, "$1");

  // 补充 viewBox
  if (!/viewBox=/i.test(svg)) {
    svg = svg.replace("<svg", '<svg viewBox="0 0 16 16"');
  }

  // 如果外层显式设置尺寸，则 SVG 100%
  if (hasExplicitSize) {
    svg = svg.replace("<svg", '<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet"');
  }

  return svg;
}

/* ==================== Icon 组件 ==================== */

export default function Icon({ name, src, className, wrapperClass, style, color, fallback, colors, onClick }: IconProps) {
  const [svg, setSvg] = useState("");
  const [error, setError] = useState(false);

  // 决定最终使用的 SVG 路径
  const iconPath = useMemo(() => {
    if (src) return src;
    if (name && SVG_PATH_NAMES.includes(name)) return `/icons/${name}.svg`;
    return null;
  }, [src, name]);

  /** 核心处理 SVG 内容：清理 / 颜色 / 尺寸 */
  const processSvg = useCallback(
    (raw: string) => {
      let out = sanitizeSvg(raw);

      // 偏方模式：colors 顺序消耗（优先级最高）
      if (colors?.length) {
        out = applyColorsByList(out, colors);
      } else {
        // currentColor 模式
        const shouldUseCurrentColor = color || hasColorClass(className);
        if (shouldUseCurrentColor) {
          COLOR_ATTRS.forEach((attr) => {
            out = replaceAttrColor(out, attr);
          });

          out = out.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (m, css) => m.replace(css, replaceCssColors(css)));
        }
      }

      out = normalizeSvg(out, hasSizeClass(className) || !!style?.width || !!style?.height);

      return out;
    },
    [className, style, color, colors]
  );

  /* ==================== 载入 SVG ==================== */

  useEffect(() => {
    if (!iconPath) return;

    let cancelled = false;
    setError(false);

    const load = async () => {
      try {
        const cached = svgCache.get(iconPath);
        if (cached) {
          if (!cancelled) setSvg(processSvg(cached));
          return;
        }

        let p = loadingCache.get(iconPath);
        if (!p) {
          p = fetch(iconPath, {
            mode: /^https?:\/\//i.test(iconPath) ? "cors" : "same-origin",
            credentials: /^https?:\/\//i.test(iconPath) ? "omit" : "same-origin",
          }).then((r) => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.text();
          });
          loadingCache.set(iconPath, p);
        }

        const text = await p;
        svgCache.set(iconPath, text);
        loadingCache.delete(iconPath);

        if (!cancelled) setSvg(processSvg(text));
      } catch (e) {
        console.error("Icon load failed:", iconPath, e);
        if (!cancelled) setError(true);
        loadingCache.delete(iconPath);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [iconPath, processSvg]);

  /* ==================== 样式和事件处理 ==================== */

  const finalStyle = useMemo<CSSProperties>(
    () => ({
      display: "inline-block",
      lineHeight: 0,
      flexShrink: 0,
      ...(color ? { color } : null),
      ...style,
    }),
    [color, style]
  );

  const handleClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!onClick) return;
      e.preventDefault();
      e.stopPropagation();
      onClick(e);
    },
    [onClick]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (onClick && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        onClick(e);
      }
    },
    [onClick]
  );

  /* ==================== 渲染 ==================== */

  const isLoading = !svg && !error;
  const isInvalid = !iconPath || error;

  return (
    <div className={`inline-flex items-center justify-center ${wrapperClass ?? ""}`} onClick={handleClick}>
      {isInvalid ? (
        (fallback ?? <span className="text-red-500">⚠</span>)
      ) : isLoading ? (
        <div className={className} style={finalStyle} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined} onKeyDown={handleKeyDown} />
      ) : (
        <div className={className} style={finalStyle} dangerouslySetInnerHTML={{ __html: svg }} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined} onKeyDown={handleKeyDown} />
      )}
    </div>
  );
}
