<template>
  <section class="header">
    <v-container class="container">
      <v-row class="header-top">
        <v-col class="d-flex align-center">
          <ul class="header-nav">
            <li v-for="link in links" :key="link.label">
              <a :href="link.path">{{ link.label }}</a>
            </li>
          </ul>
        </v-col>

        <v-col class="d-flex justify-center">
          <img alt="logo" class="logo" src="/images/icons/logo.svg" @click="user ? router.push('/routes') : router.push('/')" />
        </v-col>

        <v-col class="d-flex justify-end align-center">
          <v-menu v-if="accessToken && user" location="bottom end" min-width="200px">
            <template #activator="{ props }">
              <v-btn icon v-bind="props">
                <v-avatar color="brown" size="large">
                  <v-img
                    v-if="user.AvatarUrl"
                    alt="Avatar"
                    :src="`http://localhost:3001${user.AvatarUrl}`"
                  />
                </v-avatar>
              </v-btn>
            </template>
            <v-card>
              <v-card-text>
                <div class="mx-auto text-center">
                  <v-avatar color="brown" size="large">
                    <v-img
                      v-if="user.AvatarUrl"
                      alt="Avatar"
                      :src="`http://localhost:3001${user.AvatarUrl}`"
                    />
                  </v-avatar>
                  <h3>{{ user.username }}</h3>
                  <p class="text-caption mt-1">{{ user.email }}</p>
                  <v-divider class="my-3" />
                  <v-btn rounded to="/user" variant="text">Edit Account</v-btn>
                  <v-divider class="my-3" />
                  <v-btn rounded variant="text" @click="handleLogout">Log Out</v-btn>
                </div>
              </v-card-text>
            </v-card>
          </v-menu>

          <div v-else class="header-buttons">
            <v-btn class="header-button" to="/auth/signup">Sign Up</v-btn>
            <v-btn class="header-button log-in" to="/auth/login">Log In</v-btn>
          </div>
        </v-col>
      </v-row>

      <v-row v-if="showImage" class="header-banner">
        <img alt="banner" src="/images/main_banner.webp" />
      </v-row>
    </v-container>
  </section>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { useRouter } from 'vue-router';

  const { showImage, links } = defineProps<{
    showImage?: boolean;
    links?: { label: string; path: string }[];
  }>();

  const router = useRouter();

  // Token
  const accessToken = localStorage.getItem('accessToken') || '';
  console.log('[Header] accessToken:', accessToken || 'NOT FOUND');

  // User
  const user = ref<{
    id: string;
    username: string;
    email: string;
    AvatarUrl: string | null;
  } | null>(null);

  onMounted(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      user.value = JSON.parse(stored);
    } else {
      console.log('[Header] No user found in localStorage');
    }
  });

  function handleLogout () {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    user.value = null;
    router.push({ path: '/' });
    console.log('[Header] Logged out and redirected');
  }
</script>

<style scoped lang="scss">
.header {
  background: rgb(var(--v-theme-secondary));
  color: rgb(var(--v-theme-primary));

  &-banner {
    padding-bottom: 100px;
  }

  &-nav {
    padding: 0;
    display: flex;
    list-style: none;
    align-items: center;
    gap: 20px;

    a {
      &:hover {
        color: rgb(var(--v-theme-white));
      }
    }
  }

  .logo {
    cursor: pointer;
  }

  &-buttons {
    display: flex;
    gap: 20px;
  }

  &-button {
    border-radius: 25px;
    background-color: rgb(var(--v-theme-gray));
    text-transform: none;
    padding: 0 25px;

    &.log-in {
      background-color: rgb(var(--v-theme-yellow));
      color: rgb(var(--v-theme-white));
    }
  }
}
</style>
