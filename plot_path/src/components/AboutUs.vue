<template>
  <div id="about" class="about-us">
    <v-container>
      <v-row>
        <v-col cols="12">
          <h3 class="text-h3">{{ t('about.title') }}</h3>
          <p class="text-body-1">
            {{ t('about.p1') }}<br>
            {{ t('about.p2') }}<br>
            {{ t('about.p3') }}<br>
            {{ t('about.p4') }}<br>
            {{ t('about.p5') }}
          </p>
          <span>{{ t('about.tagline') }}</span>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
</script>

<style scoped>
.about-us {
  padding: 150px 0;
  text-align: center;

  h3 {
    margin-bottom: 50px;
  }

  p {
    max-width: 890px;
    margin: 0 auto;
    font-family: 'Azeret Mono', sans-serif;
  }

  span {
    margin-top: 50px;
    display: inline-block;
    color: rgb(var(--v-theme-primary));
  }
}
</style>
