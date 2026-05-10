<template>
  <v-toolbar color="secondary" flat height="56">
    <v-container class="d-flex align-center pa-0" style="max-width: 1200px;">
      <router-link class="d-flex align-center text-decoration-none mr-2" to="/">
        <v-icon color="white" size="22">mdi-book-open-variant</v-icon>
      </router-link>
      <template v-if="breadcrumb">
        <router-link class="text-white font-weight-bold text-body-1 text-decoration-none mr-1" to="/">PlotPath</router-link>
        <span class="text-white text-body-1 mr-1">·</span>
        <router-link class="text-white font-weight-bold text-body-1 text-decoration-none" to="/clubs">Book Clubs</router-link>
      </template>
      <span v-else class="text-white font-weight-bold text-body-1">PlotPath · Book Clubs</span>
      <v-spacer />
      <NotificationBell />
      <UserAvatarMenu v-if="menuUser" :user="menuUser" @logout="handleLogout" />
    </v-container>
  </v-toolbar>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { apiFetch } from '@/plugins/api';

  defineProps<{ breadcrumb?: boolean }>();

  const router = useRouter();
  const myId = ref('');
  const currentUser = ref<{ username: string; email: string; AvatarUrl: string | null } | null>(null);

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

  onMounted(async () => {
    const stored = localStorage.getItem('user');
    if (stored) currentUser.value = JSON.parse(stored);
    try {
      const data = await apiFetch('/user/profile') as { user: { Id: string } };
      myId.value = data.user.Id;
    } catch {
      // not authenticated — menu stays hidden
    }
  });
</script>
