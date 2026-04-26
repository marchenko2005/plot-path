<template>
  <div>
    <div class="section-title">Friends</div>
    <div class="friends-box">
      <div v-if="friends.length === 0" class="friends-empty">No friends added yet</div>
      <div v-else class="friends-list">
        <router-link v-for="friend in friends" :key="friend.id" class="friend-item" :to="`/users/${friend.id}`">
          <v-avatar size="52">
            <img :alt="friend.name" :src="friend.avatarUrl ?? '/uploads/avatars/default_ava.jpg'">
          </v-avatar>
          <span class="friend-name">{{ friend.name }}</span>
        </router-link>
        <span class="see-more">See more...</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  export interface Friend {
    id: string;
    name: string;
    avatarUrl: string | null;
  }

  defineProps<{
    friends: Friend[];
  }>();
</script>

<style scoped lang="scss">
.section-title {
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
  margin-bottom: 10px;
}

.friends-box {
  background: #4a2030;
  border-radius: 14px;
  padding: 20px;

  .friends-empty {
    font-size: 0.82rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .friends-list {
    display: flex;
    align-items: flex-end;
    gap: 20px;
    flex-wrap: wrap;
    position: relative;

    .friend-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      text-decoration: none;
      cursor: pointer;

      &:hover .friend-name {
        text-decoration: underline;
      }

      .friend-name {
        font-size: 0.75rem;
        color: #fff;
        text-align: center;
      }
    }

    .see-more {
      position: absolute;
      right: 0;
      bottom: 0;
      font-size: 0.82rem;
      color: rgba(255, 255, 255, 0.7);
      text-decoration: underline;
      cursor: pointer;
    }
  }
}
</style>
