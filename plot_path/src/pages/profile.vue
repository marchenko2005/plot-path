<template>
  <Header />
  <div class="profile-page">
    <v-container v-if="form && user" fluid>
      <v-row class="profile-top">
        <!-- Left Sidebar -->
        <v-col class="sidebar" cols="12" md="4">
          <div class="avatar-section">
            <v-avatar size="64">
              <img alt="User Avatar" :src="user.AvatarUrl ? user.AvatarUrl : '/uploads/avatars/default_ava.jpg'">
            </v-avatar>
            <div>
              <div class="name">{{ user.Username }}</div>
              <div class="email-small">{{ user.Email }}</div>
            </div>
          </div>

          <div class="field-group">
            <label class="field-label">{{ t('profile.username') }}</label>
            <v-text-field
              v-model="form.name"
              density="compact"
              hide-details
              :placeholder="t('profile.usernamePlaceholder')"
              variant="outlined"
            />
          </div>

          <div class="field-group">
            <label class="field-label">{{ t('profile.age') }}</label>
            <v-text-field
              v-model="form.age"
              density="compact"
              hide-details
              :placeholder="t('profile.agePlaceholder')"
              type="number"
              variant="outlined"
            />
          </div>

          <div class="meta-section">
            <div class="meta-title">{{ t('profile.myEmail') }}</div>
            <div class="meta-row">
              <v-icon size="20">mdi-email-outline</v-icon>
              <div>
                <div class="meta-email">{{ user.Email }}</div>
                <div class="meta-sub">1 month ago</div>
              </div>
            </div>
          </div>

          <div class="meta-section">
            <div class="meta-title">My Book Clubs</div>
            <div v-if="bookClubs.length === 0" class="meta-empty">No book clubs yet</div>
            <div v-else class="d-flex flex-wrap ga-3 mt-1">
              <router-link
                v-for="club in bookClubs"
                :key="club.id"
                class="club-card text-decoration-none"
                :to="`/clubs/${club.id}`"
              >
                <v-img
                  cover
                  :src="club.imageUrl ? resolveUrl(club.imageUrl) : ''"
                  style="width: 120px; aspect-ratio: 1; border-radius: 8px; background: #f0e8ea;"
                >
                  <template v-if="!club.imageUrl" #default>
                    <div class="d-flex align-center justify-center fill-height">
                      <v-icon color="secondary" opacity="0.5" size="40">mdi-bookshelf</v-icon>
                    </div>
                  </template>
                </v-img>
                <p class="text-caption text-center mt-1" style="width: 120px; color: #333; line-height: 1.3;">{{ club.name }}</p>
              </router-link>
            </div>
          </div>
        </v-col>

        <v-col cols="1" />

        <!-- Right Main Content -->
        <v-col class="main-content" cols="12" md="7">
          <div class="d-flex mb-6">
            <v-spacer />
            <v-btn class="save-btn" variant="elevated" @click="saveProfile">{{ t('profile.save') }}</v-btn>
          </div>

          <div class="mb-6">
            <ProfileInterests
              v-model="form.interests"
              :all-tags="interests"
              @search="searchTags"
            />
          </div>

          <div class="mb-6">
            <ProfileAwards :awards="form.awards" />
          </div>

          <ProfileFriends :friends="friends" />
        </v-col>
      </v-row>

      <!-- ROUTES -->
      <RouteOfTheMonth
        v-if="books2.length"
        background-color="#fff"
        background-color-books="#6F6F64"
        :books="books2"
        :subtitle="routes[0]?.Name"
        :title="t('profile.currentRoutes')"
      />

      <RouteOfTheMonth
        v-if="books3.length"
        background-color="#fff"
        background-color-books="#F5A878"
        :books="books3"
        class="pt-0"
        :subtitle="routes[1]?.Name"
      />

      <Footer />
    </v-container>

    <div v-else class="loading-state">
      <v-progress-circular color="primary" indeterminate />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import type { Route, Tag, User } from '@/types/user.interface';

  const { t } = useI18n();
  import type { Book } from '@/types/general.interface';
  import { apiFetch } from '@/plugins/api';
  import { resolveUrl } from '@/utils/url';
  import ProfileInterests from '@/components/Profile/ProfileInterests.vue';
  import ProfileAwards from '@/components/Profile/ProfileAwards.vue';
  import type { DisplayBadge } from '@/components/Profile/ProfileAwards.vue';
  import ProfileFriends from '@/components/Profile/ProfileFriends.vue';
  import type { Friend } from '@/components/Profile/ProfileFriends.vue';

  interface BookClub {
    id: string;
    name: string;
    imageUrl: string | null;
  }

  const user = ref<User | null>(null);
  const form = ref<{ name: string; age: string; interests: Tag[]; awards: DisplayBadge[] }>({
    name: '',
    age: '',
    interests: [],
    awards: [],
  });
  const interests = ref<Tag[]>([]);
  const routes = ref<Route[]>([]);
  const books2 = ref<Book[]>([]);
  const books3 = ref<Book[]>([]);
  const bookClubs = ref<BookClub[]>([]);
  const friends = ref<Friend[]>([]);

  const fetchAllTags = async () => {
    try {
      const allTags = await apiFetch('/tags') as Tag[];
      const combined = new Map<string, Tag>();
      for (const tag of [...form.value.interests, ...allTags]) {
        combined.set(tag.Id, tag);
      }
      interests.value = Array.from(combined.values());
    } catch (err) {
      console.error('[user.vue] Failed to fetch all tags:', err);
    }
  };

  const fetchProfile = async () => {
    try {
      const data = await apiFetch('/user/profile') as any;
      user.value = {
        Id: data.user.Id,
        Username: data.user.Username,
        Email: data.user.Email,
        AvatarUrl: data.user.AvatarUrl ?? '',
      };
      form.value.name = data.user.Username;
      form.value.age = data.user.Age ? String(data.user.Age) : '';
      routes.value = data.routes || [];
      if (routes.value[0]) books2.value = await fetchBooks(routes.value[0].Id);
      if (routes.value[1]) books3.value = await fetchBooks(routes.value[1].Id);
    } catch (err) {
      console.error('[user.vue] Failed to fetch profile:', err);
    }
  };

  const fetchBadges = async () => {
    try {
      const data = await apiFetch('/user/badges') as any[];
      form.value.awards = data.map((badge: any) => ({
        Name: badge.Name,
        Description: badge.Description ?? '',
        ImageUrl: badge.ImageUrl
          ? `http://localhost:3001${badge.ImageUrl}`
          : '/images/default_badge.png',
      }));
    } catch (err) {
      console.error('[user.vue] Failed to fetch badges:', err);
    }
  };

  const fetchBooks = async (routeId: string): Promise<Book[]> => {
    const data = await apiFetch(`/routes/${routeId}/books`) as any;
    return data.books.map((book: any) => ({
      ...book,
      CoverUrl: book.CoverUrl?.startsWith('/uploads')
        ? `${import.meta.env.VITE_BASE_URL}${book.CoverUrl}`
        : book.CoverUrl,
      progressPercent: data.progressPercent || null,
    }));
  };

  const searchTags = async (query: string) => {
    if (!query || query.length < 2) return;
    try {
      const data = await apiFetch(`/tags/search/by-name?name=${encodeURIComponent(query)}`) as Tag[];
      if (!Array.isArray(data)) return;
      const existingIds = new Set(interests.value.map(tag => tag.Id));
      for (const tag of data) {
        if (!existingIds.has(tag.Id)) interests.value.push(tag);
      }
    } catch (err) {
      console.error('[user.vue] Tag search error:', err);
    }
  };

  const fetchUserTags = async () => {
    try {
      const data = await apiFetch('/user/tags') as Tag[];
      if (!Array.isArray(data)) return;
      form.value.interests = data;
      const all = [...interests.value, ...data];
      interests.value = Array.from(new Map(all.map(tag => [tag.Id, tag])).values());
    } catch (err) {
      console.error('[user.vue] Failed to fetch user tags:', err);
    }
  };

  const saveProfile = async () => {
    try {
      await apiFetch('/user/profile', {
        method: 'PUT',
        body: JSON.stringify({ username: form.value.name, age: form.value.age }),
      });
    } catch (err) {
      console.error('[profile.vue] Failed to save profile:', err);
    }

    try {
      const tagIds = form.value.interests.map(t => t.Id);
      await apiFetch('/user/tags', {
        method: 'PUT',
        body: JSON.stringify({ tagIds }),
      });
    } catch (err) {
      console.error('[profile.vue] Failed to save interests:', err);
    }
  };

  const fetchFriends = async () => {
    try {
      const data = await apiFetch('/friends') as { Id: string; Username: string; AvatarUrl: string | null }[];
      friends.value = data.map(f => ({
        id: f.Id,
        name: f.Username,
        avatarUrl: f.AvatarUrl ? `http://localhost:3001${f.AvatarUrl}` : null,
      }));
    } catch (err) {
      console.error('[profile.vue] Failed to fetch friends:', err);
    }
  };

  const fetchBookClubs = async () => {
    try {
      const data = await apiFetch('/clubs/my') as { Id: string; Name: string; AvatarUrl: string | null }[];
      bookClubs.value = data.map(c => ({ id: c.Id, name: c.Name, imageUrl: c.AvatarUrl }));
    } catch (err) {
      console.error('[profile.vue] Failed to fetch book clubs:', err);
    }
  };

  onMounted(async () => {
    await fetchProfile();
    await fetchAllTags();
    await fetchUserTags();
    await fetchBadges();
    await fetchFriends();
    await fetchBookClubs();
  });
