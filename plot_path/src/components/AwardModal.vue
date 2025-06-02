<template>
  <div class="text-center pa-4">
    <v-dialog
      v-model="awardModalStore.visible"
      width="400"
    >
      <v-card
        class="text-center"
        text="You have earned a new award!"
        title="Congratulations!"
      >
        <v-card-text>
          <v-img
            alt="Achievement Icon"
            class="mx-auto"
            :src="awardModalStore.achievement?.image || '/images/award_1.webp'"
            width="170"
          />
          <h4 class="achievement-title">
            {{ awardModalStore.achievement?.description || 'First Route Completed' }}
          </h4>
        </v-card-text>
        <template #actions>
          <v-btn
            class="ms-auto"
            text="Ok"
            @click="awardModalStore.close()"
          />
        </template>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
  import { useAwardModalStore } from '@/store/awardModalStore'

  const awardModalStore = useAwardModalStore()
</script>

<style scoped>

</style>
