<template>
  <v-menu location="bottom end" min-width="300px" :close-on-content-click="false">
    <template #activator="{ props }">
      <v-badge
        :content="requests.length"
        :model-value="requests.length > 0"
        color="primary"
        location="top end"
      >
        <v-btn :color="iconColor" icon variant="text" v-bind="props">
          <v-icon>mdi-bell-outline</v-icon>
        </v-btn>
      </v-badge>
    </template>

    <v-card min-width="300px">
      <v-card-title class="text-subtitle-2 pa-3 pb-2">Friend Requests</v-card-title>
      <v-divider />

      <div
        v-if="requests.length === 0"
        class="pa-4 text-center text-medium-emphasis text-body-2"
      >
        No pending requests
      </div>

      <v-list v-else density="compact" lines="one">
        <v-list-item v-for="req in requests" :key="req.Id" class="py-2">
          <template #prepend>
            <v-avatar class="mr-3" size="36">
              <img :alt="req.Username" :src="resolveAvatar(req.AvatarUrl)" />
            </v-avatar>
          </template>

          <v-list-item-title class="text-body-2 font-weight-medium">
            {{ req.Username }}
          </v-list-item-title>

          <template #append>
            <div class="d-flex" style="gap: 6px;">
              <v-btn
                :loading="pending === req.Id"
                color="success"
                density="comfortable"
                icon
                variant="tonal"
                @click="accept(req)"
              >
                <v-icon size="16">mdi-check</v-icon>
              </v-btn>
              <v-btn
                :loading="pending === req.Id"
                color="error"
                density="comfortable"
                icon
                variant="tonal"
                @click="reject(req)"
              >
                <v-icon size="16">mdi-close</v-icon>
              </v-btn>
            </div>
          </template>
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
  import { onMounted, onUnmounted, ref } from 'vue';
  import { apiFetch } from '@/plugins/api';
  import { getSocket } from '@/plugins/socket';

  withDefaults(defineProps<{ iconColor?: string }>(), { iconColor: 'white' });

  interface FriendRequest {
    Id: string;
    SenderId: string;
    Username: string;
    AvatarUrl: string | null;
    CreatedAt: string;
  }

  const requests = ref<FriendRequest[]>([]);
  const pending = ref<string | null>(null);

  function resolveAvatar(url: string | null) {
    if (!url) return 'http://localhost:3001/uploads/avatars/default_ava.jpg';
    return url.startsWith('/uploads') ? `http://localhost:3001${url}` : url;
  }

  async function loadRequests() {
    try {
      requests.value = await apiFetch('/friends/requests') as FriendRequest[];
    } catch {
      // not critical
    }
  }

  async function accept(req: FriendRequest) {
    pending.value = req.Id;
    try {
      await apiFetch(`/friends/request/${req.Id}/accept`, { method: 'PUT' });
      requests.value = requests.value.filter(r => r.Id !== req.Id);
    } finally {
      pending.value = null;
    }
  }

  async function reject(req: FriendRequest) {
    pending.value = req.Id;
    try {
      await apiFetch(`/friends/request/${req.Id}/reject`, { method: 'PUT' });
      requests.value = requests.value.filter(r => r.Id !== req.Id);
    } finally {
      pending.value = null;
    }
  }

  function onNewRequest(payload: { requestId: string; sender: { id: string; Username: string; AvatarUrl: string | null } }) {
    const already = requests.value.some(r => r.Id === payload.requestId);
    if (!already) {
      requests.value.unshift({
        Id: payload.requestId,
        SenderId: payload.sender.id,
        Username: payload.sender.Username,
        AvatarUrl: payload.sender.AvatarUrl,
        CreatedAt: new Date().toISOString(),
      });
    }
  }

  onMounted(async () => {
    await loadRequests();
    getSocket()?.on('notification:friend_request', onNewRequest);
  });

  onUnmounted(() => {
    getSocket()?.off('notification:friend_request', onNewRequest);
  });
</script>
