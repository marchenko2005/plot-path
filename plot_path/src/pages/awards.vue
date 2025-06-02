<template>
  <Header />
  <v-container class="achievements-page" fluid>
    <h1 class="title text-center mb-10">All PlotPath Achievements</h1>

    <v-row dense>
      <v-col
        v-for="achievement in achievements"
        :key="achievement.title"
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
  const achievements = [
    {
      icon: '/images/award_1.webp',
      title: 'First Route Completed',
      description: 'Awarded for completing the first book on PlotPath.',
    },
    {
      icon: '/images/award_2.webp',
      title: 'First Book Completed',
      description: 'Granted for finishing the first book route.',
    },
    {
      icon: '/images/award_3.webp',
      title: 'Monthly Route Master',
      description: 'Awarded for completing 7 routes within a single month.',
    },
    {
      icon: '/images/award_4.webp',
      title: 'Monthly Champion',
      description: 'Awarded for completing the community-wide Route of the Month.',
    },
    {
      icon: '/images/award_5.webp',
      title: 'Multiple Genres Explorer',
      description: 'Awarded for completing at least one route in three different book genres.',
    },
    {
      icon: '/images/award_6.webp',
      title: 'Speed Reader',
      description: 'Awarded for completing a full route within 72 hours from the moment it was started.',
    },
  ];
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
