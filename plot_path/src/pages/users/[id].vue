<template>
  <Header />
  <div class="user-page">
    <div v-if="loading" class="loading-state">
      <v-progress-circular color="primary" indeterminate />
    </div>

    <div v-else-if="error" class="error-state">
      <v-icon color="grey" size="48">mdi-account-off-outline</v-icon>
      <p>{{ error }}</p>
    </div>

    <template v-else-if="profile">
      <v-container fluid>
        <v-row class="main-row">
          <!-- Left: profile card -->
          <v-col cols="12" md="4">
            <div class="profile-card">
              <v-avatar class="avatar" size="90">
                <img
                  :alt="profile.user.Username"
                  :src="profile.user.AvatarUrl
                    ? `http://localhost:3001${profile.user.AvatarUrl}`
                    : 'http://localhost:3001/uploads/avatars/default_ava.jpg'"
                >
              </v-avatar>

              <div class="username">{{ profile.user.Username }}</div>

              <div class="actions">
                <v-btn
                  class="action-btn"
                  :disabled="friendshipStatus === 'friends' || friendshipLoading"
                  :loading="friendshipLoading"
                  rounded
                  variant="outlined"
                  @click="handleFriendAction"
                >{{ friendBtnLabel }}</v-btn>
                <v-btn class="action-btn action-btn--filled" rounded variant="flat" @click="router.push(`/chat?with=${profile.user.Id}`)">Message</v-btn>
              </div>

              <div v-if="profile.tags.length" class="info-row">
                <span class="info-label">Interests:</span>
                <span class="info-value">{{ profile.tags.map(t => t.Name).join(', ') }}</span>
              </div>

              <div class="info-section">
                <div class="info-label">Book Clubs:</div>
                <div v-if="bookClubs.length === 0" class="info-empty">No book clubs yet</div>
                <div v-for="club in bookClubs" :key="club.id" class="club-row">
                  <v-avatar size="36">
                    <img :alt="club.name" :src="club.imageUrl ?? '/uploads/avatars/default_ava.jpg'">
                  </v-avatar>
                  <span>{{ club.name }}</span>
                </div>
              </div>
            </div>
          </v-col>

          <!-- Right: friends + awards -->
          <v-col cols="12" md="8">
            <ProfileFriends class="mb-4" :friends="friends" />
            <ProfileAwards :awards="awards" />
          </v-col>
        </v-row>
      </v-container>

      <!-- Active route carousel -->
      <RouteOfTheMonth
        v-if="routeBooks.length"
        background-color="#fff"
        background-color-books="#E8A0A8"
        :books="routeBooks"
        :subtitle="profile.activeRoutes[0]?.Name"
      />

      <Footer />
    </template>
  </div>

  <v-snackbar
    color="error"
    location="bottom"
    :model-value="!!friendshipError"
    timeout="4000"
    @update:model-value="val => { if (!val) friendshipError = '' }"
  >
    {{ friendshipError }}
  </v-snackbar>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { apiFetch } from '@/plugins/api';
  import ProfileAwards from '@/components/Profile/ProfileAwards.vue';
  import type { DisplayBadge } from '@/components/Profile/ProfileAwards.vue';
  import ProfileFriends from '@/components/Profile/ProfileFriends.vue';
  import type { Friend } from '@/components/Profile/ProfileFriends.vue';
  import type { Book } from '@/types/general.interface';

  interface BookClub { id: string; name: string; imageUrl: string | null }

  type FriendshipStatus = 'none' | 'friends' | 'request_sent' | 'request_received';

  interface PublicProfile {
    user: { Id: string; Username: string; AvatarUrl: string | null; Age: number | null };
    badges: { Name: string; Description: string; ImageUrl: string | null }[];
    tags: { Id: string; Name: string; Type: string }[];
    activeRoutes: { Id: string; Name: string }[];
    friendshipStatus: FriendshipStatus;
    friendRequestId: string | null;
    friends: { Id: string; Username: string; AvatarUrl: string | null }[];
  }

  const route = useRoute();
  const router = useRouter();
  const profile = ref<PublicProfile | null>(null);
  const loading = ref(true);
  const error = ref('');
  const routeBooks = ref<Book[]>([]);
  const friendshipStatus = ref<FriendshipStatus>('none');
  const friendRequestId = ref<string | null>(null);
  const friendshipLoading = ref(false);
  const friendshipError = ref('');

  const friendBtnLabel = computed(() => {
    if (friendshipStatus.value === 'friends') return 'Friends';
    if (friendshipStatus.value === 'request_sent') return 'Cancel Request';
    if (friendshipStatus.value === 'request_received') return 'Accept Request';
    return 'Add Friend';
  });

  async function handleFriendAction () {
    if (!profile.value) return;
    friendshipLoading.value = true;
    friendshipError.value = '';
    try {
      const targetId = profile.value.user.Id;
      if (friendshipStatus.value === 'none') {
        const res = await apiFetch(`/friends/request/${targetId}`, { method: 'POST' }) as { requestId: string };
        friendRequestId.value = res.requestId;
        friendshipStatus.value = 'request_sent';
      } else if (friendshipStatus.value === 'request_sent') {
        await apiFetch(`/friends/request/${targetId}`, { method: 'DELETE' });
        friendRequestId.value = null;
        friendshipStatus.value = 'none';
      } else if (friendshipStatus.value === 'request_received' && friendRequestId.value) {
        await apiFetch(`/friends/request/${friendRequestId.value}/accept`, { method: 'PUT' });
        friendshipStatus.value = 'friends';
      }
    } catch (err: any) {
      friendshipError.value = err?.message || 'Something went wrong';
    } finally {
      friendshipLoading.value = false;
    }
  }

  const friends = ref<Friend[]>([]);
  const bookClubs = ref<BookClub[]>([]);

  const awards = computed<DisplayBadge[]>(() =>
    (profile.value?.badges ?? []).map(b => ({
      Name: b.Name,
      Description: b.Description,
      ImageUrl: b.ImageUrl ? `${b.ImageUrl}` : '/images/default_badge.png',
    }))
  );

  const fetchRouteBooks = async (routeId: string) => {
    try {
      const data = await apiFetch(`/routes/${routeId}/books`) as any;
      routeBooks.value = data.books.map((book: any) => ({
        ...book,
        CoverUrl: book.CoverUrl?.startsWith('/uploads')
          ? `${import.meta.env.VITE_BASE_URL}${book.CoverUrl}`
          : book.CoverUrl,
      }));
    } catch {
      // no books to show
    }
  };

  async function loadProfile (id: string) {
    loading.value = true;
    error.value = '';
    profile.value = null;
    routeBooks.value = [];
    friends.value = [];
    try {
      profile.value = await apiFetch(`/user/${id}/public`) as PublicProfile;
      friendshipStatus.value = profile.value.friendshipStatus ?? 'none';
      friendRequestId.value = profile.value.friendRequestId ?? null;
      friends.value = profile.value.friends.map(f => ({
        id: f.Id,
        name: f.Username,
        avatarUrl: f.AvatarUrl ? `http://localhost:3001${f.AvatarUrl}` : null,
      }));
      if (profile.value.activeRoutes[0]) {
        await fetchRouteBooks(profile.value.activeRoutes[0].Id);
      }
    } catch {
      error.value = 'User not found.';
    } finally {
      loading.value = false;
    }
  }

  onMounted(() => loadProfile(route.params.id as string));
  watch(() => route.params.id, id => { if (id) loadProfile(id as string); });
