# 概述

[Swiper ↪](https://swiperjs.com/) 

中文指南：https://swiper.js.cn/

# 示例

## 效果1

```

// @See https://swiper.js.cn/swiper-api
// !Tips：Leo 后续新增，对应配置【样式二】
import Swiper from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import { Autoplay, EffectCreative, Navigation } from "swiper/modules";

import { For, onMount } from "solid-js";

import GradientBorderButton from "@/components/Base/GradientBorderButton";
import Icon from "@/components/Icon";
import { useClick } from "@/hooks/useClick";
import { CarouselItem } from "@locent/types";

import "./index.scss";

export default function HomeSwiper(props: { list: CarouselItem[] }) {
  let mySwiper: Swiper | null = null;
  const { click } = useClick();

  onMount(() => {
    mySwiper = new Swiper(".swiper-x", {
      modules: [Autoplay, Navigation, EffectCreative],
      // slidesPerView: 3,
      slidesPerView: "auto",
      centeredSlides: true,
      loop: true,
      spaceBetween: 24,
      grabCursor: true,
      effect: "creative",
      creativeEffect: {
        prev: {
          // 使用百分比避免在大屏出现过大位移
          translate: ["-33%", 0, 0],
          scale: 0.81,
        },
        next: {
          translate: ["33%", 0, 0],
          scale: 0.81,
        },
        shadowPerProgress: true,
      },
      autoplay: { delay: 3000, disableOnInteraction: true },
      pagination: true,
      navigation: true,
      slideToClickedSlide: false,
    });
  });

  const onClickSwiperSlide = (item: CarouselItem) => {
    if (item.click_id) {
      click(item.click_id, item.click_params);
    }
  };

  const onPrev = () => {
    mySwiper?.slidePrev();
  };
  const onNext = () => {
    mySwiper?.slideNext();
  };
  const onMouseEnter = () => {
    mySwiper?.autoplay.stop();
  };
  const onMouseLeave = () => {
    mySwiper?.autoplay.start();
  };

  return (
    <div
      class="swiper-x-container w-full"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* 轮播图容器 */}
      <div class="swiper-x">
        <div class="swiper-wrapper">
          <For
            each={
              props.list.length === 3
                ? [...props.list, ...props.list]
                : props.list
            }
          >
            {(item) => (
              <div
                class="swiper-slide"
                onClick={(ev) => {
                  const classList = ev.target.classList;
                  if (classList.contains("swiper-slide-active")) {
                    onClickSwiperSlide(item);
                  } else if (classList.contains("swiper-slide-next")) {
                    onNext();
                  } else if (classList.contains("swiper-slide-prev")) {
                    onPrev();
                  }
                }}
                style={{
                  "background-image": `url(${item.img_pc})`,
                  "background-repeat": "no-repeat",
                  "background-size": "100% 100%",
                  "border-radius": "12px",
                }}
              />
            )}
          </For>
        </div>
        {/* 分页 */}
        <div class="swiper-pagination-btn prev" onClick={onPrev}>
          <GradientBorderButton>
            <Icon
              name="swiper_prev"
              wrapperClass="size-8"
              class="size-4 text-[var(--colors-icon-btn-default)]"
            />
          </GradientBorderButton>
        </div>
        <div class="swiper-pagination-btn next" onclick={onNext}>
          <GradientBorderButton>
            <Icon
              name="swiper_next"
              wrapperClass="size-8"
              class="size-4 text-[var(--colors-icon-btn-default)]"
            />
          </GradientBorderButton>
        </div>
      </div>
    </div>
  );
}

```

## 效果2

```tsx
"use client";
import type { Swiper as SwiperType } from "swiper";
import { cn } from "@/libs/class-helpers";
import { optimizeImageUrl } from "@/libs/ui";
import { QrCode } from "lucide-react";
import { useRef, useState } from "react";
import { EffectCoverflow } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
const list = [
  "https://test-dev-img.kapok.net/cdn-cgi/image/format=auto/10408/4b7b89cfbbc549b69a73ec5f373d5213.png",
  "https://test-dev-img.kapok.net/cdn-cgi/image/format=auto/10408/4b7b89cfbbc549b69a73ec5f373d5213.png",
  "https://test-dev-img.kapok.net/cdn-cgi/image/format=auto/10408/4b7b89cfbbc549b69a73ec5f373d5213.png",
  "https://test-dev-img.kapok.net/cdn-cgi/image/format=auto/10408/4b7b89cfbbc549b69a73ec5f373d5213.png",
  "https://test-dev-img.kapok.net/cdn-cgi/image/format=auto/10408/4b7b89cfbbc549b69a73ec5f373d5213.png",
  "https://test-dev-img.kapok.net/cdn-cgi/image/format=auto/10408/4b7b89cfbbc549b69a73ec5f373d5213.png",
  "https://test-dev-img.kapok.net/cdn-cgi/image/format=auto/10408/4b7b89cfbbc549b69a73ec5f373d5213.png",
  "https://test-dev-img.kapok.net/cdn-cgi/image/format=auto/10408/4b7b89cfbbc549b69a73ec5f373d5213.png",
];
export default function ShareSwiper() {
  const swiperRef = useRef<SwiperType>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  return (
    <div>
      <Swiper
        centeredSlides={true}
        loop={true}
        slidesPerView={1.14678}
        modules={[EffectCoverflow]}
        effect="coverflow"
        coverflowEffect={{
          rotate: 0,
          stretch: 0,
          scale: 0.9,
          depth: 100,
          modifier: 1,
          slideShadows: true,
        }}
        spaceBetween={12}
        onRealIndexChange={(swiper) => {
          setCurrentIndex(swiper.realIndex);
        }}
        onSwiper={(swiper: SwiperType) => {
          swiperRef.current = swiper;
        }}
      >
        {list.map((item, index) => (
          <SwiperSlide key={index} className="relative overflow-hidden rounded-xl">
            <div
              className={cn("aspect-[327/326]")}
              style={{
                backgroundImage: `url(${item})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            >
              <div className="absolute bottom-0 left-0 flex aspect-[327/120] w-full items-center gap-(--space-md) bg-[linear-gradient(180deg,transparent,black)] px-[36px]">
                <div
                  className="flex size-[78px] items-center justify-center"
                  style={{
                    backgroundImage: `url(${optimizeImageUrl("affiliate/qr_box.png", { imageOptions: { h: 78 } })})`,
                    backgroundSize: "cover",
                  }}
                >
                  <QrCode values="https://ybr-dev.kapok.net/" className="size-[67px] bg-white" />
                </div>
                <div className="flex h-[78px] flex-1 flex-col justify-between">
                  <div className="flex h-[36px] items-center gap-(--space-xs) rounded-(--radius-sm) bg-(--color-fade-white-60) px-(--space-lg)">
                    <div className="label-xs w-[40px] text-(--color-text-primary)">Player</div>
                    <span className="label-md font-semibold text-(--color-button-text-primary)">
                      1234567890
                    </span>
                  </div>
                  <div className="flex h-[36px] items-center gap-(--space-xs) rounded-(--radius-sm) bg-(--color-fade-white-60) px-(--space-lg)">
                    <div className="label-xs w-[40px] text-(--color-text-primary)">Code</div>
                    <span className="label-md font-semibold text-(--color-button-text-primary)">
                      1234567890
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      <div className="swiper-pagination flex h-[30px] items-center justify-center gap-(--space-md)">
        {list.map((item, index) => (
          <div
            key={index}
            onClick={() => {
              swiperRef.current?.slideTo(index);
            }}
            className={cn(
              "size-[8px] cursor-pointer rounded-full",
              currentIndex === index
                ? "bg-(--color-surface-palette-01-450)"
                : "bg-(--color-icon-secondary)",
            )}
          />
        ))}
      </div>
    </div>
  );
}

```

