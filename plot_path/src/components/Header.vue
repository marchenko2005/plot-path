<template>
  <section class="header">
    <v-container class="container">
      <v-row class="header-top">
        <v-col class="d-flex align-center">
          <ul class="header-nav">
            <li v-for="link in links" :key="link.label">
              <a :href="link.path">{{ link.label }}</a>
            </li>
            <li v-if="accessToken && user">
              <router-link to="/clubs">Book Clubs</router-link>
            </li>
          </ul>
        </v-col>

        <v-col class="d-flex justify-center">
          <img alt="logo" class="logo" src="/images/icons/logo.svg" @click="user ? router.push('/routes') : router.push('/')">
        </v-col>

        <v-col class="d-flex justify-end align-center">
          <template v-if="accessToken && user">
            <NotificationBell />
            <UserAvatarMenu
              :user="user"
              :unread-messages="unreadMessages"
              @logout="handleLogout"
            />
          </template>

          <div v-else class="header-buttons">
            <v-btn class="header-button" to="/auth/signup">{{ t('header.signUp') }}</v-btn>
            <v-btn class="header-button log-in" to="/auth/login">{{ t('header.logIn') }}</v-btn>
          </div>
        </v-col>
      </v-row>

      <v-row v-if="showImage" class="header-banner">
        <img alt="banner" src="/images/main_banner.webp">
      </v-row>
    </v-container>
  </section>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { apiFetch } from '@/plugins/api';
  import { disconnectSocket } from '@/plugins/socket';

const { showImage, links } = defineProps<{
  showImage?: boolean;
  links?: { label: string; path: string }[];
}>();

const router = useRouter();
const { t, locale } = useI18n();

const accessToken = localStorage.getItem('accessToken') || '';

  const user = ref<{
    id: string;
    username: string;
    email: string;
    AvatarUrl: string | null;
  } | null>(null);

  const unreadMessages = ref(0);

  onMounted(async () => {
    const stored = localStorage.getItem('user');
    if (stored) {
      user.value = JSON.parse(stored);
    }
    if (accessToken) {
      try {
        const chats = await apiFetch('/chat') as { UnreadCount: number }[];
        unreadMessages.value = chats.reduce((sum, c) => sum + (c.UnreadCount || 0), 0);
      } catch {
        // not critical
      }
    }
  });

  function handleLogout () {
    disconnectSocket();
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

.lang-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  color: rgb(var(--v-theme-primary));

  button {
    background: none;
    border: none;
    cursor: pointer;
    color: rgb(var(--v-theme-primary));
    font-size: 0.8rem;
    padding: 2px 4px;
    opacity: 0.5;
    transition: opacity 0.2s;

    &.active {
      opacity: 1;
      font-weight: 700;
    }

    &:hover {
      opacity: 1;
    }
  }

  .divider {
    opacity: 0.4;
  }
}
</style>
