<template>
  <ClubFormPage :club-id="clubId" mode="edit" />
</template>

<script setup lang="ts">
  import { useRoute } from 'vue-router';

  const route = useRoute();
  const clubId = route.params.id as string;
</script>
