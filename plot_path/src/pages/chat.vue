<template>
  <div class="chat-layout">

    <!-- ── Sidebar ── -->
    <v-sheet class="d-flex flex-column" color="#7B5B65" height="100%" width="200">

      <div class="d-flex justify-center pt-5 pb-4">
        <router-link to="/routes">
          <img alt="PlotPath" class="sidebar-logo" src="/images/icons/logo.svg">
        </router-link>
      </div>

      <p class="text-caption font-weight-bold px-3 pb-2 opacity-80" style="color: #fff;">
        Your chats
      </p>

      <v-list bg-color="transparent" density="compact" nav>
        <v-list-item
          v-for="chat in chats"
          :key="chat.ChatId"
          :active="activeChatUserId === chat.OtherUserId"
          active-color="white"
          base-color="white"
          rounded="lg"
          @click="openChat(chat.OtherUserId)"
        >
          <template #prepend>
            <v-avatar class="mr-2" size="34">
              <img :alt="chat.Username" :src="resolveAvatar(chat.AvatarUrl)">
            </v-avatar>
          </template>

          <v-list-item-title class="text-caption font-weight-medium">
            {{ chat.Username }}
          </v-list-item-title>

          <template v-if="chat.UnreadCount" #append>
            <v-chip color="primary" size="x-small">{{ chat.UnreadCount }}</v-chip>
          </template>
        </v-list-item>
      </v-list>

    </v-sheet>

    <!-- ── Main column ── -->
    <div class="d-flex flex-column flex-grow-1" style="min-width: 0;">

      <!-- Top bar -->
      <v-toolbar class="pr-6" color="secondary">
        <v-spacer />
        <v-btn color="white" icon variant="text">
          <v-icon>mdi-square-edit-outline</v-icon>
        </v-btn>
        <v-btn color="white" icon variant="text">
          <v-icon>mdi-bell-outline</v-icon>
        </v-btn>
        <UserAvatarMenu v-if="menuUser" :unread-messages="totalUnread" :user="menuUser" @logout="handleLogout" />
      </v-toolbar>

      <!-- Content area -->
      <div class="d-flex flex-column flex-grow-1 pa-6 bg-white" style="min-height: 0; overflow: hidden;">

        <!-- Chat card -->
        <v-card
          class="d-flex flex-column flex-grow-1"
          color="#EDE8E0"
          elevation="0"
          rounded="xl"
          style="min-height: 0;"
        >
          <!-- Messages list -->
          <div ref="messagesEl" class="flex-grow-1 overflow-y-auto pa-6" style="min-height: 0;">

            <template v-if="activeOtherUser">
              <div
                v-for="msg in messages"
                :key="msg.Id"
                class="d-flex align-end mb-4"
                :class="msg.SenderId === myId ? 'flex-row-reverse' : 'flex-row'"
                style="gap: 10px;"
              >
                <v-avatar v-if="msg.SenderId !== myId" size="34">
                  <img :alt="msg.Username" :src="resolveAvatar(msg.AvatarUrl)">
                </v-avatar>

                <div
                  class="bubble text-body-2 font-weight-medium"
                  :class="msg.SenderId === myId ? 'bubble--mine' : 'bubble--theirs'"
                >
                  {{ msg.MessageText }}
                </div>

                <v-avatar v-if="msg.SenderId === myId" size="34">
                  <img :alt="msg.Username" :src="resolveAvatar(msg.AvatarUrl)">
                </v-avatar>
              </div>
            </template>

            <div v-else class="d-flex align-center justify-center h-100 text-medium-emphasis text-body-2">
              Select a chat to start messaging
            </div>

          </div>

          <v-divider />

          <!-- Input row -->
          <v-card-actions class="pa-3 bg-white" style="gap: 8px;">
            <v-text-field
              v-model="draft"
              density="compact"
              :disabled="!activeOtherUser"
              hide-details
              placeholder="Write a message..."
              rounded="pill"
              variant="outlined"
              @keydown.enter.prevent="sendMessage"
            />
            <v-btn
              color="#7B5B65"
              :disabled="!draft.trim() || !activeOtherUser"
              icon
              variant="text"
              @click="sendMessage"
            >
              <v-icon>mdi-send-outline</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>

        <p class="text-center text-caption text-medium-emphasis pt-3">
          © 2025 PlotPath All Rights Reserved
        </p>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { apiFetch } from '@/plugins/api';
  import { connectSocket, getSocket } from '@/plugins/socket';

  interface ChatPreview {
    ChatId: string;
    OtherUserId: string;
    Username: string;
    AvatarUrl: string | null;
    LastMessage: string | null;
    LastMessageAt: string | null;
    UnreadCount: number;
  }

  interface Message {
    Id: string;
    SenderId: string;
    MessageText: string;
    CreatedAt: string;
    IsRead: boolean;
    Username: string;
    AvatarUrl: string | null;
  }

  interface OtherUser {
    Id: string;
    Username: string;
    AvatarUrl: string | null;
  }

  interface StoredUser {
    username: string;
    email: string;
    AvatarUrl: string | null;
  }

  const route = useRoute();
  const router = useRouter();

  const myId = ref('');
  const currentUser = ref<StoredUser | null>(null);

  const menuUser = computed(() => currentUser.value && myId.value ? {
    id: myId.value,
    username: currentUser.value.username,
    email: currentUser.value.email,
    AvatarUrl: currentUser.value.AvatarUrl,
  } : null);

  const totalUnread = computed(() => chats.value.reduce((sum, c) => sum + (c.UnreadCount || 0), 0));

  function handleLogout () {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    router.push('/');
  }
  const chats = ref<ChatPreview[]>([]);
  const messages = ref<Message[]>([]);
  const activeChatId = ref('');
  const activeChatUserId = ref('');
  const activeOtherUser = ref<OtherUser | null>(null);
  const draft = ref('');
  const messagesEl = ref<HTMLElement | null>(null);

  function resolveAvatar (url: string | null) {
    if (!url) return 'http://localhost:3001/uploads/avatars/default_ava.jpg';
    if (url.startsWith('/uploads')) return `http://localhost:3001${url}`;
    return url;
  }

  async function scrollToBottom () {
    await nextTick();
    if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight;
  }

  async function loadChats () {
    const data = await apiFetch('/chat') as ChatPreview[];
    chats.value = data;
  }

  async function openChat (userId: string) {
    activeChatUserId.value = userId;
    router.replace({ query: { with: userId } });

    const data = await apiFetch(`/chat/${userId}`) as { chatId: string; messages: Message[] };
    activeChatId.value = data.chatId;
    messages.value = data.messages;

    const chat = chats.value.find(c => c.OtherUserId === userId);
    if (chat) {
      activeOtherUser.value = { Id: userId, Username: chat.Username, AvatarUrl: chat.AvatarUrl };
      chat.UnreadCount = 0;
    }

    getSocket()?.emit('chat:read', { chatId: data.chatId });
    scrollToBottom();
  }

  function sendMessage () {
    const text = draft.value.trim();
    if (!text || !activeChatUserId.value) return;
    draft.value = '';
    getSocket()?.emit('chat:send', { receiverId: activeChatUserId.value, text });
  }

  function handleIncomingMessage (payload: { chatId: string; message: Message }) {
    if (payload.chatId === activeChatId.value) {
      messages.value.push(payload.message);
      getSocket()?.emit('chat:read', { chatId: payload.chatId });
      scrollToBottom();
    } else {
      const chat = chats.value.find(c => c.ChatId === payload.chatId);
      if (chat) {
        chat.UnreadCount = (chat.UnreadCount || 0) + 1;
        chat.LastMessage = payload.message.MessageText;
        chat.LastMessageAt = payload.message.CreatedAt;
      } else {
        loadChats();
      }
    }
  }

  onMounted(async () => {
    const stored = localStorage.getItem('user');
    if (stored) currentUser.value = JSON.parse(stored);

    const profileData = await apiFetch('/user/profile') as { user: { Id: string } };
    myId.value = profileData.user.Id;

    await loadChats();

    const withUserId = route.query.with as string | undefined;
    if (withUserId) {
      if (!chats.value.find(c => c.OtherUserId === withUserId)) {
        const otherData = await apiFetch(`/user/${withUserId}/public`) as { user: OtherUser };
        activeOtherUser.value = otherData.user;
        activeChatUserId.value = withUserId;

        const data = await apiFetch(`/chat/${withUserId}`) as { chatId: string; messages: Message[] };
        activeChatId.value = data.chatId;
        messages.value = data.messages;
        getSocket()?.emit('chat:read', { chatId: data.chatId });
        await loadChats();
        scrollToBottom();
      } else {
        openChat(withUserId);
      }
    }

    const token = localStorage.getItem('accessToken');
    if (token) connectSocket(token);
    getSocket()?.on('chat:message', handleIncomingMessage);
  });

  onUnmounted(() => {
    getSocket()?.off('chat:message', handleIncomingMessage);
  });
</script>

<style scoped lang="scss">
.chat-layout {
  display: flex;
  flex-direction: row;
  height: 100vh;
  overflow: hidden;
}

.sidebar-logo {
  width: 100px;
  height: 100px;
  object-fit: contain;
  filter: brightness(0) invert(1);
  opacity: 0.9;
}

.bubble {
  max-width: 55%;
  padding: 10px 16px;
  color: #1a1a1a;
  line-height: 1.45;
  word-break: break-word;

  &--mine {
    background: #E8A0A8;
    border-radius: 18px 18px 4px 18px;
  }

  &--theirs {
    background: #C9BBA0;
    border-radius: 18px 18px 18px 4px;
  }
}
</style>
