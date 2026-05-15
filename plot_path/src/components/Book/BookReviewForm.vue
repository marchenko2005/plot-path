<template>
  <div class="rate-section text-center">
    <h3>What do you think?</h3>
    <v-avatar class="my-4" size="64">
      <img alt="User avatar" :src="avatarSrc">
    </v-avatar>

    <v-rating v-model="userRating" color="amber" half-increments size="32" />
    <p class="rate-label">Rate this book</p>
    <p v-if="ratingError" class="rate-error">Please select a rating before submitting.</p>

    <template v-if="showReviewText">
      <v-btn class="mt-2" color="brown" variant="flat" @click="submit">Save</v-btn>
      <v-textarea v-model="reviewText" auto-grow class="mt-4" variant="solo" />
      <p v-if="reviewTextError" class="rate-error">Review must be at least 3 characters.</p>
    </template>
    <v-btn
      v-else
      class="mt-2"
      color="brown"
      variant="flat"
      @click="showReviewText = true"
    >
      Write a review
    </v-btn>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { resolveUrl } from '@/utils/url';
  import { useAwardModalStore } from '@/store/awardModalStore';

  const awardModalStore = useAwardModalStore();

  const props = defineProps<{
    avatarUrl: string | null;
    routeId: string;
    bookId: string;
  }>();

  const emit = defineEmits<{ saved: [] }>();

  const userRating = ref(0);
  const reviewText = ref('');
  const showReviewText = ref(false);
  const ratingError = ref(false);
  const reviewTextError = ref(false);

  const avatarSrc = computed(() =>
    props.avatarUrl ? resolveUrl(props.avatarUrl) : 'http://localhost:3000/uploads/avatars/default_ava.jpg'
  );

  const API = 'http://localhost:3000/api';
  const token = localStorage.getItem('accessToken') || '';

  async function submit () {
    if (!userRating.value) {
      ratingError.value = true;
      return;
    }
    ratingError.value = false;

    if (showReviewText.value && reviewText.value.length < 3) {
      reviewTextError.value = true;
      return;
    }
    reviewTextError.value = false;

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

      for (const badge of (data.newBadges ?? [])) {
        awardModalStore.show({
          description: badge.Name,
          image: badge.ImageUrl || badge.IconUrl || '/images/award_1.webp',
        });
      }
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

  .rate-error {
    font-size: 0.85rem;
    color: #c62828;
    margin-top: 4px;
  }
}
</style>