</script>

<style scoped lang="scss">
.profile-page {
  background-color: #fff;
  min-height: 100vh;
  padding: 40px 0;

  .profile-top {
    padding: 0 16px;
  }
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

/* ── Sidebar ── */
.sidebar {
  .avatar-section {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;

    .name {
      font-size: 1rem;
      font-weight: 600;
      color: #1a1a1a;
    }

    .email-small {
      font-size: 0.8rem;
      color: #888;
    }
  }

  .field-group {
    margin-bottom: 14px;

    .field-label {
      display: block;
      font-size: 0.85rem;
      font-weight: 500;
      color: #333;
      margin-bottom: 6px;
    }

    :deep(.v-field) {
      background-color: #f9f9f9;
    }
  }

  .meta-section {
    margin-top: 20px;

    .meta-title {
      font-size: 0.85rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 10px;
    }

    .meta-row {
      display: flex;
      align-items: center;
      gap: 10px;

      .meta-email {
        font-size: 0.85rem;
        color: #333;
      }

      .meta-sub {
        font-size: 0.75rem;
        color: #999;
      }

      .meta-club-name {
        font-size: 0.85rem;
        color: #333;
      }
    }

    .meta-empty {
      font-size: 0.82rem;
      color: #aaa;
    }
  }
}

/* ── Main content ── */
.main-content {
  .save-btn {
    background-color: rgb(var(--v-theme-primary));
    color: #fff;
    text-transform: none;
    font-weight: 500;
    font-size: 0.85rem;
    letter-spacing: 0;
    min-width: 80px;
  }
}
</style>
