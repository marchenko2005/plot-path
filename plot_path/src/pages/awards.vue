<template>
  <Header />
  <v-container class="achievements-page" fluid>
    <h1 class="title text-center mb-10">{{ t('awardsPage.title') }}</h1>

    <v-row dense>
      <v-col
        v-for="(achievement, index) in achievements"
        :key="index"
        class="achievement-item"
        cols="12"
        md="6"
      >
        <v-row align="center" no-gutters>
          <v-col cols="auto">
            <v-img
              alt="Achievement Icon"
              class="me-4"
              :src="achievement.icon"
              width="170"
            />
          </v-col>
          <v-col>
            <h4 class="achievement-title">{{ achievement.title }}</h4>
            <p class="achievement-desc">{{ achievement.description }}</p>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
  <Footer />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const icons = [
  '/images/award_1.webp',
  '/images/award_2.webp',
  '/images/award_3.webp',
  '/images/award_4.webp',
  '/images/award_5.webp',
  '/images/award_6.webp',
];

const achievements = computed(() =>
  icons.map((icon, i) => ({
    icon,
    title:       t(`awardsPage.achievements[${i}].title`),
    description: t(`awardsPage.achievements[${i}].description`),
  }))
);
</script>

<style scoped lang="scss">
.achievements-page {
  padding: 60px 20px;
  min-height: 70vh;

  .title {
    font-weight: 700;
    font-size: 2rem;
  }

  .achievement-item {
    padding: 16px 0;

    .achievement-title {
      font-weight: 600;
      margin-bottom: 4px;
    }

    .achievement-desc {
      color: #555;
      font-size: 0.95rem;
    }
  }
}
</style>
