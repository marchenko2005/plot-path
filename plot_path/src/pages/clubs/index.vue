<template>
  <div style="background: #f2eaea; min-height: 100vh;">
    <v-toolbar color="secondary" flat>
      <v-icon class="ml-4 mr-2" color="white" size="22">mdi-book-open-variant</v-icon>
      <v-toolbar-title class="text-white font-weight-bold text-body-1">PlotPath · Book Clubs</v-toolbar-title>
      <v-spacer />
      <NotificationBell />
      <UserAvatarMenu v-if="menuUser" :user="menuUser" @logout="handleLogout" />
    </v-toolbar>

    <div class="pa-6 pa-sm-8" style="max-width: 1200px; margin: 0 auto;">

      <!-- Join by invite code -->
      <v-card class="mb-8 pa-5" color="white" elevation="0" rounded="xl">
        <p class="text-subtitle-2 font-weight-bold mb-3">Join a club with an invite code</p>
        <div class="d-flex align-center ga-3" style="max-width: 440px;">
          <v-text-field
            v-model="inviteCode"
            density="compact"
            hide-details
            placeholder="Enter invite code..."
            rounded="lg"
            variant="outlined"
            @keydown.enter="joinByCode"
          />
          <v-btn color="secondary" :loading="joining" rounded="lg" @click="joinByCode">Join</v-btn>
        </div>
        <p v-if="joinError" class="text-caption text-error mt-2">{{ joinError }}</p>
      </v-card>

      <!-- My Clubs -->
      <div class="mb-8">
        <div class="d-flex align-center justify-space-between mb-4">
          <h2 class="text-h6 font-weight-bold">My Clubs</h2>
          <v-btn color="primary" prepend-icon="mdi-plus" rounded="lg" to="/clubs/create">New Club</v-btn>
        </div>
        <div v-if="myClubs.length" class="d-flex flex-wrap ga-4">
          <v-card
            v-for="club in myClubs"
            :key="club.Id"
            color="white"
            elevation="0"
            rounded="xl"
            style="width: 160px; cursor: pointer;"
            @click="$router.push(`/clubs/${club.Id}`)"
          >
            <div
              class="d-flex align-center justify-center"
              style="height: 240px; background: linear-gradient(135deg, #D27487, #4A2B33); border-radius: 12px 12px 0 0; overflow: hidden;"
            >
              <v-img
                v-if="resolveUrl(club.AvatarUrl)"
                :src="resolveUrl(club.AvatarUrl)"
                cover
                height="240"
              />
              <v-icon v-else color="white" size="36">mdi-book-open-variant</v-icon>
            </div>
            <v-card-text class="pa-3">
              <p class="text-body-2 font-weight-bold text-truncate">{{ club.Name }}</p>
              <p class="text-caption text-medium-emphasis">
                {{ club.MemberCount }} members · {{ club.Role === 'admin' ? 'Admin' : 'Member' }}
              </p>
            </v-card-text>
          </v-card>
        </div>
        <p v-else class="text-medium-emphasis text-body-2">
          You haven't joined any clubs yet. Create one or use an invite code!
        </p>
      </div>

      <!-- Discover Clubs -->
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
          @input="debouncedSearch"
          @click:clear="clearSearch"
        />
        <div v-if="searchResults.length" class="d-flex flex-wrap ga-4 mt-4">
          <v-card
            v-for="club in searchResults"
            :key="club.Id"
            color="white"
            elevation="0"
            rounded="xl"
            style="width: 160px; cursor: pointer;"
            @click="$router.push(`/clubs/${club.Id}`)"
          >
            <div
              class="d-flex align-center justify-center"
              style="height: 240px; background: linear-gradient(135deg, #D27487, #4A2B33); border-radius: 12px 12px 0 0; overflow: hidden;"
            >
              <v-img
                v-if="resolveUrl(club.AvatarUrl)"
                :src="resolveUrl(club.AvatarUrl)"
                cover
                height="240"
              />
              <v-icon v-else color="white" size="36">mdi-book-open-variant</v-icon>
            </div>
            <v-card-text class="pa-3">
              <p class="text-body-2 font-weight-bold text-truncate">{{ club.Name }}</p>
              <p class="text-caption text-medium-emphasis">{{ club.MemberCount }} members</p>
              <p v-if="club.Description" class="text-caption mt-1 text-truncate opacity-70">{{ club.Description }}</p>
            </v-card-text>
          </v-card>
        </div>
        <p v-else-if="searched && !searchResults.length" class="text-medium-emphasis text-body-2 mt-4">
          No clubs found.
        </p>
        <p v-else-if="!searchQuery" class="text-medium-emphasis text-body-2 mt-4">
          Type to search public clubs.
        </p>
      </div>
    </div>

    <p class="text-center text-caption text-medium-emphasis py-6">© 2025 PlotPath All Rights Reserved</p>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { apiFetch } from '@/plugins/api';
  import { connectSocket, getSocket } from '@/plugins/socket';

  interface MyClub {
    Id: string;
    Name: string;
    AvatarUrl: string | null;
    IsPublic: boolean;
    Role: string;
    MemberCount: number;
  }

  interface PublicClub {
    Id: string;
    Name: string;
    Description: string | null;
    AvatarUrl: string | null;
    MemberCount: number;
  }

  interface StoredUser {
    username: string;
    email: string;
    AvatarUrl: string | null;
  }

  const router = useRouter();
  const myClubs = ref<MyClub[]>([]);
  const searchResults = ref<PublicClub[]>([]);
  const searchQuery = ref('');
  const searched = ref(false);
  const inviteCode = ref('');
  const joining = ref(false);
  const joinError = ref('');
  const myId = ref('');
  const currentUser = ref<StoredUser | null>(null);

  const menuUser = computed(() => currentUser.value && myId.value ? {
    id: myId.value,
    username: currentUser.value.username,
    email: currentUser.value.email,
    AvatarUrl: currentUser.value.AvatarUrl,
  } : null);

  function handleLogout () {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    router.push('/');
  }

  function resolveUrl (url: string | null): string {
    if (!url) return '';
    if (url.startsWith('/uploads')) return `http://localhost:3000${url}`;
    return url;
  }

  let searchTimer: ReturnType<typeof setTimeout> | null = null;

  function debouncedSearch () {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(runSearch, 400);
  }

  function clearSearch () {
    searchQuery.value = '';
    searchResults.value = [];
    searched.value = false;
  }

  async function runSearch () {
    if (!searchQuery.value.trim()) {
      searchResults.value = [];
      searched.value = false;
      return;
    }
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

  async function joinByCode () {
    const code = inviteCode.value.trim();
    if (!code) return;
    joining.value = true;
    joinError.value = '';
    try {
      const data = await apiFetch(`/clubs/join/${encodeURIComponent(code)}`, { method: 'POST' }) as { clubId: string };
      getSocket()?.emit('club:join_room', { clubId: data.clubId });
      router.push(`/clubs/${data.clubId}`);
    } catch (err: any) {
      joinError.value = err.message || 'Failed to join club';
    } finally {
      joining.value = false;
    }
  }

  onMounted(async () => {
    const stored = localStorage.getItem('user');
    if (stored) currentUser.value = JSON.parse(stored);
    const token = localStorage.getItem('accessToken');
    if (token) connectSocket(token);
    try {
      const profileData = await apiFetch('/user/profile') as { user: { Id: string } };
      myId.value = profileData.user.Id;
      myClubs.value = await apiFetch('/clubs/my') as MyClub[];
    } catch (err) {
      console.error('[clubs] init error:', err);
    }
  });
</script>
