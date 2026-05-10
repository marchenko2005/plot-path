<template>
  <div class="review-section">
    <h3>Reviews</h3>
    <div v-for="review in reviews" :key="review.Id" class="review-card">
      <v-avatar class="me-4 clickable" size="48" @click="navigateToUser(review.UserId)">
        <img
          :alt="review.UserName"
          :src="review.UserAvatar
            ? `http://localhost:3001${review.UserAvatar}`
            : 'http://localhost:3001/uploads/avatars/default_ava.jpg'"
        >
      </v-avatar>
      <div>
        <div class="review-header">
          <strong class="clickable" @click="navigateToUser(review.UserId)">{{ review.UserName }}</strong>
          <v-rating
            color="amber"
            dense
            half-increments
            :model-value="review.Rating"
            readonly
          />
        </div>
        <p>{{ showFull[review.Id] ? review.ReviewText : truncate(review.ReviewText, 100) }}</p>
        <a v-if="review.ReviewText.length > 100" class="show-toggle" @click="toggle(review.Id)">
          {{ showFull[review.Id] ? 'Show less' : 'Show more' }}
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import type { Review } from '@/types/general.interface';
  import { useUserStore } from '@/store/user';

  const router = useRouter();
  const userStore = useUserStore();

  onMounted(() => {
    if (!userStore.user) userStore.fetchProfile();
  });

  defineProps<{ reviews: Review[] }>();

  function navigateToUser (userId: string) {
    console.log(userStore.user?.Id, userId);

    if (userStore.user?.Id === userId) {
      router.push('/profile');
    } else {
      router.push(`/users/${userId}`);
    }
  }

  const showFull = ref<Record<string, boolean>>({});

  function toggle (id: string) {
    showFull.value[id] = !showFull.value[id];
  }

  function truncate (str: string, len: number) {
    return str.length > len ? str.slice(0, len) + '...' : str;
  }
</script>

<style scoped lang="scss">
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

.clickable {
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
}
</style>
