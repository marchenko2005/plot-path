<template>
  <v-card class="pa-4" color="#C9BBA0" elevation="0" rounded="xl">
    <p class="text-body-2 font-weight-bold mb-1">Book recommendations</p>
    <p class="text-caption mb-3" style="color: #5a5040;">Formed based on the club's ratings of previous books</p>
    <div class="rec-grid">
      <router-link
        v-for="book in recommendations.slice(0, 4)"
        :key="book.Id"
        class="rec-book"
        :to="`/books/0/${book.Id}`"
      >
        <v-img
          :aspect-ratio="1/1.6"
          cover
          rounded="lg"
          :src="resolveUrl(book.CoverUrl)"
        />
      </router-link>
    </div>
    <p v-if="!recommendations.length" class="text-caption text-medium-emphasis text-center mt-2">
      Complete some books to get recommendations
    </p>
  </v-card>
</template>

<script setup lang="ts">
  import type { Book } from '@/types/club';
  import { resolveUrl } from '@/utils/url';

  defineProps<{ recommendations: Book[] }>();
</script>

<style scoped lang="scss">
.rec-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.rec-book {
  border-radius: 8px;
  overflow: hidden;
}
</style>
