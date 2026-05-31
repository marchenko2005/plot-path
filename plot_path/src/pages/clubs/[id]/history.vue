<template>
  <div style="background: #f2eaea; min-height: 100vh;">
    <ClubsToolbar breadcrumb />

    <div v-if="loading" class="d-flex justify-center align-center" style="height: 60vh;">
      <v-progress-circular color="primary" indeterminate />
    </div>

    <div v-else-if="forbidden" class="d-flex justify-center align-center" style="height: 60vh;">
      <p class="text-body-2 text-medium-emphasis">You must be a club member to view its history.</p>
    </div>

    <div v-else class="pa-6" style="max-width: 1100px; margin: 0 auto;">
      <div class="d-flex align-center ga-3 mb-6">
        <v-btn
          color="#4A2B33"
          density="compact"
          :to="`/clubs/${clubId}`"
          variant="text"
        >
          <v-icon start>mdi-arrow-left</v-icon>
          Back to club
        </v-btn>
        <h2 class="text-h6 font-weight-bold" style="color: #1e1012;">
          Reading History
          <span v-if="history.length" class="text-caption font-weight-regular text-medium-emphasis ml-1">
            {{ history.length }} {{ history.length === 1 ? 'book' : 'books' }}
          </span>
        </h2>
      </div>

      <div v-if="!history.length" class="text-center py-12">
        <v-icon color="medium-emphasis" size="48">mdi-book-open-page-variant-outline</v-icon>
        <p class="text-body-2 text-medium-emphasis mt-3">No books completed yet.</p>
      </div>

      <div v-else class="history-grid">
        <v-card
          v-for="entry in history"
          :key="entry.Id"
          elevation="0"
          rounded="xl"
          style="background: #fff; overflow: hidden;"
        >
          <div class="d-flex">
            <router-link :to="`/books/0/${entry.BookId}`" style="flex-shrink: 0;">
              <v-img
                cover
                height="160"
                :src="resolveUrl(entry.CoverUrl)"
                width="110"
              >
                <template #error>
                  <div class="d-flex align-center justify-center bg-grey-lighten-3" style="height: 100%; width: 110px;">
                    <v-icon color="grey">mdi-book-outline</v-icon>
                  </div>
                </template>
              </v-img>
            </router-link>

            <div class="pa-4 d-flex flex-column justify-space-between" style="flex: 1; min-width: 0;">
              <div>
                <router-link
                  class="text-body-1 font-weight-bold text-decoration-none"
                  style="color: #1e1012; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
                  :to="`/books/0/${entry.BookId}`"
                >
                  {{ entry.Title }}
                </router-link>
                <p class="text-caption text-medium-emphasis mt-1">{{ entry.Author }}</p>
              </div>

              <div>
                <div v-if="entry.AverageRating" class="d-flex align-center ga-1 mb-2">
                  <v-icon
                    v-for="star in 5"
                    :key="star"
                    :color="star <= Math.round(entry.AverageRating) ? '#AA9E54' : '#e0e0e0'"
                    size="16"
                  >
                    mdi-star
                  </v-icon>
                  <span class="text-caption ml-1" style="color: #7B5B65;">
                    {{ entry.AverageRating.toFixed(1) }}
                  </span>
                </div>
                <p v-else class="text-caption text-medium-emphasis mb-2">No rating</p>

                <p class="text-caption" style="color: #7B5B65;">
                  {{ formatDate(entry.StartDate) }} – {{ formatDate(entry.EndDate) }}
                </p>
                <p class="text-caption text-medium-emphasis">
                  Completed {{ formatDate(entry.CompletedAt) }}
                </p>
              </div>
            </div>
          </div>
        </v-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { useRoute } from 'vue-router';
  import { apiFetch } from '@/plugins/api';
  import { resolveUrl } from '@/utils/url';

  interface HistoryEntry {
    Id: string
    BookId: string
    Title: string
    Author: string
    CoverUrl: string | null
    AverageRating: number | null
    StartDate: string
    EndDate: string
    CompletedAt: string
  }

  const route = useRoute();
  const clubId = route.params.id as string;

  const history = ref<HistoryEntry[]>([]);
  const loading = ref(true);
  const forbidden = ref(false);

  function formatDate (dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  onMounted(async () => {
    try {
      history.value = await apiFetch(`/clubs/${clubId}/history`) as HistoryEntry[];
    } catch (err: any) {
      if (err?.message?.includes('Members only') || err?.message?.includes('403')) {
        forbidden.value = true;
      }
    } finally {
      loading.value = false;
    }
  });
</script>

<style scoped lang="scss">
.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
}
</style>
