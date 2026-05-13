<template>
  <div style="background: #f2eaea; min-height: 100vh;">
    <ClubsToolbar />

    <div class="pa-6 pa-sm-8" style="max-width: 1200px; margin: 0 auto;">
      <ClubJoinByCode @joined="onJoined" />
      <ClubMyList :clubs="myClubs" />
      <ClubDiscover />
    </div>

    <p class="text-center text-caption text-medium-emphasis py-6">© 2025 PlotPath All Rights Reserved</p>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { apiFetch } from '@/plugins/api';
  import { connectSocket, getSocket } from '@/plugins/socket';
  import { useRouter } from 'vue-router';
  import type { MyClub } from '@/types/club';

  const router = useRouter();
  const myClubs = ref<MyClub[]>([]);

  function onJoined (clubId: string) {
    getSocket()?.emit('club:join_room', { clubId });
    router.push(`/clubs/${clubId}`);
  }

  onMounted(async () => {
    const token = localStorage.getItem('accessToken');
    if (token) connectSocket(token);
    try {
      myClubs.value = await apiFetch('/clubs/my') as MyClub[];
    } catch (err) {
      console.error('[clubs] init error:', err);
    }
  });
</script>
