import { defineStore } from 'pinia';
import api from '@/plugins/axios';
import type { VoteOption } from '@/types/general.interface';

export const useVoteStore = defineStore('vote', {
  state: () => ({
    options: [] as VoteOption[],
  }),

  actions: {
    async loadOptions () {
      this.options = await api.get('/vote/options').then(res => res.data);
    },

    async submitVote (tagId: string) {
      await api.post('/vote', { tagId });
    },
  },
});
