<template>
  <v-card class="pa-4" color="#C9788A" elevation="0" rounded="xl">
    <p v-if="currentBook" class="text-caption font-weight-bold mb-3" style="color: rgba(255,255,255,0.7);">
      Book of the month
    </p>

    <div v-if="currentBook">
      <div class="d-flex ga-3 mb-3">
        <v-img
          rounded="lg"
          :src="resolveUrl(currentBook.CoverUrl)"
          style="flex-shrink: 0; width: 88px;"
        />
        <div class="flex-grow-1">
          <p class="text-body-2 font-weight-bold text-white">{{ currentBook.Title }}</p>
          <p class="text-caption text-white" style="opacity: 0.8;">{{ currentBook.Author }}</p>
          <v-chip class="mt-2" color="#4A7A4A" size="x-small" variant="flat">
            {{ currentBook.DaysLeft > 0 ? `${currentBook.DaysLeft} days left` : 'Ended' }}
          </v-chip>
        </div>
      </div>

      <!-- Reading period -->
      <div class="mb-3">
        <div class="d-flex justify-space-between text-caption text-white mb-1" style="opacity: 0.8;">
          <span>Reading period</span>
          <span>{{ readingProgress }}%</span>
        </div>
        <v-progress-linear
          bg-color="rgba(255,255,255,0.3)"
          color="white"
          height="4"
          :model-value="readingProgress"
          rounded
        />
        <div class="d-flex justify-space-between text-caption text-white mt-1" style="opacity: 0.6;">
          <span>{{ formatDate(currentBook.StartDate) }}</span>
          <span>{{ formatDate(currentBook.EndDate) }}</span>
        </div>
      </div>

      <!-- Your rating -->
      <div class="mb-2">
        <p class="text-caption text-white mb-1" style="opacity: 0.8;">Your rating</p>
        <v-rating
          :model-value="modelValue"
          color="white"
          empty-icon="mdi-star-outline"
          full-icon="mdi-star"
          half-icon="mdi-star-half-full"
          hover
          :length="5"
          size="20"
          @update:model-value="$emit('update:modelValue', $event); $emit('rate')"
        />
      </div>

      <!-- Club average -->
      <v-card class="pa-2" elevation="0" rounded="lg" style="background: rgba(0,0,0,0.15);">
        <div class="d-flex align-center justify-space-between">
          <p class="text-caption text-white" style="opacity: 0.8;">Club average</p>
          <div class="text-right">
            <p class="text-body-2 font-weight-bold text-white">
              {{ currentBook.AverageRating ? currentBook.AverageRating.toFixed(1) : '—' }} / 5
            </p>
            <p class="text-caption text-white" style="opacity: 0.6;">
              {{ currentBook.RatingsCount }} ratings
            </p>
          </div>
        </div>
      </v-card>
    </div>

    <div v-else class="text-center py-4">
      <v-icon color="white" size="36" style="opacity: 0.5;">mdi-book-open-variant</v-icon>
      <p class="text-caption text-white mt-2" style="opacity: 0.7;">No book selected for this month</p>
    </div>

    <v-btn
      v-if="isAdmin"
      block
      class="mt-4"
      color="rgba(0,0,0,0.3)"
      rounded="lg"
      style="color: white;"
      variant="flat"
      @click="$emit('choose-book')"
    >
      Choose the next book
    </v-btn>
    <v-btn
      v-else-if="isMember"
      block
      class="mt-4"
      color="rgba(0,0,0,0.3)"
      rounded="lg"
      style="color: white;"
      variant="flat"
      @click="$emit('leave')"
    >
      Leave the club
    </v-btn>
    <v-btn
      v-else
      block
      class="mt-4"
      color="rgba(0,0,0,0.3)"
      rounded="lg"
      style="color: white;"
      variant="flat"
      @click="$emit('join')"
    >
      Join the club
    </v-btn>
  </v-card>
</template>

<script setup lang="ts">
  import type { CurrentBook } from '@/types/club';
  import { resolveUrl } from '@/utils/url';

  defineProps<{
    currentBook: CurrentBook | null
    readingProgress: number
    modelValue: number
    isAdmin: boolean
    isMember: boolean
  }>();

  defineEmits<{
    'update:modelValue': [value: number]
    rate: []
    'choose-book': []
    leave: []
    join: []
  }>();

  function formatDate (dateStr: string): string {
    return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
</script>
