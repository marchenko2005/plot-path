<template>
  <v-dialog :model-value="modelValue" max-width="520" @update:model-value="$emit('update:modelValue', $event)">
    <v-card rounded="xl">
      <v-card-title class="pa-5 pb-3 text-subtitle-1 font-weight-bold">Choose the next book</v-card-title>
      <v-card-text class="pa-5 pt-0">
        <v-text-field
          v-model="search"
          class="mb-3"
          density="compact"
          hide-details
          placeholder="Search books..."
          prepend-inner-icon="mdi-magnify"
          rounded="lg"
          variant="outlined"
        />

        <div class="mb-4" style="max-height: 220px; overflow-y: auto;">
          <v-list density="compact">
            <v-list-item
              v-for="book in filteredBooks"
              :key="book.Id"
              :active="selected?.Id === book.Id"
              active-color="primary"
              rounded="lg"
              @click="selected = book"
            >
              <template #prepend>
                <v-avatar rounded="md" size="36">
                  <v-img cover :src="resolveUrl(book.CoverUrl)" />
                </v-avatar>
              </template>
              <v-list-item-title class="text-body-2">{{ book.Title }}</v-list-item-title>
              <v-list-item-subtitle>{{ book.Author }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </div>

        <v-row dense>
          <v-col cols="6">
            <v-text-field
              v-model="startDate"
              density="compact"
              hide-details
              label="Start date"
              type="date"
              variant="outlined"
            />
          </v-col>
          <v-col cols="6">
            <v-text-field
              v-model="endDate"
              density="compact"
              hide-details
              label="End date"
              type="date"
              variant="outlined"
            />
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-actions class="pa-5 pt-0">
        <v-spacer />
        <v-btn variant="text" @click="$emit('update:modelValue', false)">Cancel</v-btn>
        <v-btn
          color="secondary"
          :disabled="!selected || !startDate || !endDate"
          :loading="loading"
          rounded="lg"
          variant="flat"
          @click="confirm"
        >
          Set book
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue';
  import type { Book } from '@/types/club';
  import { resolveUrl } from '@/utils/url';

  const props = defineProps<{
    modelValue: boolean
    books: Book[]
    loading: boolean
  }>();

  const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    confirm: [payload: { bookId: string; startDate: string; endDate: string }]
  }>();

  const search = ref('');
  const selected = ref<Book | null>(null);
  const startDate = ref('');
  const endDate = ref('');

  const filteredBooks = computed(() => {
    const q = search.value.toLowerCase();
    if (!q) return props.books;
    return props.books.filter(b =>
      b.Title.toLowerCase().includes(q) || b.Author.toLowerCase().includes(q),
    );
  });

  watch(() => props.modelValue, open => {
    if (!open) {
      selected.value = null;
      startDate.value = '';
      endDate.value = '';
      search.value = '';
    }
  });

  function confirm() {
    if (!selected.value || !startDate.value || !endDate.value) return;
    emit('confirm', { bookId: selected.value.Id, startDate: startDate.value, endDate: endDate.value });
  }
</script>
