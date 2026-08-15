<script setup>
import { A11y, Autoplay, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { useI18n } from 'vue-i18n';
import 'swiper/css';
import 'swiper/css/pagination';

import fieldTeamImage from '../../assets/images/pix (1).jpeg';
import coldChainTeamImage from '../../assets/images/pix (2).jpeg';
import inspectionImage from '../../assets/images/pix (3).jpeg';
import equipmentImage from '../../assets/images/pix (4).jpeg';
import facilityImage from '../../assets/images/pix (5).jpeg';

const modules = [A11y, Autoplay, Pagination];
const { t } = useI18n();
const stories = [
  {
    image: fieldTeamImage,
    key: 'field',
    accent: '#31ba70',
  },
  {
    image: coldChainTeamImage,
    key: 'coldChain',
    accent: '#63a9ff',
  },
  {
    image: inspectionImage,
    key: 'inspection',
    accent: '#ffad3d',
  },
  {
    image: equipmentImage,
    key: 'equipment',
    accent: '#31ba70',
  },
  {
    image: facilityImage,
    key: 'facility',
    accent: '#63a9ff',
  },
];
</script>

<template>
  <Swiper
    class="login-story-carousel"
    :modules="modules"
    :slides-per-view="1"
    :speed="900"
    :loop="true"
    :effect="'slide'"
    :autoplay="{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }"
    :pagination="{ clickable: true }"
  >
    <SwiperSlide v-for="story in stories" :key="story.key">
      <article class="login-story-slide" :style="{ '--story-accent': story.accent }">
        <img :src="story.image" :alt="t(`loginStories.slides.${story.key}.alt`)" />
        <div class="login-story-slide__shade" />
        <div class="login-story-slide__content">
          <span>{{ t('loginStories.eyebrow') }}</span>
          <h1>{{ t(`loginStories.slides.${story.key}.title`) }}</h1>
          <i aria-hidden="true" />
          <p>{{ t(`loginStories.slides.${story.key}.description`) }}</p>
        </div>
      </article>
    </SwiperSlide>
  </Swiper>
</template>

<style scoped>
.login-story-carousel { position: absolute; inset: 0; width: 100%; height: 100%; }
.login-story-carousel :deep(.swiper-slide) { height: 100%; }
.login-story-slide { position: relative; width: 100%; height: 100%; overflow: hidden; background: #052d28; }
.login-story-slide img { width: 100%; height: 100%; display: block; object-fit: cover; object-position: center; transform: scale(1.015); transition: transform 7s ease; }
.login-story-carousel :deep(.swiper-slide-active) .login-story-slide img { transform: scale(1.08); }
.login-story-slide__shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(2, 22, 31, .38) 0%, rgba(2, 30, 35, .22) 35%, rgba(2, 28, 32, .9) 82%, rgba(2, 26, 29, .98) 100%), linear-gradient(90deg, rgba(3, 48, 54, .68), transparent 75%); }
.login-story-slide__content { position: absolute; right: clamp(34px, 5vw, 78px); bottom: clamp(62px, 9vh, 105px); left: clamp(34px, 5vw, 78px); z-index: 2; max-width: 480px; color: #fff; }
.login-story-slide__content > span { color: var(--story-accent); font-size: 11px; font-weight: 700; letter-spacing: .12em; line-height: 1.4; text-transform: uppercase; }
.login-story-slide__content h1 { max-width: 460px; margin: 11px 0 0; font-size: clamp(29px, 3vw, 42px); font-weight: 650; letter-spacing: -.03em; line-height: 1.22; text-wrap: balance; }
.login-story-slide__content i { width: 58px; height: 4px; margin: 24px 0 19px; display: block; border-radius: 4px; background: var(--story-accent); }
.login-story-slide__content p { max-width: 430px; margin: 0; color: rgba(255,255,255,.82); font-size: 14px; line-height: 1.7; }
.login-story-carousel :deep(.swiper-pagination) { bottom: 27px; padding: 0 clamp(34px, 5vw, 78px); text-align: start; }
.login-story-carousel :deep(.swiper-pagination-bullet) { width: 7px; height: 7px; margin: 0 4px; background: rgba(255,255,255,.72); opacity: .62; transition: width .2s, opacity .2s, background .2s; }
.login-story-carousel :deep(.swiper-pagination-bullet-active) { width: 25px; border-radius: 999px; background: #fff; opacity: 1; }

@media (prefers-reduced-motion: reduce) {
  .login-story-slide img { transition: none; transform: none; }
  .login-story-carousel :deep(.swiper-slide-active) .login-story-slide img { transform: none; }
}
</style>
