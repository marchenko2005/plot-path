import { defineStore } from 'pinia';
import { apiFetch } from '@/plugins/api';
import { useUserStore } from '@/store/user';

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: localStorage.getItem('accessToken') || '',
    refreshToken: localStorage.getItem('refreshToken') || '',
  }),

  getters: {
    isAuthenticated: state => !!state.accessToken,
  },

  actions: {
    async login (email: string, password: string) {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }) as AuthResponse;

      console.log('[AuthStore] Login response:', res);
      this.setTokens(res.accessToken, res.refreshToken);
    },

    async register (name: string, email: string, password: string) {
      await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
    },

    async refreshAccessToken () {
      if (!this.refreshToken) return;

      const res = await apiFetch('/auth/refresh-token', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      }) as { accessToken: string };

      this.accessToken = res.accessToken;
      localStorage.setItem('accessToken', res.accessToken);
    },

    logout () {
      this.accessToken = '';
      this.refreshToken = '';
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');

      const userStore = useUserStore();
      userStore.profile = null;
    },

    setTokens (accessToken: string, refreshToken: string) {
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    },
  },
});
