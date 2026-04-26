<template>
  <v-dialog v-model="state.visible" max-width="420" persistent>
    <v-card class="modal-card">
      <div class="modal-icon-row">
        <div class="modal-icon" :class="state.type">
          <v-icon size="32">{{ icon }}</v-icon>
        </div>
      </div>

      <v-card-text class="modal-body">
        <div v-if="state.title" class="modal-title">{{ state.title }}</div>
        <div class="modal-message">{{ state.message }}</div>
      </v-card-text>

      <v-card-actions class="modal-actions">
        <v-btn class="modal-btn" variant="elevated" @click="close">OK</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { useModal } from '@/composables/useModal';

  const { state, close } = useModal();

  const icon = computed(() => {
    const icons = {
      success: 'mdi-check-circle-outline',
      error: 'mdi-alert-circle-outline',
      warning: 'mdi-alert-outline',
      info: 'mdi-information-outline',
    };
    return icons[state.type];
  });
</script>

<style scoped lang="scss">
.modal-card {
  border-radius: 20px;
  padding: 8px 0 16px;
  text-align: center;
  overflow: hidden;
}

.modal-icon-row {
  display: flex;
  justify-content: center;
  padding: 24px 0 8px;

  .modal-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    &.success {
      background: #e8f5e9;
      color: #2e7d32;
      .v-icon { color: #2e7d32; }
    }
    &.error {
      background: #fdecea;
      color: #c62828;
      .v-icon { color: #c62828; }
    }
    &.warning {
      background: #fff8e1;
      color: #f57f17;
      .v-icon { color: #f57f17; }
    }
    &.info {
      background: #ede7f6;
      color: rgb(var(--v-theme-primary));
      .v-icon { color: rgb(var(--v-theme-primary)); }
    }
  }
}

.modal-body {
  padding: 12px 32px 8px;

  .modal-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 8px;
  }

  .modal-message {
    font-size: 0.95rem;
    color: #555;
    line-height: 1.5;
  }
}

.modal-actions {
  justify-content: center;
  padding-bottom: 20px;

  .modal-btn {
    background-color: rgb(var(--v-theme-primary));
    color: #fff;
    text-transform: none;
    font-weight: 600;
    font-size: 0.95rem;
    border-radius: 12px;
    padding: 0 40px;
    letter-spacing: 0;
  }
}
</style>
