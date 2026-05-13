<template>
  <section class="awards-showcase">
    <v-container>
      <v-row class="content">
        <v-col>
          <h2 class="title">{{ t('awardsShowcase.title') }}</h2>
        </v-col>
        <v-col>
          <div class="badges">
            <div class="badges-grid">
              <img
                v-for="(badge, index) in badges"
                :key="index"
                :alt="badge.name"
                class="badge"
                :src="badge.img"
              >
            </div>
            <v-btn class="view-all" variant="text" @click="$router.push('/awards')">
              {{ t('awardsShowcase.viewAll') }}
            </v-btn>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </section>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface Badge {
  name: string;
  img: string;
}

const badges = ref<Badge[]>([
  { name: 'Bookshelf Master', img: '/images/award_1.webp' },
  { name: '7-Day Streak',     img: '/images/award_2.webp' },
  { name: 'Book Completed',   img: '/images/award_3.webp' },
  { name: 'Map Explorer',     img: '/images/award_4.webp' },
  { name: 'Trophy Winner',    img: '/images/award_5.webp' },
  { name: 'Time Keeper',      img: '/images/award_6.webp' },
]);
</script>

<style lang="scss" scoped>
.awards-showcase {
  background-color: rgb(var(--v-theme-secondary));
  color: rgb(var(--v-theme-primary));
  padding: 20px 0;
  text-align: left;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.5rem;
  font-family: 'Azeret Mono', sans-serif;

  .content {
    .title {
      font-size: 47px;
      font-weight: 400;
      white-space: pre-line;
      flex: 1 1 auto;
      margin-top: 100px;
    }

    .badges-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 1.5rem;
      flex: 2 1 60%;
      justify-items: center;

      .badge {
        border-radius: 50%;
        background-color: transparent;
      }
    }
  }

  .badges {
    display: flex;
    flex-direction: column;
    align-items: center;
    .view-all {
      color: rgb(var(--v-theme-primary));;
      text-transform: none;
      font-size: 0.9rem;
    }
  }
}
</style>
