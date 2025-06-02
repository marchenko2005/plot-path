<template>
  <div class="base-from-group">
    <label class="label">{{ label }}</label>
    <slot />
  </div>
</template>

<script setup lang="ts">
  const { label } = defineProps({
    label: {
      type: String,
      required: true,
    },
  });
</script>

<style scoped>

</style>
