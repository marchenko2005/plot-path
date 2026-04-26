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
                />
              </v-avatar>

              <div class="username">{{ profile.user.Username }}</div>

              <div class="actions">
                <v-btn class="action-btn" rounded variant="outlined">Add friend</v-btn>
                <v-btn class="action-btn action-btn--filled" rounded variant="flat">Message</v-btn>
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
                    <img :alt="club.name" :src="club.imageUrl ?? '/images/default_avatar.png'" />
                  </v-avatar>
                  <span>{{ club.name }}</span>
                </div>
              </div>
            </div>
          </v-col>

          <!-- Right: friends + awards -->
          <v-col cols="12" md="8">
            <ProfileFriends :friends="friends" class="mb-4" />
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
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import { useRoute } from 'vue-router';
  import { apiFetch } from '@/plugins/api';
  import ProfileAwards from '@/components/Profile/ProfileAwards.vue';
  import type { DisplayBadge } from '@/components/Profile/ProfileAwards.vue';
  import ProfileFriends from '@/components/Profile/ProfileFriends.vue';
  import type { Friend } from '@/components/Profile/ProfileFriends.vue';
  import type { Book } from '@/types/general.interface';

  interface BookClub { id: string; name: string; imageUrl: string | null }

  interface PublicProfile {
    user: { Id: string; Username: string; AvatarUrl: string | null; Age: number | null };
    badges: { Name: string; Description: string; ImageUrl: string | null }[];
    tags: { Id: string; Name: string; Type: string }[];
    activeRoutes: { Id: string; Name: string }[];
  }

  const route = useRoute();
  const profile = ref<PublicProfile | null>(null);
  const loading = ref(true);
  const error = ref('');
  const routeBooks = ref<Book[]>([]);

  // No API yet — empty placeholders
  const friends = ref<Friend[]>([]);
  const bookClubs = ref<BookClub[]>([]);

  const awards = computed<DisplayBadge[]>(() =>
    (profile.value?.badges ?? []).map(b => ({
      Name: b.Name,
      Description: b.Description,
      ImageUrl: b.ImageUrl ? `http://localhost:3001${b.ImageUrl}` : '/images/default_badge.png',
    }))
  );

  const fetchRouteBooks = async (routeId: string) => {
    try {
      const data = await apiFetch(`/routes/${routeId}/books`) as any;
      routeBooks.value = data.books.map((book: any) => ({
        ...book,
        CoverUrl: book.CoverUrl?.startsWith('/uploads')
          ? `http://localhost:3001${book.CoverUrl}`
          : book.CoverUrl,
      }));
    } catch {
      // no books to show
    }
  };

  onMounted(async () => {
    try {
      profile.value = await apiFetch(`/user/${route.params.id}/public`) as PublicProfile;
      if (profile.value.activeRoutes[0]) {
        await fetchRouteBooks(profile.value.activeRoutes[0].Id);
      }
    } catch {
      error.value = 'User not found.';
    } finally {
      loading.value = false;
    }
  });
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
