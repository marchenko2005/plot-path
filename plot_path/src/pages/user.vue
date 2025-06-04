<template>
  <Header />
  <div class="profile-page">
    <v-container v-if="form && user" fluid>
      <v-row>
        <!-- Left Sidebar -->
        <v-col class="sidebar" cols="12" md="4">
          <v-avatar class="mb-4" size="80">
            <img alt="User Avatar" :src="user.AvatarUrl || '/images/default_avatar.png'" />
          </v-avatar>
          <h3 class="name">{{ user.Username }}</h3>
          <p class="email">{{ user.Email }}</p>

          <v-text-field
            v-model="form.name"
            class="mb-4"
            hide-details
            label="Username"
            variant="solo-filled"
          />
        </v-col>
        <v-col cols="2" />

        <!-- Right Main Content -->
        <v-col class="main-content" cols="12" md="6">
          <div class="d-flex mb-10">
            <v-spacer />
            <v-btn class="save-btn" color="primary" variant="elevated" @click="saveInterests">
              Save
            </v-btn>
          </div>

          <!-- Interests -->
          <div class="mb-8">
            <BaseFormGroup label="Interests">
              <v-autocomplete
                v-model="form.interests"
                chips
                closable-chips
                color="primary"
                hide-details="auto"
                item-title="Name"
                item-value="Id"
                :items="interests"
                multiple
                placeholder="Search here..."
                variant="outlined"
                @update:search="searchTags"
              />
            </BaseFormGroup>
          </div>

          <!-- Awards -->
          <div>
            <h4 class="section-title">Awards</h4>
            <div class="awards-box">
              <div v-for="award in form.awards" :key="award.Name" class="award-icon">
                <img alt="Award" :src="award.ImageUrl" />
                {{ award.Name }}
              </div>
              <router-link class="all-awards" to="/awards">All awards...</router-link>
            </div>
          </div>
        </v-col>
      </v-row>

      <!-- ROUTES -->
      <RouteOfTheMonth
        v-if="books2.length"
        background-color="#fff"
        background-color-books="#6F6F64"
        :books="books2"
        :subtitle="routes[0]?.Name"
        title="Current Routes"
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

    <v-progress-circular
      v-else
      color="primary"
      indeterminate
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import type { Tag, User, Route, Badge } from '@/types/user.interface';
  import type { Book } from '@/types/general.interface';

  const API = 'http://localhost:3000/api';
  const token = localStorage.getItem('accessToken') || '';
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const user = ref<User | null>(null);
  const form = ref<{ name: string; interests: Tag[]; awards: Badge[] }>({
    name: '',
    interests: [],
    awards: [],
  });
  const interests = ref<Tag[]>([]); // всі доступні теги
  const routes = ref<Route[]>([]);
  const books2 = ref<Book[]>([]);
  const books3 = ref<Book[]>([]);

  // Отримати повний список тегів
  const fetchAllTags = async () => {
    try {
      const res = await fetch(`${API}/tags`, { headers });
      const allTags = await res.json();

      // Об'єднуємо з тегами користувача, не дублюючи
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
      const res = await fetch(`${API}/user/profile`, { headers });
      const data = await res.json();
      console.log('[user.vue] Profile:', data);

      user.value = {
        Id: data.user.Id,
        Username: data.user.Username,
        Email: data.user.Email,
        AvatarUrl: data.user.AvatarUrl ?? '',
      };

      form.value.name = data.user.Username;
      routes.value = data.routes || [];

      if (routes.value[0]) books2.value = await fetchBooks(routes.value[0].Id);
      if (routes.value[1]) books3.value = await fetchBooks(routes.value[1].Id);
    } catch (err) {
      console.error('[user.vue] Failed to fetch profile:', err);
    }
  };

  const fetchBadges = async () => {
    try {
      const res = await fetch(`${API}/user/badges`, { headers });
      const data = await res.json();
      form.value.awards = data.map((badge: any) => ({
        Name: badge.Name,
        ImageUrl: badge.ImageUrl
          ? `http://localhost:3001${badge.ImageUrl}`
          : '/images/default_badge.png',
      }));
    } catch (err) {
      console.error('[user.vue] Failed to fetch badges:', err);
    }
  };

  const fetchBooks = async (routeId: string): Promise<Book[]> => {
    const res = await fetch(`${API}/routes/${routeId}/books`, { headers });
    const data = await res.json();
    return data.books.map((book: any) => ({
      ...book,
      CoverUrl: book.CoverUrl?.startsWith('/uploads')
        ? `http://localhost:3001${book.CoverUrl}`
        : book.CoverUrl,
      progressPercent: data.progressPercent || null,
    }));
  };

  const searchTags = async (query: string) => {
    if (!query || query.length < 2) return; // не шукати при порожньому чи короткому запиті

    try {
      const res = await fetch(`${API}/tags/search/by-name?name=${encodeURIComponent(query)}`, { headers });

      if (!res.ok) {
        console.warn(`[searchTags] Request failed: ${res.status}`);
        return;
      }

      const data = await res.json();

      if (!Array.isArray(data)) {
        console.warn('[searchTags] Expected array, got:', data);
        return;
      }

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
      const res = await fetch(`${API}/user/tags`, { headers });

      if (!res.ok) {
        console.warn('[fetchUserTags] Request failed with status:', res.status);
        return;
      }

      const data = await res.json();

      console.log('[fetchUserTags] Raw data:', data);

      if (!Array.isArray(data)) {
        console.warn('[fetchUserTags] Expected array, got:', data);
        return;
      }

      form.value.interests = data;
      console.log('[fetchUserTags] form.value.interests set to:', form.value.interests);

      const all = [...interests.value, ...data];
      const unique = Array.from(new Map(all.map(tag => [tag.Id, tag])).values());
      interests.value = unique;
      console.log('[fetchUserTags] interests.value updated:', interests.value);
    } catch (err) {
      console.error('[user.vue] Failed to fetch user tags:', err);
    }
  };

  const saveInterests = async () => {
    try {
      const tagIds = form.value.interests
      const res = await fetch(`${API}/user/tags`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ tagIds }),
      });

      const result = await res.json();
      console.log('[user.vue] Save result:', result);
    } catch (err) {
      console.error('[user.vue] Failed to save interests:', err);
    }
  };


  onMounted(async () => {
    console.log('[onMounted] Starting init...');
    await fetchProfile();
    await fetchAllTags();
    await fetchUserTags();
    await fetchBadges();
    console.log('[onMounted] Done.');
  });

</script>


<style scoped lang="scss">
.profile-page {
  padding: 60px 30px;
  background-color: #fff;
  height: 100vh;
  display: flex;
  align-items: center;
  flex-direction: column;

  .sidebar {
    text-align: center;

    .name {
      font-size: 1.5rem;
      font-weight: 600;
    }

    .email {
      color: #888;
      margin-bottom: 20px;
    }

    .email-label {
      font-weight: 600;
      margin-bottom: 10px;
    }

    .email-info {
      display: flex;
      align-items: center;
      color: #555;

      small {
        color: #999;
      }
    }
  }

  .main-content {
    position: relative;

    .section-title {
      font-weight: 400;
      font-size: 1rem;
      margin-bottom: 12px;
    }

    .awards-box {
      margin-top: 12px;
      background: #d8dbea;
      padding: 20px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      gap: 20px;
      position: relative;

      .award-icon {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        img {
          width: 100px;
          height: 100px;
        }
      }

      .all-awards {
        position: absolute;
        right: 20px;
        bottom: 12px;
        font-size: 0.9rem;
        color: #333;
        text-decoration: underline;
        cursor: pointer;
      }
    }

    .save-btn {
      font-weight: 600;
      text-transform: none;
    }
  }
}
</style>
