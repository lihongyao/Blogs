import { LRUCache } from "lru-cache";

import {
  type JSX,
  Show,
  createEffect,
  createMemo,
  createSignal,
  on,
} from "solid-js";

import { SVG_PATH_NAMES } from "./svgPath_all";

// 全局SVG缓存
const svgCache = new LRUCache<string, string>({
  max: 20,
});
const loadingPromises = new LRUCache<string, Promise<string>>({
  max: 20,
  ttl: 1 * 60 * 1000, // 1分钟未完成的加载请求会被清理
});

export type svgPathTypes = (typeof SVG_PATH_NAMES)[number];

type IconProps = {
  name: svgPathTypes;
  wrapperClass?: string;
  class?: string;
  color?: string;
  style?: Record<string, string>;
  fallback?: JSX.Element;
  onClick?: (e: MouseEvent | KeyboardEvent) => void;
};

const colorAttrs = [
  "fill",
  "stroke",
  "stop-color",
  "flood-color",
  "lighting-color",
  "color",
];

// 需要保留的颜色值
const preserveColors = ["none", "transparent", "inherit", "currentColor"];

function shouldPreserve(color: string) {
  const trimmedColor = color.trim().toLowerCase();
  return (
    preserveColors.includes(trimmedColor) ||
    trimmedColor.startsWith("url(") ||
    trimmedColor === ""
  );
}

function replaceColor(match: string, color: string) {
  if (shouldPreserve(color)) return match;
  return match.replace(color, "currentColor");
}

// 统一替换属性颜色
function replaceColorsInAttr(svgText: string, attr: string) {
  const regex = new RegExp(`${attr}=(["']?)([^"'>\\s]+)\\1`, "g");
  return svgText.replace(regex, (match, quote, color) =>
    replaceColor(match, color),
  );
}

// 替换 CSS 内颜色
function replaceColorsInCss(cssText: string) {
  const cssColorRegex =
    /(fill|stroke|stop-color|flood-color|lighting-color|color)\s*:\s*([^;}\s]+)/g;
  return cssText.replace(cssColorRegex, (match, prop, color) =>
    replaceColor(match, color.trim()),
  );
}

// 移除 SVG 宽高属性
function removeSvgDimensions(svgText: string) {
  return svgText.replace(
    /(<svg[^>]*?)\s*(width|height)=["'][^"']*["']/gi,
    "$1",
  );
}

// 检查是否为颜色相关的 CSS 类
function hasColorClass(className: string) {
  if (!className) return false;
  // 更精确地检查颜色相关的类名
  const colorClassPatterns = [
    /\btext-[a-z]+-[0-9]+/, // text-general-warning
    /\bfill-[a-z]+-[0-9]+/, // fill-blue-400
    /\bstroke-[a-z]+-[0-9]+/, // stroke-green-300
    /\bbg-[a-z]+-[0-9]+/, // bg-yellow-200
    /\btext-[a-z]+(?:-[a-z]+)?/, // text-white, text-general-main
    /\bfill-[a-z]+(?:-[a-z]+)?/, // fill-white, fill-general-main
    /\bstroke-[a-z]+(?:-[a-z]+)?/, // stroke-white, stroke-general-main
    /\bbg-[a-z]+(?:-[a-z]+)?/, // bg-white, bg-general-main
  ];

  return colorClassPatterns.some((pattern) => pattern.test(className));
}

// 检查是否有显式尺寸类
function hasSizeClass(className?: string) {
  if (!className) return false;
  return (
    /\b[wh]-/.test(className) || // w-6, h-6
    /\b(?:w|h)(?:Size)?-/.test(className) || // wSize-6, hSize-6
    /\b(?:min|max)-[wh]-/.test(className) || // min-w-6, max-h-6
    /\bsize-/.test(className) // size-6, size-[10px]
  );
}

// 从类名中提取尺寸相关的类
function extractSizeClasses(className?: string): string {
  if (!className) return "";
  const sizePatterns = [
    /\b[wh]-[^\s]+/g, // w-6, h-8
    /\b(?:w|h)(?:Size)?-[^\s]+/g, // wSize-6, hSize-8
    /\b(?:min|max)-[wh]-[^\s]+/g, // min-w-6, max-h-8
    /\bsize-[^\s]+/g, // size-6
  ];

  const matches = sizePatterns.flatMap(
    (pattern) => className.match(pattern) || [],
  );

  return matches.join(" ");
}

