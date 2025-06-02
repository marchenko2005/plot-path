import { defineStore } from 'pinia';
import { apiFetch } from '@/plugins/api';
import type { Book } from '@/types/general.interface';

export const useBookStore = defineStore('book', {
  state: () => ({
    books: [] as Book[],
    selectedBook: null as Book | null,
  }),
  actions: {
    async loadAllBooks () {
      this.books = await apiFetch('/books');
    },
    async loadBookById (id: string) {
      this.selectedBook = await apiFetch(`/books/${id}`);
    },
  },
});
