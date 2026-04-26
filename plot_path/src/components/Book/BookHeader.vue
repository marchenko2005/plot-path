<template>
  <v-row class="book-header" no-gutters>
    <v-col cols="12" md="2">
      <v-img class="book-cover" :src="book.CoverUrl" />
    </v-col>

    <v-col class="book-info" cols="12" md="10">
      <h1>{{ book.Title }}</h1>
      <h2>{{ book.Author }}</h2>

      <div v-if="book.RatingCount > 0" class="rating-line">
        <v-rating color="amber" half-increments :model-value="book.Rating" readonly />
        <span class="rating-score">{{ book.Rating.toFixed(2) }}</span>
        <span class="rating-meta">
          {{ book.RatingCount.toLocaleString() }} ratings · {{ book.ReviewCount.toLocaleString() }} reviews
        </span>
      </div>

      <div v-if="book.Description" class="book-description">
        <p>{{ showMore ? book.Description : truncated }}</p>
        <a class="show-toggle" @click="showMore = !showMore">
          {{ showMore ? 'Show less' : 'Show more' }}
        </a>
      </div>

      <div v-if="book.Tags?.length" class="tags">
        <v-chip v-for="tag in book.Tags" :key="tag" class="tag" color="pink-lighten-3">
          {{ tag }}
        </v-chip>
      </div>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue';

  interface Book {
    Title: string;
    Author: string;
    CoverUrl: string;
    Description: string;
    Rating: number;
    RatingCount: number;
    ReviewCount: number;
    Tags: string[];
  }

  const props = defineProps<{ book: Book }>();

  const showMore = ref(false);

  const truncated = computed(() =>
    props.book.Description.length > 300
      ? props.book.Description.slice(0, 300) + '...'
      : props.book.Description
  );
</script>

<style scoped lang="scss">
.book-header {
  margin-bottom: 40px;

  .book-cover {
    border-radius: 4px;
    width: 100%;
    max-width: 160px;
  }

  .book-info {
    padding-left: 24px;

    h1 {
      font-size: 2rem;
      font-weight: bold;
      margin-bottom: 4px;
    }

    h2 {
      font-size: 1.2rem;
      color: #666;
      margin-bottom: 12px;
    }

    .rating-line {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;

      .rating-score { font-weight: bold; }

      .rating-meta {
        color: #888;
        font-size: 0.9rem;
      }
    }

    .book-description {
      font-size: 1rem;
      margin-bottom: 10px;

      .show-toggle {
        color: #8d6e63;
        font-size: 0.9rem;
        cursor: pointer;
      }
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  }
}
</style>
