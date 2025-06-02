import { defineStore } from 'pinia';
import { apiFetch } from '@/plugins/api';
import type { Tag } from '@/types/user.interface';

export const useTagStore = defineStore('tag', {
  state: () => ({
    tags: [] as Tag[],
    selectedTag: null as Tag | null,
    tagsByType: {
      Genre: [] as Tag[],
      Trope: [] as Tag[],
    },
  }),
  actions: {
    async loadAllTags () {
      this.tags = await apiFetch('/tags');
    },
    async loadTagById (id: string) {
      this.selectedTag = await apiFetch(`/tags/${id}`);
    },
    async loadTagsByType (type: 'Genre' | 'Trope') {
      this.tagsByType[type] = await apiFetch(`/tags/type/${type}`);
    },
    async searchTagsByName (name: string) {
      return await apiFetch(`/tags/search/by-name?name=${encodeURIComponent(name)}`);
    },
  },
});
