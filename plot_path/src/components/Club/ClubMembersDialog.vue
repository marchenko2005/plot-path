<template>
  <v-dialog :model-value="modelValue" max-width="400" @update:model-value="$emit('update:modelValue', $event)">
    <v-card rounded="xl">
      <v-card-title class="pa-4 pb-2 d-flex align-center justify-space-between">
        <span class="text-body-1 font-weight-bold">Members</span>
        <v-btn density="compact" icon variant="text" @click="$emit('update:modelValue', false)">
          <v-icon size="20">mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-list class="px-2 pb-3" lines="two">
        <v-list-item
          v-for="member in members"
          :key="member.Id"
          rounded="lg"
          :to="`/users/${member.Id}`"
          @click="$emit('update:modelValue', false)"
        >
          <template #prepend>
            <v-avatar color="secondary" size="38">
              <v-img v-if="member.AvatarUrl" cover :src="resolveUrl(member.AvatarUrl)" />
              <span v-else class="text-caption text-white">{{ member.Username[0] }}</span>
            </v-avatar>
          </template>
          <v-list-item-title>{{ member.Username }}</v-list-item-title>
          <v-list-item-subtitle class="text-capitalize">{{ member.Role }}</v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import type { Member } from '@/types/club';
  import { resolveUrl } from '@/utils/url';

  defineProps<{ modelValue: boolean; members: Member[] }>();
  defineEmits<{ 'update:modelValue': [value: boolean] }>();
</script>
