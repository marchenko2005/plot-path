<template>
  <v-menu location="bottom end" min-width="200px">
    <template #activator="{ props }">
      <v-badge
        :content="unread"
        :model-value="unread > 0"
        color="primary"
        location="top end"
      >
        <v-btn icon v-bind="props">
          <v-avatar color="brown" size="large">
            <v-img alt="Avatar" :src="avatarUrl" />
          </v-avatar>
        </v-btn>
      </v-badge>
    </template>

    <v-card>
      <v-card-text>
        <div class="mx-auto text-center">
          <v-avatar color="brown" size="large">
            <v-img alt="Avatar" :src="avatarUrl" />
          </v-avatar>
          <h3>{{ user.username }}</h3>
          <p class="text-caption mt-1">{{ user.email }}</p>
          <v-divider class="my-3" />
          <v-btn rounded to="/profile" variant="text">Edit Account</v-btn>
          <v-divider class="my-3" />
          <v-btn rounded to="/chat" variant="text">
            Messages
            <v-badge
              v-if="unread > 0"
              :content="unread"
              color="primary"
              inline
            />
          </v-btn>
          <v-divider class="my-3" />
          <v-btn rounded variant="text" @click="emit('logout')">Log Out</v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
  import { computed } from 'vue';

  interface UserInfo {
    id: string;
    username: string;
    email: string;
    AvatarUrl: string | null;
  }

  const props = defineProps<{ user: UserInfo; unreadMessages?: number }>();
  const unread = computed(() => props.unreadMessages ?? 0);
  const emit = defineEmits<{ logout: [] }>();

  const avatarUrl = computed(() => {
    if (!props.user.AvatarUrl) return 'http://localhost:3001/uploads/avatars/default_ava.jpg';
    return props.user.AvatarUrl.startsWith('/uploads')
      ? `http://localhost:3001${props.user.AvatarUrl}`
      : props.user.AvatarUrl;
  });
</script>