export default function Icon(props: IconProps) {
  if (!SVG_PATH_NAMES.includes(props.name)) {
    return <span class="text-general-warning">⚠</span>;
  }
  const [svgContent, setSvgContent] = createSignal<string>("");
  const [error, setError] = createSignal(false);
  const [loaded, setLoaded] = createSignal(false);
  const iconPath = createMemo(() => `/icons/${props.name}.svg`);

  // 判断颜色设置策略
  const colorStrategy = createMemo(() => {
    const hasColorProp = !!props.color;
    const hasColorClass =
      props.class && /text-|fill-|stroke-/.test(props.class);

    if (hasColorProp && props.color?.startsWith("text-")) {
      // color prop 是 CSS 类
      return { type: "css-class-prop", value: props.color };
    } else if (hasColorProp) {
      // color prop 是具体颜色值
      return { type: "color-value", value: props.color };
    } else if (hasColorClass) {
      // 通过 class 设置颜色
      return { type: "css-class", value: null };
    } else {
      // 使用默认 currentColor
      return { type: "default", value: null };
    }
  });

  const processSvgContent = (svgText: string) => {
    let processedSvg = svgText;

    // 只在有明确的颜色设置时才替换颜色
    const shouldReplaceColors =
      props.color || (props.class && hasColorClass(props.class));

    if (shouldReplaceColors) {
      // 无论什么情况都进行颜色替换，让 SVG 使用 currentColor
      // 这样就能响应外部的 CSS 颜色设置
      colorAttrs.forEach((attr) => {
        processedSvg = replaceColorsInAttr(processedSvg, attr);
      });

      // 替换 style 属性内颜色
      const styleRegex =
        /(fill|stroke|stop-color|flood-color|lighting-color|color)\s*:\s*([^;}"'\s]+)/g;
      processedSvg = processedSvg.replace(styleRegex, (match) =>
        replaceColorsInCss(match),
      );

      // 替换 <style> 标签内的 CSS 颜色
      const cssStyleRegex = /<style[^>]*>([\s\S]*?)<\/style>/g;
      processedSvg = processedSvg.replace(
        cssStyleRegex,
        (match, cssContent) => {
          return match.replace(cssContent, replaceColorsInCss(cssContent));
        },
      );
    }

    // 移除 width 和 height
    processedSvg = removeSvgDimensions(processedSvg);

    // 确保 viewBox 存在
    if (!processedSvg.includes("viewBox=")) {
      processedSvg = processedSvg.replace("<svg", '<svg viewBox="0 0 16 16"');
    }

    // 判断是否有显式尺寸
    const hasExplicitSize =
      hasSizeClass(props.class) ||
      (props.style && (props.style.width || props.style.height));

    if (hasExplicitSize) {
      processedSvg = processedSvg.replace(
        "<svg",
        '<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet"',
      );
    } else {
      // 保持原始尺寸
      const originalWidth = processedSvg.match(/width="([^"]*)"/) ||
        processedSvg.match(/width='([^']*)'/) || ["", "24"];
      const originalHeight = processedSvg.match(/height="([^"]*)"/) ||
        processedSvg.match(/height='([^']*)'/) || ["", "24"];
      processedSvg = processedSvg.replace(
        "<svg",
        `<svg width="${originalWidth[1]}" height="${originalHeight[1]}"`,
      );
    }

    return processedSvg;
  };

  const loadSvg = async () => {
    try {
      setError(false);
      const path = iconPath();

      // 检查全局缓存
      const cachedSvg = svgCache.get(path);
      if (cachedSvg) {
        setSvgContent(processSvgContent(cachedSvg));
        return;
      }

      // 检查是否正在加载中
      const loadingPromise = loadingPromises.get(path);
      if (loadingPromise) {
        const svgText = await loadingPromise;
        setSvgContent(processSvgContent(svgText));
        return;
      }

      // 创建加载Promise
      const loadPromise = fetch(path).then(async (response) => {
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return await response.text();
      });

      loadingPromises.set(path, loadPromise);

      const svgText = await loadPromise;

      // 缓存原始SVG内容
      svgCache.set(path, svgText);
      loadingPromises.delete(path);

      setSvgContent(processSvgContent(svgText));
    } catch (err) {
      console.error(`Icon load failed: ${iconPath()}`, err);
      setError(true);
      loadingPromises.delete(iconPath());
    }
  };

  // 使用 createEffect 来响应 props.name 的变化
  createEffect(
    on(
      createMemo(() => props.name),
      (boolean) => {
        if (boolean) {
          setLoaded(false);
          loadSvg().then(() => setLoaded(true));
        }
      },
    ),
  );

  const finalStyle = createMemo(() => {
    const strategy = colorStrategy();
    const baseStyle = {
      display: "inline-block",
      lineHeight: "0",
      flexShrink: "0",
      ...props.style,
    };

    // 根据颜色策略设置样式
    if (strategy.type === "color-value") {
      // 直接设置颜色值
      return { ...baseStyle, color: strategy.value };
    }

    // 其他情况都使用 currentColor，让 CSS 类控制颜色
    return baseStyle;
  });

  const finalClass = createMemo(() => {
    const strategy = colorStrategy();
    let classes = props.class || "";

    // 如果 color prop 是 CSS 类，添加到 class 中
    if (strategy.type === "css-class-prop") {
      classes = `${classes} ${strategy.value}`.trim();
    }

    return classes;
  });

  const wrapperClass = createMemo(() => {
    const baseClass = "flex items-center justify-center";
    const sizeClasses = extractSizeClasses(props.class);
    const userClass = props.wrapperClass || "";

    return `${baseClass} ${sizeClasses} ${userClass}`.trim();
  });

  const handleClick = (e: MouseEvent) => {
    if (props.onClick) {
      e.preventDefault();
      e.stopPropagation();
      props.onClick(e);
    }
  };

  return (
    <Show
      when={!error()}
      fallback={props.fallback ?? <span class="text-general-warning">⚠</span>}
    >
      <div class={wrapperClass()} onClick={handleClick}>
        <div
          id={props.name}
          class={finalClass()}
          style={finalStyle() as JSX.CSSProperties}
          innerHTML={svgContent()}
          role={props.onClick ? "button" : undefined}
          tabindex={props.onClick ? 0 : undefined}
          onKeyDown={(e) => {
            if (props.onClick && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              props.onClick(e as KeyboardEvent);
            }
          }}
        />
      </div>
    </Show>
  );
}
