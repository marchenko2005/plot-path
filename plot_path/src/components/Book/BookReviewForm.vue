<template>
  <div class="rate-section text-center">
    <h3>What do you think?</h3>
    <v-avatar class="my-4" size="64">
      <img alt="User avatar" :src="avatarSrc" />
    </v-avatar>

    <v-rating v-model="userRating" color="amber" half-increments size="32" />
    <p class="rate-label">Rate this book</p>

    <template v-if="showReviewText">
      <v-btn class="mt-2" color="brown" variant="flat" @click="submit">Save</v-btn>
      <v-textarea v-model="reviewText" auto-grow class="mt-4" variant="solo" />
    </template>
    <v-btn v-else class="mt-2" color="brown" variant="flat" @click="showReviewText = true">
      Write a review
    </v-btn>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue';

  const props = defineProps<{
    avatarUrl: string | null;
    routeId: string;
    bookId: string;
  }>();

  const emit = defineEmits<{ saved: [] }>();

  const userRating = ref(0);
  const reviewText = ref('');
  const showReviewText = ref(false);

  const avatarSrc = computed(() =>
    props.avatarUrl || 'http://localhost:3001/uploads/avatars/default_ava.jpg'
  );

  const API = 'http://localhost:3000/api';
  const token = localStorage.getItem('accessToken') || '';

  async function submit () {
    try {
      const response = await fetch(`${API}/user/routes/${props.routeId}/book/${props.bookId}/review`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: userRating.value, reviewText: reviewText.value }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to submit review');

      showReviewText.value = false;
      reviewText.value = '';
      userRating.value = 0;
      emit('saved');
    } catch (err) {
      console.error('[BookReviewForm] Error submitting review:', err);
    }
  }
</script>

<style scoped lang="scss">
.rate-section {
  background: #fcf8f6;
  padding: 30px 20px;
  border-radius: 12px;
  margin-bottom: 40px;

  .rate-label {
    font-size: 0.9rem;
    color: #555;
    margin-top: 6px;
  }
}
</style>
