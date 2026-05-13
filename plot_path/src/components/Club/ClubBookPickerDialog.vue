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
              color="primary"
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
            <v-menu v-model="startMenu" :close-on-content-click="false">
              <template #activator="{ props: activatorProps }">
                <v-text-field
                  density="compact"
                  hide-details
                  label="Start date"
                  :model-value="formatDisplay(startDate)"
                  prepend-inner-icon="mdi-calendar"
                  readonly
                  variant="outlined"
                  v-bind="activatorProps"
                />
              </template>
              <v-date-picker
                color="secondary"
                hide-header
                :model-value="startDate"
                @update:model-value="startDate = $event; startMenu = false"
              />
            </v-menu>
          </v-col>
          <v-col cols="6">
            <v-menu v-model="endMenu" :close-on-content-click="false">
              <template #activator="{ props: activatorProps }">
                <v-text-field
                  density="compact"
                  hide-details
                  label="End date"
                  :model-value="formatDisplay(endDate)"
                  prepend-inner-icon="mdi-calendar"
                  readonly
                  variant="outlined"
                  v-bind="activatorProps"
                />
              </template>
              <v-date-picker
                color="secondary"
                hide-header
                :model-value="endDate"
                @update:model-value="endDate = $event; endMenu = false"
              />
            </v-menu>
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
  const startDate = ref<Date | null>(null);
  const endDate = ref<Date | null>(null);
  const startMenu = ref(false);
  const endMenu = ref(false);

  const filteredBooks = computed(() => {
    const q = search.value.toLowerCase();
    if (!q) return props.books;
    return props.books.filter(b =>
      b.Title.toLowerCase().includes(q) || b.Author.toLowerCase().includes(q),
    );
  });

  function formatDisplay (date: Date | null): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function toIso (date: Date): string {
    return new Date(date).toISOString().slice(0, 10);
  }

  watch(() => props.modelValue, open => {
    if (!open) {
      selected.value = null;
      startDate.value = null;
      endDate.value = null;
      search.value = '';
    }
  });

  function confirm () {
    if (!selected.value || !startDate.value || !endDate.value) return;
    emit('confirm', {
      bookId: selected.value.Id,
      startDate: toIso(startDate.value),
      endDate: toIso(endDate.value),
    });
  }
</script>
