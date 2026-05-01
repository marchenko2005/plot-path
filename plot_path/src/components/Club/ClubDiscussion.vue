<template>
  <div class="discussion d-flex flex-column">
    <div v-if="isAdmin" class="pa-3 border-b" style="background: rgba(255,255,255,0.1);">
      <p class="text-caption font-weight-bold text-white">Discussion</p>
    </div>

    <div ref="messagesEl" class="flex-grow-1 pa-4 overflow-y-auto" style="min-height: 0;">
      <div
        v-for="msg in messages"
        :key="msg.Id"
        class="d-flex align-end mb-3"
        :class="msg.UserId === myId ? 'flex-row-reverse' : 'flex-row'"
        style="gap: 8px;"
      >
        <v-avatar size="30">
          <v-img v-if="resolveUrl(msg.AvatarUrl)" cover :src="resolveUrl(msg.AvatarUrl)" />
          <v-avatar v-else color="secondary" size="30">
            <span class="text-caption text-white">{{ msg.Username[0] }}</span>
          </v-avatar>
        </v-avatar>
        <div
          class="bubble text-body-2"
          :class="msg.UserId === myId ? 'bubble--mine' : 'bubble--theirs'"
        >
          {{ msg.MessageText }}
        </div>
      </div>
      <p v-if="!messages.length" class="text-caption text-white text-center mt-4" style="opacity: 0.5;">
        No messages yet
      </p>
    </div>

    <div v-if="isAdmin" class="pa-3 d-flex align-center ga-2" style="background: rgba(255,255,255,0.1);">
      <v-text-field
        v-model="draft"
        density="compact"
        hide-details
        placeholder="Write a message..."
        rounded="pill"
        variant="outlined"
        @keydown.enter.prevent="send"
      />
      <v-btn color="secondary" :disabled="!draft.trim()" icon variant="text" @click="send">
        <v-icon>mdi-send-outline</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { nextTick, ref, watch } from 'vue';
  import type { Message } from '@/types/club';
  import { resolveUrl } from '@/utils/url';

  const props = defineProps<{
    messages: Message[]
    myId: string
    isAdmin: boolean
  }>();

  const emit = defineEmits<{ send: [text: string] }>();

  const draft = ref('');
  const messagesEl = ref<HTMLElement | null>(null);

  async function scrollToBottom() {
    await nextTick();
    if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight;
  }

  watch(() => props.messages.length, scrollToBottom);

  function send() {
    const text = draft.value.trim();
    if (!text) return;
    draft.value = '';
    emit('send', text);
  }
</script>

<style scoped lang="scss">
.discussion {
  height: 100%;
}

.bubble {
  max-width: 60%;
  padding: 8px 14px;
  line-height: 1.45;
  word-break: break-word;

  &--mine {
    background: #E8A0A8;
    color: #1a1a1a;
    border-radius: 18px 18px 4px 18px;
  }

  &--theirs {
    background: #C9BBA0;
    color: #1a1a1a;
    border-radius: 18px 18px 18px 4px;
  }
}
</style>
