<template>
  <Header />

  <v-container v-if="book" class="book-page" fluid>
    <v-row v-if="book" class="book-header" no-gutters>
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
          <p>{{ showMore ? book.Description : truncatedDescription }}</p>
          <a class="show-toggle" @click="showMore = !showMore">
            {{ showMore ? 'Show less' : 'Show more' }}
          </a>
        </div>

        <div v-if="book.Tags?.length" class="tags">
          <v-chip
            v-for="tag in book.Tags"
            :key="tag"
            class="tag"
            color="pink-lighten-3"
          >
            {{ tag }}
          </v-chip>
        </div>
      </v-col>
    </v-row>

    <div v-if="user" class="rate-section text-center">
      <h3>What do you think?</h3>
      <v-avatar class="my-4" size="64">
        <img alt="User avatar" :src="user.AvatarUrl || ''">
      </v-avatar>

      <v-rating v-model="userRating" color="amber" half-increments size="32" />
      <p class="rate-label">Rate this book</p>

      <v-btn
        v-if="showReviewText"
        class="mt-2"
        color="brown"
        variant="flat"
        @click="saveReview"
      >Save</v-btn>
      <v-btn
        v-else
        class="mt-2"
        color="brown"
        variant="flat"
        @click="showReviewText = true"
      >Write a review</v-btn>

      <v-textarea
        v-if="showReviewText"
        v-model="reviewText"
        auto-grow
        class="mt-4"
        name="input-7-1"
        variant="solo"
      />
    </div>

    <div v-if="reviews.length" class="review-section">
      <h3>Reviews</h3>
      <div v-for="review in reviews" :key="review.Id" class="review-card">
        <v-avatar class="me-4" size="48">
          <img :src="review.UserAvatar" />
        </v-avatar>
        <div>
          <div class="review-header">
            <strong>{{ review.UserName }}</strong>
            <v-rating
              color="amber"
              dense
              half-increments
              :model-value="review.Rating"
              readonly
            />
          </div>
          <p>{{ showFull[review.Id] ? review.ReviewText : truncate(review.ReviewText, 180) }}</p>
          <a class="show-toggle" @click="toggleShowMore(review.Id)">
            {{ showFull[review.Id] ? 'Show less' : 'Show more' }}
          </a>
        </div>
      </div>
    </div>
  </v-container>

  <Footer />
</template>
<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import { useRoute } from 'vue-router';
  import { useUserStore } from '@/store/user';
  import { storeToRefs } from 'pinia';
  import Header from '@/components/Header.vue';
  import Footer from '@/components/Footer.vue';
  import type { Review } from '@/types/general.interface';

  const route = useRoute();
  const bookId = route.params.id as string;
  const routeId = route.query.routeId as string;
  const API = 'http://localhost:3000/api';
  const token = localStorage.getItem('accessToken') || '';
  const reviews = ref<Review[]>([]);
  const { user } = storeToRefs(useUserStore());

  const book = ref<any>(null);
  const userRating = ref(0);
  const reviewText = ref('');
  const showReviewText = ref(false);
  const showMore = ref(false);
  const showFull = ref<{ [id: string]: boolean }>({});

  const loadBook = async () => {
    try {
      const res = await fetch(`${API}/books/${bookId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();

      book.value = {
        Id: data.Id,
        Title: data.Title,
        Author: data.Author,
        Description: data.Description || '',
        CoverUrl: data.CoverUrl?.startsWith('/uploads')
          ? `http://localhost:3001${data.CoverUrl}`
          : data.CoverUrl,
        Rating: data.AverageRating || 0,
        RatingCount: data.RatingCount || 0,
        ReviewCount: data.ReviewCount || 0,
        Tags: data.Tags || [],
      };
    } catch (err) {
      console.error('[Book Page] Failed to load book:', err);
    }
  };

  const truncatedDescription = computed(() =>
    book.value?.Description.length > 300
      ? book.value.Description.slice(0, 300) + '...'
      : book.value.Description
  );
  const getReviews = async () => {
    try {
      const res = await fetch(`${API}/books/${bookId}/reviews`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const raw = await res.json();

      console.log('[getReviews] Raw response:', raw);

      reviews.value = [...raw]
      console.log('[getReviews] Parsed reviews:', reviews.value);
    } catch (err) {
      console.error('[Book Page] Failed to load reviews:', err);
    }
  };

  onMounted(async () => {
    await loadBook();
    await getReviews();
  });

  function toggleShowMore (id: string) {
    showFull.value[id] = !showFull.value[id];
  }

  function truncate (str: string, len: number) {
    return str.length > len ? str.slice(0, len) + '...' : str;
  }

  async function saveReview () {
    try {

      if (!routeId || !book.value?.Id) {
        throw new Error('Missing routeId or bookId');
      }

      const url = `${API}/user/routes/${routeId}/book/${book.value.Id}/review`;
      const payload = {
        rating: userRating.value,
        reviewText: reviewText.value,
      };

      console.log('[Review] Submitting to:', url);
      console.log('[Review] Payload:', payload);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('[Review] Server response:', response.status, data);

      if (!response.ok) throw new Error(data.message || 'Failed to submit review');

      showReviewText.value = false;
      reviewText.value = '';
      userRating.value = 0;

      await loadBook(); // перезавантажити дані книги після успішного відгуку
      await getReviews(); // перезавантажити відгуки
    } catch (err) {
      console.error('[Review] Error submitting review:', err);
    }
  }

</script>

<style scoped lang="scss">
.book-page {
  padding: 40px;

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

        .rating-score {
          font-weight: bold;
        }

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

  .review-section {
    .review-card {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      background: #f0efed;
      padding: 20px;
      border-radius: 10px;
      margin-bottom: 16px;

      .review-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
      }

      .show-toggle {
        font-size: 0.85rem;
        color: #8d6e63;
        cursor: pointer;
      }
    }
  }
}
</style>
