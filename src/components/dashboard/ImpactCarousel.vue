<script setup>
import { A11y, Autoplay, Keyboard, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/vue';
import 'swiper/css';
import 'swiper/css/pagination';

import fieldTeamImage from '../../assets/images/pix (1).jpeg';
import coldChainTeamImage from '../../assets/images/pix (2).jpeg';
import inspectionImage from '../../assets/images/pix (3).jpeg';
import equipmentImage from '../../assets/images/pix (4).jpeg';
import facilityImage from '../../assets/images/pix (5).jpeg';

const modules = [A11y, Autoplay, Keyboard, Pagination];

const impactStories = [
  {
    image: fieldTeamImage,
    eyebrow: 'Connected teams',
    title: 'One clear view for every facility team',
    description: 'FEPPM connects managers, technicians, and health workers around the maintenance actions that matter most.',
    alt: 'Facility staff documenting a field maintenance visit',
  },
  {
    image: coldChainTeamImage,
    eyebrow: 'Reliable cold chain',
    title: 'Protect essential equipment and supplies',
    description: 'Planned checks help keep cold-chain equipment dependable and safeguard temperature-sensitive health commodities.',
    alt: 'Health facility team standing beside cold-chain equipment',
  },
  {
    image: inspectionImage,
    eyebrow: 'Verified field work',
    title: 'Turn every inspection into evidence',
    description: 'Documented visits and maintenance records improve accountability, follow-up, and confidence in facility operations.',
    alt: 'Field inspection team reviewing cold-chain equipment',
  },
  {
    image: equipmentImage,
    eyebrow: 'Preventive maintenance',
    title: 'Find risks before equipment fails',
    description: 'Routine schedules, alerts, and timely interventions reduce avoidable downtime and extend the life of critical assets.',
    alt: 'Operational cold-chain equipment inside a health facility',
  },
  {
    image: facilityImage,
    eyebrow: 'Health system impact',
    title: 'Stronger facilities support better care',
    description: 'Reliable infrastructure gives health workers the environment and equipment they need to serve their communities.',
    alt: 'Exterior of a primary health centre',
  },
];
</script>

<template>
  <section class="impact-showcase" aria-labelledby="impact-showcase-title">
    <header class="impact-showcase__header">
      <div>
        <span>FEPPM in action</span>
        <h2 id="impact-showcase-title">Maintenance that makes an impact</h2>
      </div>
      <p><i aria-hidden="true" /> Field stories · Auto-rotates</p>
    </header>

    <Swiper
      class="impact-carousel"
      :modules="modules"
      :slides-per-view="1"
      :space-between="14"
      :speed="800"
      :loop="true"
      :autoplay="{ delay: 4500, disableOnInteraction: false, pauseOnMouseEnter: true }"
      :keyboard="{ enabled: true }"
      :pagination="{ clickable: true }"
      :breakpoints="{
        640: { slidesPerView: 2 },
        1100: { slidesPerView: 3 },
      }"
    >
      <SwiperSlide v-for="story in impactStories" :key="story.title">
        <article class="impact-card">
          <img :src="story.image" :alt="story.alt" loading="lazy" />
          <div class="impact-card__shade" />
          <div class="impact-card__copy">
            <span>{{ story.eyebrow }}</span>
            <h3>{{ story.title }}</h3>
            <p>{{ story.description }}</p>
          </div>
        </article>
      </SwiperSlide>
    </Swiper>
  </section>
</template>

<style scoped>
.impact-showcase { margin: 16px 0; padding: 18px; overflow: hidden; border: 1px solid #e2e8f0; border-radius: 18px; background: linear-gradient(145deg, #fff, #f7fbf9); box-shadow: 0 7px 24px rgba(16, 24, 40, .05); }
.impact-showcase__header { margin-bottom: 14px; display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; }
.impact-showcase__header span { color: #079455; font-size: 10px; font-weight: 700; letter-spacing: .1em; line-height: 1.4; text-transform: uppercase; }
.impact-showcase__header h2 { margin: 3px 0 0; color: #101828; font-size: clamp(17px, 1.7vw, 22px); line-height: 1.3; }
.impact-showcase__header > p { margin: 0; display: flex; align-items: center; gap: 7px; color: #667085; font-size: 10px; white-space: nowrap; }
.impact-showcase__header i { width: 7px; height: 7px; border-radius: 50%; background: #12b76a; box-shadow: 0 0 0 4px rgba(18, 183, 106, .12); }
.impact-carousel { overflow: visible; }
.impact-card { position: relative; height: clamp(330px, 33vw, 410px); overflow: hidden; border-radius: 14px; background: #163b31; isolation: isolate; }
.impact-card img { width: 100%; height: 100%; display: block; object-fit: cover; transition: transform .7s ease; }
.impact-card:hover img { transform: scale(1.035); }
.impact-card__shade { position: absolute; inset: 0; z-index: 1; background: linear-gradient(180deg, rgba(3, 22, 17, .03) 25%, rgba(3, 22, 17, .88) 88%, rgba(3, 22, 17, .96)); }
.impact-card__copy { position: absolute; right: 0; bottom: 0; left: 0; z-index: 2; padding: 28px 22px 42px; color: #fff; }
.impact-card__copy > span { width: fit-content; padding: 5px 8px; display: block; border: 1px solid rgba(255,255,255,.3); border-radius: 999px; color: #dcfae6; background: rgba(7, 148, 85, .65); backdrop-filter: blur(5px); font-size: 9px; font-weight: 700; letter-spacing: .07em; line-height: 1.3; text-transform: uppercase; }
.impact-card__copy h3 { margin: 9px 0 0; font-size: clamp(16px, 1.5vw, 20px); line-height: 1.3; }
.impact-card__copy p { margin: 7px 0 0; color: rgba(255,255,255,.82); font-size: 10px; line-height: 1.55; }
.impact-carousel :deep(.swiper-pagination) { bottom: 13px; }
.impact-carousel :deep(.swiper-pagination-bullet) { width: 6px; height: 6px; margin: 0 3px; background: rgba(255,255,255,.72); opacity: .65; transition: width .2s, opacity .2s; }
.impact-carousel :deep(.swiper-pagination-bullet-active) { width: 19px; border-radius: 999px; background: #fff; opacity: 1; }

@media (max-width: 639px) {
  .impact-showcase { padding: 13px; border-radius: 15px; }
  .impact-showcase__header { align-items: flex-start; }
  .impact-showcase__header > p { display: none; }
  .impact-card { height: 370px; }
  .impact-card__copy { padding: 24px 18px 40px; }
  .impact-card__copy p { font-size: 11px; }
}

@media (prefers-reduced-motion: reduce) {
  .impact-card img { transition: none; }
}
</style>
