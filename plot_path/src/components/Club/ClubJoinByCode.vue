<template>
  <v-card class="mb-8 pa-5" color="white" elevation="0" rounded="xl">
    <p class="text-subtitle-2 font-weight-bold mb-3">Join a club with an invite code</p>
    <div class="d-flex align-center ga-3" style="max-width: 440px;">
      <v-text-field
        v-model="inviteCode"
        density="compact"
        hide-details
        placeholder="Enter invite code..."
        rounded="lg"
        variant="outlined"
        @keydown.enter="joinByCode"
      />
      <v-btn color="secondary" :loading="joining" rounded="lg" @click="joinByCode">Join</v-btn>
    </div>
    <p v-if="joinError" class="text-caption text-error mt-2">{{ joinError }}</p>
  </v-card>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { apiFetch } from '@/plugins/api';

  const emit = defineEmits<{ joined: [clubId: string] }>();

  const inviteCode = ref('');
  const joining = ref(false);
  const joinError = ref('');

  async function joinByCode () {
    const code = inviteCode.value.trim();
    if (!code) return;
    joining.value = true;
    joinError.value = '';
    try {
      const data = await apiFetch(`/clubs/join/${encodeURIComponent(code)}`, { method: 'POST' }) as { clubId: string };
      emit('joined', data.clubId);
    } catch (err: unknown) {
      joinError.value = err instanceof Error ? err.message : 'Failed to join club';
    } finally {
      joining.value = false;
    }
  }
</script>
