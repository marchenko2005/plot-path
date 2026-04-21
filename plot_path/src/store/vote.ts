import { defineStore } from 'pinia';
import { apiFetch } from '@/plugins/api';
import type { VoteOption } from '@/types/general.interface';

export const useVoteStore = defineStore('vote', {
  state: () => ({
    options: [] as VoteOption[],
  }),

  actions: {
    async loadOptions () {
      this.options = await apiFetch('/vote/options') as VoteOption[];
    },

    async submitVote (tagId: string) {
      await apiFetch('/vote', { method: 'POST', body: JSON.stringify({ tagId }) });
    },
  },
});