</script>

<style scoped lang="scss">
.user-page {
  background: #f5f5f0;
  min-height: 100vh;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 60vh;
  color: #aaa;
}

.main-row {
  padding: 40px 16px 24px;
}

/* ── Profile card ── */
.profile-card {
  background: #fff;
  border-radius: 16px;
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;

  .avatar {
    margin-bottom: 4px;
  }

  .username {
    font-size: 1.1rem;
    font-weight: 700;
    color: #1a1a1a;
    text-align: center;
  }

  .actions {
    display: flex;
    gap: 10px;
    margin: 8px 0 12px;

    .action-btn {
      font-size: 0.82rem;
      text-transform: none;
      letter-spacing: 0;
      color: rgb(var(--v-theme-primary));
      border-color: rgb(var(--v-theme-primary));

      &--filled {
        background-color: rgb(var(--v-theme-primary));
        color: #fff;
      }
    }
  }

  .info-row {
    width: 100%;
    font-size: 0.85rem;
    color: #555;
    line-height: 1.5;

    .info-label {
      font-weight: 600;
      color: #333;
      margin-right: 4px;
    }
  }

  .info-section {
    width: 100%;
    margin-top: 8px;

    .info-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
    }

    .info-empty {
      font-size: 0.82rem;
      color: #aaa;
    }

    .club-row {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.85rem;
      color: #333;
      margin-top: 6px;
    }
  }
}
</style>
