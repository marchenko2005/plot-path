<template>
  <div>
    <h2 class="text-h6 font-weight-bold mb-4">Discover Clubs</h2>
    <v-text-field
      v-model="searchQuery"
      clearable
      density="compact"
      hide-details
      placeholder="Search public clubs..."
      prepend-inner-icon="mdi-magnify"
      rounded="lg"
      style="max-width: 480px;"
      variant="outlined"
      @click:clear="clearSearch"
      @input="debouncedSearch"
    />
    <div v-if="searchResults.length" class="d-flex flex-wrap ga-4 mt-4">
      <ClubCard
        v-for="club in searchResults"
        :key="club.Id"
        :avatar-url="club.AvatarUrl"
        :description="club.Description"
        :id="club.Id"
        :member-count="club.MemberCount"
        :name="club.Name"
      />
    </div>
    <p v-else-if="searched && !searchResults.length" class="text-medium-emphasis text-body-2 mt-4">
      No public clubs found.
    </p>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { apiFetch } from '@/plugins/api';
  import type { PublicClub } from '@/types/club';

  const searchQuery = ref('');
  const searchResults = ref<PublicClub[]>([]);
  const searched = ref(false);
  let searchTimer: ReturnType<typeof setTimeout> | null = null;

  function debouncedSearch () {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(runSearch, 400);
  }

  function clearSearch () {
    searchQuery.value = '';
    runSearch();
  }

  async function runSearch () {
    try {
      const data = await apiFetch(
        `/clubs/search?q=${encodeURIComponent(searchQuery.value)}&page=1`,
      ) as PublicClub[];
      searchResults.value = data;
      searched.value = true;
    } catch (err) {
      console.error('[clubs] search error:', err);
    }
  }

  runSearch();
</script>
