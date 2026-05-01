<template>
  <div class="bg-white" style="border-bottom: 1px solid #eee;">
    <div class="px-4 py-3 d-flex align-center justify-space-between flex-wrap" style="gap: 12px; max-width: 1200px; margin: 0 auto;">
      <div class="d-flex align-center ga-3">
        <v-avatar color="secondary" size="44">
          <v-img v-if="resolveUrl(club.AvatarUrl)" cover :src="resolveUrl(club.AvatarUrl)" />
          <v-icon v-else color="white">mdi-book-open-variant</v-icon>
        </v-avatar>
        <div class="d-flex align-center ga-2">
          <span class="text-subtitle-1 font-weight-bold">{{ club.Name }}</span>
          <span class="text-caption text-medium-emphasis">· {{ club.IsPublic ? 'Public' : 'Private' }}</span>
          <v-icon color="medium-emphasis" size="18">mdi-book-open-outline</v-icon>
          <v-btn density="compact" icon size="small" variant="text" @click="$emit('copy-invite')">
            <v-icon size="18">mdi-export-variant</v-icon>
          </v-btn>
          <v-btn
            v-if="isAdmin"
            density="compact"
            icon
            size="small"
            variant="text"
            @click="$router.push(`/clubs/${club.Id}/edit`)"
          >
            <v-icon size="18">mdi-square-edit-outline</v-icon>
          </v-btn>
        </div>
      </div>

      <div class="d-flex align-center ga-2">
        <div class="d-flex">
          <v-avatar
            v-for="(member, i) in club.members.slice(0, 4)"
            :key="member.Id"
            size="28"
            :style="`margin-left: ${i > 0 ? '-8px' : 0}; z-index: ${10 - i};`"
          >
            <v-img v-if="resolveUrl(member.AvatarUrl)" cover :src="resolveUrl(member.AvatarUrl)" />
            <v-avatar v-else color="secondary" size="28">
              <span class="text-caption text-white">{{ member.Username[0] }}</span>
            </v-avatar>
          </v-avatar>
        </div>
        <span class="text-caption text-medium-emphasis">{{ club.MemberCount }} members</span>
        <v-btn
          v-if="!isAdmin"
          color="error"
          density="compact"
          size="small"
          variant="outlined"
          @click="$emit('leave')"
        >
          Leave
        </v-btn>
      </div>
    </div>
  </div>

  <div class="bg-white" style="border-bottom: 1px solid #eee;">
    <div class="px-4 py-2 d-flex flex-wrap ga-2" style="max-width: 1200px; margin: 0 auto;">
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
  </div>
</template>

<script setup lang="ts">
  import type { Club } from '@/types/club';
  import { resolveUrl } from '@/utils/url';

  defineProps<{ club: Club; isAdmin: boolean }>();
  defineEmits<{ 'copy-invite': []; leave: [] }>();
</script>
