<template>
  <Header />

  <v-container v-if="book" class="book-page" fluid>
    <BookHeader :book="book" />

    <BookReviewForm
      v-if="user"
      :avatar-url="user.AvatarUrl ?? null"
      :book-id="bookId"
      :route-id="routeId"
      @saved="refresh"
    />

    <BookReviewList v-if="reviews.length" :reviews="reviews" />
  </v-container>

  <Footer />
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { useRoute } from 'vue-router';
  import { storeToRefs } from 'pinia';
  import { useUserStore } from '@/store/user';
  import type { Review } from '@/types/general.interface';
  import BookHeader from '@/components/Book/BookHeader.vue';
  import BookReviewForm from '@/components/Book/BookReviewForm.vue';
  import BookReviewList from '@/components/Book/BookReviewList.vue';

  const route = useRoute();
  const bookId = route.params.id as string;
  const routeId = route.query.routeId as string;
  const { user } = storeToRefs(useUserStore());

  const API = 'http://localhost:3000/api';
  const token = localStorage.getItem('accessToken') || '';
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const book = ref<any>(null);
  const reviews = ref<Review[]>([]);

  const normalizeCoverUrl = (url: string | null): string => {
    if (!url) return '';
    return `${import.meta.env.VITE_BASE_URL}${url}`
  };

  const loadBook = async () => {
    try {
      const res = await fetch(`${API}/books/${bookId}`, { headers });
      const data = await res.json();
      book.value = {
        Id: data.Id,
        Title: data.Title,
        Author: data.Author,
        Description: data.Description || '',
        CoverUrl: normalizeCoverUrl(data.CoverUrl),
        Rating: data.AverageRating || 0,
        RatingCount: data.RatingCount || 0,
        ReviewCount: data.ReviewCount || 0,
        Tags: data.Tags || [],
      };
    } catch (err) {
      console.error('[Book Page] Failed to load book:', err);
    }
  };

  const loadReviews = async () => {
    try {
      const res = await fetch(`${API}/books/${bookId}/reviews`, { headers });
      if (!res.ok) throw new Error('Failed to fetch reviews');
      reviews.value = await res.json();
    } catch (err) {
      console.error('[Book Page] Failed to load reviews:', err);
    }
  };

  const refresh = async () => {
    await loadBook();
    await loadReviews();
  };

  onMounted(refresh);
</script>

<style scoped lang="scss">
.book-page {
  padding: 40px;
}
</style>
