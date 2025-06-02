import { defineStore } from 'pinia';
import { apiFetch } from '@/plugins/api';
import type { Badge } from '@/types/user.interface'

export const useBadgeStore = defineStore('badge', {
  state: () => ({
    allBadges: [] as Badge[],
    userBadges: [] as Badge[],
    selectedBadge: null as Badge | null,
  }),
  actions: {
    async loadAllBadges () {
      this.allBadges = await apiFetch('/badges');
    },
    async loadUserBadges () {
      this.userBadges = await apiFetch('/user/badges');
    },
    async loadBadgeByName (name: string) {
      this.selectedBadge = await apiFetch(`/badges/${encodeURIComponent(name)}`);
    },
  },
});
