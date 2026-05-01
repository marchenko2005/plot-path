<template>
  <v-card
    color="white"
    elevation="0"
    rounded="xl"
    style="width: 160px; cursor: pointer;"
    @click="$router.push(`/clubs/${id}`)"
  >
    <div
      class="d-flex align-center justify-center"
      style="height: 240px; background: linear-gradient(135deg, #D27487, #4A2B33); border-radius: 12px 12px 0 0; overflow: hidden;"
    >
      <v-img
        v-if="resolveUrl(avatarUrl)"
        cover
        height="240"
        :src="resolveUrl(avatarUrl)"
      />
      <v-icon v-else color="white" size="36">mdi-book-open-variant</v-icon>
    </div>
    <v-card-text class="pa-3">
      <p class="text-body-2 font-weight-bold text-truncate">{{ name }}</p>
      <p class="text-caption text-medium-emphasis">
        {{ memberCount }} members<template v-if="role"> · {{ role === 'admin' ? 'Admin' : 'Member' }}</template>
      </p>
      <p v-if="description" class="text-caption mt-1 text-truncate opacity-70">{{ description }}</p>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
  import { resolveUrl } from '@/utils/url';

  defineProps<{
    id: string
    name: string
    avatarUrl: string | null
    memberCount: number
    role?: string
    description?: string | null
  }>();
</script>
