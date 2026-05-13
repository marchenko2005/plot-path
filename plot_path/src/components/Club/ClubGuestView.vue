<template>
  <div class="d-flex justify-center align-start pa-6" style="min-height: 80vh; background: #EDE8E0;">
    <v-card elevation="0" rounded="xl" style="width: 100%; max-width: 560px; background: #CF8A96;">
      <!-- Cover + name -->
      <v-img
        v-if="resolveUrl(club.AvatarUrl)"
        cover
        height="220"
        rounded="t-xl"
        :src="resolveUrl(club.AvatarUrl)"
      />
      <div v-else class="d-flex align-center justify-center rounded-t-xl" style="height: 220px; background: #7B5B65;">
        <v-icon color="white" size="64" style="opacity: 0.5;">mdi-book-open-variant</v-icon>
      </div>

      <div class="pa-6">
        <div class="d-flex align-center ga-2 mb-1">
          <h1 class="text-h5 font-weight-bold" style="color: #1e1012;">{{ club.Name }}</h1>
          <v-chip :color="club.IsPublic ? '#4A7A4A' : '#7B5B65'" size="x-small" variant="flat">
            {{ club.IsPublic ? 'Public' : 'Private' }}
          </v-chip>
        </div>

        <p class="text-caption mb-4" style="color: #3a1e24;">{{ club.MemberCount }} members</p>

        <div class="d-flex flex-wrap ga-2 mb-4">
          <v-chip
            v-for="tag in club.tags"
            :key="tag.Id"
            color="#AA9E54"
            rounded="lg"
            size="small"
            variant="flat"
          >
            {{ tag.Name }}
          </v-chip>
        </div>

        <p v-if="club.Description" class="text-body-2 mb-6" style="color: #1e1012;">
          {{ club.Description }}
        </p>

        <!-- Current book -->
        <template v-if="club.currentBook">
          <p class="text-caption font-weight-bold mb-2" style="color: rgba(30,16,18,0.6);">Currently reading</p>
          <v-card class="d-flex align-center ga-3 pa-3 mb-6" elevation="0" rounded="lg" style="background: rgba(0,0,0,0.12);">
            <v-img
              cover
              rounded="lg"
              :src="resolveUrl(club.currentBook.CoverUrl)"
              style="flex-shrink: 0; max-width: 160px; aspect-ratio: 2 / 3;"
            />
            <div>
              <p class="text-body-2 font-weight-bold text-white">{{ club.currentBook.Title }}</p>
              <p class="text-caption text-white" style="opacity: 0.8;">{{ club.currentBook.Author }}</p>
              <v-chip class="mt-1" color="#4A7A4A" size="x-small" variant="flat">
                {{ club.currentBook.DaysLeft > 0 ? `${club.currentBook.DaysLeft} days left` : 'Ended' }}
              </v-chip>
            </div>
          </v-card>
        </template>

        <v-btn
          block
          color="#2c1a1e"
          :loading="joining"
          rounded="lg"
          style="color: white;"
          @click="$emit('join')"
        >
          Join the club
        </v-btn>
      </div>
    </v-card>
  </div>
</template>

<script setup lang="ts">
  import type { Club } from '@/types/club';
  import { resolveUrl } from '@/utils/url';

  defineProps<{ club: Club; joining: boolean }>();
  defineEmits<{ join: [] }>();
</script>
