<template>
  <div>
    <div class="section-title">Interests</div>
    <div class="interests-chips">
      <v-chip
        v-for="tag in modelValue"
        :key="tag.Id"
        class="interest-chip"
        closable
        size="small"
        @click:close="remove(tag.Id)"
      >
        {{ tag.Name }}
      </v-chip>
      <span class="add-more" @click="showSearch = !showSearch">Add more ...</span>
    </div>
    <v-autocomplete
      v-if="showSearch"
      :model-value="modelValue"
      class="mt-2"
      density="compact"
      hide-details
      item-title="Name"
      item-value="Id"
      :items="allTags"
      multiple
      placeholder="Search here..."
      return-object
      variant="outlined"
      @update:model-value="emit('update:modelValue', $event)"
      @update:search="emit('search', $event)"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import type { Tag } from '@/types/user.interface';

  const props = defineProps<{
    modelValue: Tag[];
    allTags: Tag[];
  }>();

  const emit = defineEmits<{
    'update:modelValue': [value: Tag[]];
    'search': [query: string];
  }>();

  const showSearch = ref(false);

  const remove = (tagId: string) => {
    emit('update:modelValue', props.modelValue.filter(t => t.Id !== tagId));
  };
</script>

<style scoped lang="scss">
.section-title {
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
  margin-bottom: 10px;
}

.interests-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 12px;

  .interest-chip {
    background-color: rgb(var(--v-theme-primary));
    color: #fff;
  }

  .add-more {
    font-size: 0.82rem;
    color: #888;
    cursor: pointer;
    text-decoration: underline;
    white-space: nowrap;

    &:hover {
      color: #555;
    }
  }
}
</style>
