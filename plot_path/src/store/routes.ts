import { defineStore } from 'pinia';
import { apiFetch } from '@/plugins/api';
import type { Route, RouteProgress } from '@/types/route.interface';
import type { Book } from '@/types/general.interface';

export const useRoutesStore = defineStore('routes', {
  state: () => ({
    daily: [] as Route[],
    monthly: null as Route | null,
    userRoutes: [] as Route[],
    progressMap: {} as Record<string, RouteProgress>,
    booksByRoute: {} as Record<string, Book[]>,
  }),
  actions: {
    async loadDaily () {
      const res = await apiFetch('/routes/daily') as {
        monthly: Route;
        personalized: Route[];
      };
      this.monthly = res.monthly;
      this.daily = res.personalized;
    },

    async loadMonthly () {
      const res = await apiFetch('/routes/monthly');
      console.log('[RoutesStore] Raw /routes/monthly response:', res);

      if (!res) {
        this.monthly = null;
        return;
      }

      this.monthly = {
        id: res.Id,
        name: res.Name,
        description: res.Description,
        category: res.Category,
        isPersonalized: res.IsPersonalized,
        createdAt: res.CreatedAt,
        imageUrl: res.ImageUrl,
        isMonthly: res.IsMonthly,
      };
    },


    async loadUserRoutes () {
      this.userRoutes = await apiFetch('/routes/my');
    },

    async startRoute (routeId: string) {
      await apiFetch(`/routes/start/${routeId}`, {
        method: 'POST',
      });
      await this.loadUserRoutes();
    },

    async loadProgress (routeId: string) {
      const progress = await apiFetch(`/routes/progress/${routeId}`) as RouteProgress;
      this.progressMap[routeId] = progress;
    },

    async loadBooksForRoute (routeId: string) {
      const books = await apiFetch(`/routes/${routeId}/books`) as Book[];
      this.booksByRoute[routeId] = books;
    },
  },
});
