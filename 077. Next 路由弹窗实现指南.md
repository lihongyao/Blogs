# 概述

当前负责项目基于 [next-intl](https://next-intl.dev/) 国际化 + [Next.js 16 App Router](https://nextjs.org/docs) 实现，业务上有一个需求是要实现 **路由弹窗**（弹窗的开关完全由 URL 控制，刷新、前进后退都能保持状态）。

官方推荐的 Intercepting Routes + Parallel Routes 在刷新后会变成普通页面，不符合需求。用 **Rewrite** 可以解决。

思路：

- URL 末尾加 modal 段（如 `/en/details/1/modal-login`），关闭时 `router.back()` 或 `replace` 去掉最后一段；
- 服务端对带 modal 的请求做 rewrite，让 App 按基础路径渲染；
- 前端根据 pathname 解析 modal 段并渲染对应组件。

# 实现指南

## 01 目录与约定

```
src/
├── app/[locale]/
│   ├── layout.tsx
│   ├── page.tsx
│   └── (modals)/
│       ├── index.ts                    # ModalComponents 映射
│       ├── login.tsx
│       └── profile.tsx
├── animations/
│   └── motion-animations.ts            # 弹窗动画配置
├── components/features/
│   └── RouteModalRenderer.tsx
├── hooks/                            
│   ├── useDevices.ts                   # 设备查询（响应式）
│   ├── useModalPageAutoCollapse.ts     # 处理独立路由和弹窗路由在 PC/H5 下的自动切换
│   ├── useModalRoutes.ts               # 提供路由弹窗相关工具函数
│   ├── useMounted.ts                   # 是否挂载
│   └── useSwipeBack.ts                 # 处理移动端浏览器右滑返回
├── i18n/
│   ├── navigation.ts                   # next-intl 的 usePathname/useRouter
│   └── routing.ts
├── libs/
│   └── routes.ts                       # ModalRoutes 常量
├── proxy.ts                            # 中间件逻辑（modal rewrite）
└── middleware.ts                       # 项目根目录，导出 proxy
```

弹窗组件放 `(modals)` 路由组下，`libs/routes.ts` 定义常量，`(modals)/index.ts` 做段名到组件的映射。

## 02 路由常量与组件映射

### libs/routes.ts

```ts
// src/libs/routes.ts
// 页面路由
export const PageRoutes = {
  Home: '/',
  Details: '/details',
  ...
} as const;

// 弹窗路由
export const ModalRoutes = {
  ModalProfile: '/modal-profile',
  ModalLogin: '/modal-login',
} as const;

// 所有路由
export const Routes = {
  ...PageRoutes,
  ...ModalRoutes,
} as const;

export type Route = (typeof Routes)[keyof typeof Routes];
export type ModalRoute = (typeof ModalRoutes)[keyof typeof ModalRoutes];
export type PageRoute = (typeof PageRoutes)[keyof typeof PageRoutes];

/**
 * 弹窗路由 ↔ 页面路由映射
 *
 * 当H5为路由弹窗页面，PC为独立页面时， 为实现H5/PC之间的动态切换。
 * 需在这里定义对应的映射关系，useModalPageAutoCollapse 会自动处理 H5/PC 之间的动态切换。
 * 如：/profile <-> /modal-profile
 *
 * 涉及参数时，处理有点复杂，比如：
 * 1. 游戏列表：/game-list（列表页） /game-list/1（PC 详情） /modal-game-details/1（H5 弹窗详情）
 * 2. 仅当「当前路径带参数」时才随视窗切换；列表页（无参）不切换。无参页（如 profile）始终切换。
 *
 * - onlySwitchWhenParamPresent：设为 true 表示该条是「列表+详情」型，仅当 path 带参数（详情）时才切换，列表页不切换。
 *
 * @see useModalPageAutoCollapse
 * @see useModalRoutes
 */
export const ModalPageRoutes = {
  profile: {
    pc: Routes.Profile,
    h5: Routes.ModalProfile,
  },
  gameDetails: {
    pc: Routes.GameDetails,
    h5: Routes.ModalGameDetails,
    onlySwitchWhenParamPresent: true,
  },
} as const satisfies Record<
  string,
  { readonly pc: Route; readonly h5: Route; readonly onlySwitchWhenParamPresent?: boolean }
>;

/** ModalPageRoutes 的 key，用于遍历与索引 */
export type ModalPageRouteKey = keyof typeof ModalPageRoutes;

/** 单个弹窗/页面对应的路由配置 */
export type ModalPageRouteConfig = (typeof ModalPageRoutes)[ModalPageRouteKey];

```

### (modals)/index.ts

段名（如 `modal-login`）对应 URL 中的 `/modal-login` 去掉前导斜杠，映射到组件：

```tsx
// src/app/[locale]/(modals)/index.ts
import type { ComponentType } from 'react';

import dynamic from 'next/dynamic';

import type { ModalComponentProps } from '@/components/features/RouteModalRenderer';

const ModalProfile = dynamic(() => import('@/app/[locale]/(modals)/profile'));
const ModalLogin = dynamic(() => import('@/app/[locale]/(modals)/login'));

export const ModalComponents: Record<string, ComponentType<ModalComponentProps>> = {
  'modal-profile': ModalProfile,
  'modal-login': ModalLogin,
  ...
};
```

## 03 proxy 重写

当 URL 带 modal 段时，rewrite 到「基础路径」，让 `[locale]` 能正确解析，地址栏仍保留完整 URL。

```ts
// src/proxy.ts
import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';

import { routing } from './i18n/routing';
import { ModalRoute, ModalRoutes } from './libs/routes';

const intlMiddleware = createMiddleware(routing);

const modalRouteValues = new Set(Object.values(ModalRoutes));
const defaultLocale = routing.defaultLocale;
const locales = routing.locales;

// 处理国际化路由和 modal 路由重写
export function proxy(request: NextRequest) {
  const rewriteTarget = modalRewriteUrl(request);
  if (rewriteTarget) {
    // Next.js 16 用 NextResponse.rewrite() 做重写，不再使用 x-middleware-rewrite header
    return NextResponse.rewrite(rewriteTarget);
  }
  return intlMiddleware(request);
}

function modalRewriteUrl(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // modal 路由判断：是否命中 ModalRoutes
  const modalRouteKey = matchModalRoute(pathname);
  if (!modalRouteKey) return null;

  const pathnames = pathname.split('/').filter(Boolean);
  const modalIndex = pathnames.findIndex((segment) => `/${segment}` == modalRouteKey);
  if (modalIndex === -1) return null;

  const basePaths = pathnames.slice(0, modalIndex);

  // 检查路径是否包含语言前缀，则加上默认语言
  const hasLocalePrefix = basePaths.length > 0 && locales.includes(basePaths[0]);
  if (!hasLocalePrefix) {
    basePaths.unshift(defaultLocale);
  }

  const basePath = `/${basePaths.join('/')}`;

  // 克隆请求的URL对象，在其基础上修改
  const rewriteUrl = request.nextUrl.clone();
  // 设置基础路径，确保没有多余的斜杠
  rewriteUrl.pathname = basePath.replace(/\/{2,}/g, '/');

  const nextParams = new URLSearchParams(searchParams.toString());
  // 将查询参数赋值给 URL
  rewriteUrl.search = nextParams.toString() ? `?${nextParams.toString()}` : '';
  // 返回新的 URL（Next.js 会用它来执行 rewrite）
  return rewriteUrl;
}

function matchModalRoute(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length == 0) return null;
  // 遍历路径段，找到是否有段匹配 ModalRoutes 的值（忽略前导斜杠差异）
  for (let i = 0; i < segments.length; i++) {
    const seg = `/${segments[i]}`;
    if (modalRouteValues.has(seg as ModalRoute)) return seg;
  }
  return null;
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
};

```

## 04 next.config.ts 配置

用户直接访问 `/modal-login` 时，没有 locale，`[locale]` 会把 `modal-login` 当成 locale。用 `beforeFiles` 先重写到默认语言：

```ts
// src/next.config.ts
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

import brandConfig from './src/configs/brands';
import { ModalRoutes } from './src/libs/routes';

const defaultLocale = brandConfig.defaultLocale;
const modalRewrites = (Object.values(ModalRoutes) as string[]).map((path) => ({
  source: path,
  destination: `/${defaultLocale}`,
}));

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  reactStrictMode: false,
  // 在路由匹配前把 /modal-xxx 等重写到 /{defaultLocale}，避免被 [locale] 误匹配成 locale
  rewrites: async () => ({
    beforeFiles: modalRewrites,
  }),
};
const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
```

## 05 动画配置

```ts
import type { Variants } from 'framer-motion';

/**
 * Modal 动画配置
 * 供 RouteModalRenderer 使用，支持 Desktop / Mobile 两种展示方式
 */

/** 动画曲线 */
const EASE_ENTER = [0.32, 0.72, 0, 1] as const;
const EASE_EXIT = [0.25, 1, 0.5, 1] as const;

/** 遮罩层 - Desktop：淡入淡出 */
export const modalBackdropVariantsDesktop: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: {
    opacity: 0,
    transition: { type: 'tween', duration: 0.2, ease: EASE_EXIT },
  },
};

/** 遮罩层 - Mobile：从右往左滑入，关闭时滑回右侧 */
export const modalBackdropVariantsMobile: Variants = {
  hidden: { opacity: 0, x: '100%' },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'tween', duration: 0.25, ease: EASE_ENTER },
  },
  exit: {
    opacity: 0,
    x: '100%',
    transition: { type: 'tween', duration: 0.2, ease: EASE_EXIT },
  },
};

/** 内容层 - Desktop：缩放 + 淡入淡出 */
export const modalContentVariantsDesktop: Variants = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'tween', duration: 0.3, ease: EASE_ENTER },
  },
  exit: {
    opacity: 0,
    scale: 0.7,
    y: 20,
    transition: { type: 'tween', duration: 0.25, ease: EASE_EXIT },
  },
};

/** 内容层 - Mobile：从右往左滑入，关闭时滑回右侧 */
export const modalContentVariantsMobile: Variants = {
  hidden: { x: '100%' },
  visible: {
    x: 0,
    transition: { type: 'tween', duration: 0.3, ease: EASE_ENTER },
  },
  exit: {
    x: '100%',
    transition: { type: 'tween', duration: 0.3, ease: EASE_EXIT },
  },
};
```

## 06 RouteModalRenderer

核心逻辑：从 pathname 解析 modal 段 → 按映射取组件 → 用 AnimatePresence 控制进出场，退出播完再卸载。

```tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { AnimatePresence, motion } from 'framer-motion';

import {
  modalBackdropVariantsDesktop,
  modalBackdropVariantsMobile,
  modalContentVariantsDesktop,
  modalContentVariantsMobile,
} from '@/animations/modal-animations';
import { ModalComponents } from '@/app/[locale]/(modals)';
import { useDevice } from '@/hooks/useDevices';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import { routing } from '@/i18n/routing';

export type ModalComponentProps = {
  onClose: () => void;
};

/**
 * 按 URL 里的 modal 段（如 /en/modal-login）渲染弹窗，支持多层叠。
 * 进场右滑、退场等 AnimatePresence exit 播完再卸。isMobile 为 null 时不画。
 */
export default function RouteModalRenderer() {
  const router = useRouter();
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter(Boolean);
  const searchParamsString = useSearchParams().toString();
  const { isMobile } = useDevice();

  const [isAllow, setIsAllow] = useState(true);
  const [pureHidden, setPureHidden] = useState(false); // 等 exit 播完再隐藏，否则关时会闪

  const modalKeys = useMemo(() => pathSegments.filter((s) => ModalComponents[s]), [pathSegments]);
  const modalComponents = useMemo(
    () => modalKeys.filter(Boolean).map((m) => ModalComponents[m]),
    [modalKeys],
  );

  const onClose = useCallback(() => {
    if (!modalComponents.length) return;
    if (window.history.length > 2) {
      router.back();
      return;
    }
    const params = new URLSearchParams(searchParamsString);
    const nextQuery = params.toString();
    const newPathSegments = [...pathSegments];
    newPathSegments.pop();
    const nextPath = `/${newPathSegments.join('/')}` || `/${routing.defaultLocale}`;
    router.replace(nextQuery ? `${nextPath}?${nextQuery}` : nextPath, { scroll: false });
  }, [modalComponents.length, router, pathSegments, searchParamsString]);

  useSwipeBack((value) => setIsAllow(!value), { enabled: modalComponents.length > 0 });

  useEffect(() => {
    if (modalComponents.length) {
      setPureHidden(false);
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      setIsAllow(true);
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
  }, [modalComponents.length]);

  if (pureHidden) return null;
  if (isMobile === null) return null;

  const backdropVariants = isAllow
    ? isMobile
      ? modalBackdropVariantsMobile
      : modalBackdropVariantsDesktop
    : undefined;
  const contentVariants = isAllow
    ? isMobile
      ? modalContentVariantsMobile
      : modalContentVariantsDesktop
    : undefined;

  return (
    <AnimatePresence
      onExitComplete={() => {
        if (!modalComponents.length) setPureHidden(true);
      }}
    >
      {modalComponents.map((Modal, idx) => {
        const modalKey = modalKeys[idx];
        return (
          <motion.div
            key={modalKey}
            data-name={`modal-${modalKey}`}
            className="fixed inset-0 z-auto flex items-center justify-center"
          >
            <motion.div
              className="absolute size-full bg-black/70"
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={onClose}
            />
            <motion.div
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{ willChange: 'transform, opacity' }}
            >
              <Modal onClose={onClose} />
            </motion.div>
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}

```

## 07 useSwipeBack

左边缘右滑返回时，关闭动画避免与手势冲突：

```tsx
// src/hooks/useSwipeBack.ts
'use client';
import { useEffect } from 'react';

type SwipeBackOptions = {
  enabled?: boolean;
  edge?: number; // 左边缘阈值
  distance?: number; // 触发距离
};

export function useSwipeBack(onSwipe: (value: boolean) => void, options: SwipeBackOptions = {}) {
  const { enabled = true, edge = 30, distance = 50 } = options;

  useEffect(() => {
    if (!enabled) return;
    let startX = 0;
    let startY = 0;
    let swiped = false;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      swiped = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      const dx = Math.abs(t.clientX - startX);
      const dy = Math.abs(t.clientY - startY);

      if (startX < edge && dx > distance && dx > dy) {
        swiped = true;
      }
    };

    const onTouchEnd = () => {
      onSwipe(swiped);
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [enabled, onSwipe, edge, distance]);
}
```

## 08 useModalRoutes

```ts
// src/hooks/useModalRoutes.ts
import { usePathname } from '@/i18n/navigation';
import { ModalPageRouteConfig, ModalRoutes } from '@/libs/routes';

import { useDevice } from './useDevices';

/**
 * 提供弹窗/页面路由相关工具方法
 *
 * - resolveRouteForCurrentDevice: 根据当前设备从配置中返回 pc 或 h5 路径，传 ModalPageRoutes.xxx
 * - mergeRouteIntoCurrentPath: 将目标路由合并到当前 pathname，返回完整路径（路由弹窗时用）
 */
export const useModalRoutes = () => {
  const pathname = usePathname();
  const { isMobile } = useDevice();

  /** 将目标路由合并进当前 pathname，返回完整路径 */
  const mergeRouteIntoCurrentPath = (target: string) => {
    if (!target) return target;
    // 确保目标路由以斜杠开头
    target = target.startsWith('/') ? target : `/${target}`;
    const base = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
    const index = pathname.indexOf(target);
    return index !== -1 ? `${pathname.slice(0, index)}${target}` : `${base}${target}`;
  };

  /** 根据当前设备（pc/h5）从配置中取对应路径，null 当 PC */
  const resolveRouteForCurrentDevice = (config: ModalPageRouteConfig) => {
    const jumpToUrl = isMobile === true ? config.h5 : config.pc;
    const isModalRoute = (Object.values(ModalRoutes) as string[]).includes(jumpToUrl);
    return isModalRoute ? mergeRouteIntoCurrentPath(jumpToUrl) : jumpToUrl;
  };

  /** 从目标路由中获取参数 */
  const getModalParams = (target: string) => {
    const pathnameSegments = pathname.split('/').filter(Boolean);
    const targetSegments = target.split('/').filter(Boolean);
    const targetIndex = pathnameSegments.findIndex((segment) => targetSegments.includes(segment));
    const params = pathnameSegments.slice(targetIndex + 1);
    return params;
  };

  return { 
    mergeRouteIntoCurrentPath, 
    resolveRouteForCurrentDevice, 
    getModalParams 
  };
};

```

## 09 在 layout 中挂载

在 `[locale]` layout 里和 `children` 并列挂载：

```tsx
// src/app/[locale]/layout.tsx（仅展示与路由弹窗相关的部分）
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import RouteModalRenderer from '@/components/features/RouteModalRenderer';
import { routing } from '@/i18n/routing';

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages} locale={locale}>
          {children}
          <RouteModalRenderer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

## 10 打开与关闭弹窗

### 打开

#### 目标页只是路由弹窗

用 `useModalRoutes().getMergePath(ModalRoute)` 得到「当前 path + modal 段」，再用 `router.push` 或 `Link`：

```tsx
// 示例：在任意页面打开登录弹窗
'use client';

import { useRouter } from '@/i18n/navigation';
import { useModalRoutes } from '@/hooks/useModalRoutes';
import { ModalRoutes } from '@/libs/routes';

export default function HomePage() {
  const router = useRouter();
  const { getMergePath } = useModalRoutes();

  const openLogin = () => {
    const path = getMergePath(ModalRoutes.ModalLogin);
    router.push(path, { scroll: false });
  };

  return (
    <div>
      <button onClick={openLogin}>打开登录弹窗</button>
    </div>
  );
}
```

或用 `Link`：

```tsx
import { Link } from '@/i18n/navigation';
import { useModalRoutes } from '@/hooks/useModalRoutes';
import { ModalRoutes } from '@/libs/routes';

export default function HomePage() {
  const { getMergePath } = useModalRoutes();

  return (
    <Link href={getMergePath(ModalRoutes.ModalLogin)} scroll={false}>
      打开登录弹窗
    </Link>
  );
}
```

#### 目标页h5 是路由弹窗PC 是页面

1）无参数

```tsx
router.push(resolveRouteForCurrentDevice(ModalPageRoutes.profile), {
  scroll: false,
})
```

resolveRouteForCurrentDevice 会根据当前设备类型返回正确的路径。

2）有参数

有参数时，统一使用 params 传参，如下：

```
const jumpToUrl = resolveRouteForCurrentDevice(ModalPageRoutes.gameDetails);
router.push(jumpToUrl + '/1');
```

在独立页面，可以直接通过 params 参数 api 获取。

在弹出页面，可以使用封装的参数获取方法，如：

```tsx
 const { getModalParams } = useModalRoutes();

  useEffect(() => {
    const params = getModalParams(Routes.ModalGameDetails);
    console.log('params >> ', params);
  }, []);
```

### 关闭

弹窗内调用 `onCloseAction()`，由 `RouteModalRenderer` 内部执行 `router.back()` 或 `router.replace`。

# 注意事项

- **pathname 来源**

  所有读取 pathname、执行跳转的地方，统一使用 @/i18n/navigation 中封装的 usePathname / useRouter，不要直接使用 next/navigation。否则会出现 locale 前缀不一致的问题。

- **next.config 的 rewrites**

  beforeFiles 只负责处理「纯 modal 路径」到默认 locale 的映射。

  带 locale 的路径（例如 /en/modal-login）不在这里处理，而是交由 proxy 进行 rewrite。

- **proxy 与 middleware 执行顺序**

  必须先执行 modal 的 rewrite，再进入 next-intl 的 middleware。

  这样带 modal 的请求才能以「base 路径 + 正确 locale」的形式进入 App，保证国际化上下文正常。

- **退出动画**

  当路由变为空时，不要立即 return null。

  应在 onExitComplete 回调触发，并且确认当前没有 modal 后，再设置 pureHidden 并返回 null。否则 exit 动画会来不及播放，出现“闪没”的问题。

- **新增弹窗**

  只需在 ModalRoutes 和 ModalComponents 中各新增一项，并确保 proxy 与 next.config 中使用的 ModalRoutes 保持一致即可。

  不需要改动渲染逻辑。

