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
      <ClubJoinByCode @joined="onJoined" />
      <ClubMyList :clubs="myClubs" />
      <ClubDiscover />
    </div>

    <p class="text-center text-caption text-medium-emphasis py-6">© 2025 PlotPath All Rights Reserved</p>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { apiFetch } from '@/plugins/api';
  import { connectSocket, getSocket } from '@/plugins/socket';
  import type { MyClub } from '@/types/club';

  interface StoredUser {
    username: string
    email: string
    AvatarUrl: string | null
  }

  const router = useRouter();
  const myClubs = ref<MyClub[]>([]);
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

  function onJoined (clubId: string) {
    getSocket()?.emit('club:join_room', { clubId });
    router.push(`/clubs/${clubId}`);
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
