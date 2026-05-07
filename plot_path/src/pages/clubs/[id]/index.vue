<template>
  <div class="club-page">
    <v-toolbar color="secondary" flat height="56">
      <router-link class="d-flex align-center text-decoration-none ml-4 mr-2" to="/">
        <v-icon color="white" size="22">mdi-book-open-variant</v-icon>
      </router-link>
      <router-link class="text-white font-weight-bold text-body-1 text-decoration-none mr-1" to="/">PlotPath</router-link>
      <span class="text-white text-body-1 mr-1">·</span>
      <router-link class="text-white font-weight-bold text-body-1 text-decoration-none" to="/clubs">Book Clubs</router-link>
      <v-spacer />
      <NotificationBell />
      <UserAvatarMenu v-if="menuUser" :user="menuUser" @logout="handleLogout" />
    </v-toolbar>

    <template v-if="club">
      <ClubHeader
        :club="club"
        :is-admin="isAdmin"
        @copy-invite="copyInviteLink"
        @leave="leaveClub"
      />

      <div class="club-content">
        <div class="club-left d-flex flex-column ga-4">
          <ClubBookOfMonth
            v-model="myRating"
            :current-book="club.currentBook"
            :is-admin="isAdmin"
            :reading-progress="readingProgress"
            @choose-book="bookDialog = true"
            @rate="submitRating"
          />
          <ClubRecommendations :recommendations="recommendations" />
        </div>

        <div class="club-right">
          <ClubDiscussion
            :is-admin="isAdmin"
            :messages="messages"
            :my-id="myId"
            @send="sendMessage"
          />
        </div>
      </div>
    </template>

    <div v-else-if="loading" class="d-flex justify-center align-center" style="height: 60vh;">
      <v-progress-circular color="primary" indeterminate />
    </div>

    <ClubBookPickerDialog
      v-model="bookDialog"
      :books="allBooks"
      :loading="settingBook"
      @confirm="confirmSetBook"
    />

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { apiFetch } from '@/plugins/api';
  import { connectSocket, getSocket } from '@/plugins/socket';
  import type { Book, Club, Message } from '@/types/club';
  import ClubHeader from '@/components/Club/ClubHeader.vue';
  import ClubBookOfMonth from '@/components/Club/ClubBookOfMonth.vue';
  import ClubRecommendations from '@/components/Club/ClubRecommendations.vue';
  import ClubDiscussion from '@/components/Club/ClubDiscussion.vue';
  import ClubBookPickerDialog from '@/components/Club/ClubBookPickerDialog.vue';

  interface StoredUser { username: string; email: string; AvatarUrl: string | null }

  const route = useRoute();
  const router = useRouter();
  const clubId = route.params.id as string;

  const club = ref<Club | null>(null);
  const loading = ref(true);
  const messages = ref<Message[]>([]);
  const recommendations = ref<Book[]>([]);
  const myId = ref('');
  const myRating = ref(0);

  const currentUser = ref<StoredUser | null>(null);
  const menuUser = computed(() => currentUser.value && myId.value ? {
    id: myId.value,
    username: currentUser.value.username,
    email: currentUser.value.email,
    AvatarUrl: currentUser.value.AvatarUrl,
  } : null);

  const isAdmin = computed(() => club.value?.viewerRole === 'admin');

  const bookDialog = ref(false);
  const allBooks = ref<Book[]>([]);
  const settingBook = ref(false);
  const snackbar = ref({ show: false, text: '', color: 'success' });

  const readingProgress = computed(() => {
    if (!club.value?.currentBook) return 0;
    const { StartDate, EndDate } = club.value.currentBook;
    const start = new Date(StartDate).getTime();
    const end = new Date(EndDate).getTime();
    const now = Date.now();
    if (now <= start) return 0;
    if (now >= end) return 100;
    return Math.round((now - start) / (end - start) * 100);
  });

  function handleLogout () {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    router.push('/');
  }

  function copyInviteLink () {
    if (!club.value) return;
    navigator.clipboard.writeText(club.value.InviteCode);
    snackbar.value = { show: true, text: 'Invite code copied!', color: 'success' };
  }

  function sendMessage (text: string) {
    getSocket()?.emit('club:send', { clubId, text });
  }

  function handleIncomingMessage (payload: { clubId: string; message: Message }) {
    if (payload.clubId !== clubId) return;
    messages.value.push(payload.message);
  }

  function handleBookChanged () {
    loadClub();
  }

  async function submitRating () {
    if (!club.value?.currentBook) return;
    try {
      await apiFetch(`/clubs/${clubId}/book/rate`, {
        method: 'POST',
        body: JSON.stringify({ clubBookId: club.value.currentBook.ClubBookId, rating: myRating.value }),
      });
      snackbar.value = { show: true, text: 'Rating saved!', color: 'success' };
      await loadClub();
    } catch (err) {
      console.error('[club] rate error:', err);
    }
  }

  async function confirmSetBook (payload: { bookId: string; startDate: string; endDate: string }) {
    settingBook.value = true;
    try {
      await apiFetch(`/clubs/${clubId}/book`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      bookDialog.value = false;
      await loadClub();
      snackbar.value = { show: true, text: 'Book of the month updated!', color: 'success' };
    } catch (err) {
      console.error('[club] setBook error:', err);
    } finally {
      settingBook.value = false;
    }
  }

  async function leaveClub () {
    try {
      await apiFetch(`/clubs/${clubId}/leave`, { method: 'DELETE' });
      router.push('/clubs');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to leave';
      snackbar.value = { show: true, text: message, color: 'error' };
    }
  }

  async function loadClub () {
    try {
      club.value = await apiFetch(`/clubs/${clubId}`) as Club;
      myRating.value = club.value.myRating ?? 0;
    } catch (err) {
      console.error('[club] load error:', err);
    }
  }

  watch(bookDialog, async open => {
    if (open && !allBooks.value.length) {
      try {
        allBooks.value = await apiFetch('/books') as Book[];
      } catch (err) {
        console.error('[club] load books error:', err);
      }
    }
  });

  onMounted(async () => {
    const stored = localStorage.getItem('user');
    if (stored) currentUser.value = JSON.parse(stored);
    const token = localStorage.getItem('accessToken');
    if (token) connectSocket(token);

    try {
      const profileData = await apiFetch('/user/profile') as { user: { Id: string } };
      myId.value = profileData.user.Id;
    } catch (err) {
      console.error('[club] profile error:', err);
    }

    loading.value = true;
    await loadClub();
    loading.value = false;

    if (club.value) {
      getSocket()?.emit('club:join_room', { clubId });

      try {
        messages.value = await apiFetch(`/clubs/${clubId}/messages`) as Message[];
      } catch (err) {
        console.error('[club] messages error:', err);
      }

      try {
        recommendations.value = await apiFetch(`/clubs/${clubId}/recommendations`) as Book[];
      } catch (err) {
        console.error('[club] recommendations error:', err);
      }
    }

    getSocket()?.on('club:message', handleIncomingMessage);
    getSocket()?.on('club:book_changed', handleBookChanged);
  });

  onUnmounted(() => {
    getSocket()?.off('club:message', handleIncomingMessage);
    getSocket()?.off('club:book_changed', handleBookChanged);
  });
</script>

<style scoped lang="scss">
.club-page {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #EDE8E0;
}

.club-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  gap: 16px;
  padding: 16px;
  background: #EDE8E0;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

.club-left {
  width: 400px;
  flex-shrink: 0;
  overflow-y: auto;
}

.club-right {
  flex: 1;
  background: #7B5B65;
  overflow: hidden;
  color: white;
  border-radius: 16px;
  max-height: 540px;
}
</style>
