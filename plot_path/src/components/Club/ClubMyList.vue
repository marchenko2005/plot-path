<template>
  <div class="mb-8">
    <div class="d-flex align-center justify-space-between mb-4">
      <h2 class="text-h6 font-weight-bold">My Clubs</h2>
      <v-btn color="primary" prepend-icon="mdi-plus" rounded="lg" to="/clubs/create">New Club</v-btn>
    </div>
    <div v-if="clubs.length" class="d-flex flex-wrap ga-4">
      <ClubCard
        v-for="club in clubs"
        :key="club.Id"
        :avatar-url="club.AvatarUrl"
        :id="club.Id"
        :member-count="club.MemberCount"
        :name="club.Name"
        :role="club.Role"
      />
    </div>
    <p v-else class="text-medium-emphasis text-body-2">
      You haven't joined any clubs yet. Create one or use an invite code!
    </p>
  </div>
</template>

<script setup lang="ts">
  import type { MyClub } from '@/types/club';

  defineProps<{ clubs: MyClub[] }>();
</script>
