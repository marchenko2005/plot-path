import { defineStore } from 'pinia';
import { apiFetch } from '@/plugins/api';
import { connectSocket, disconnectSocket } from '@/plugins/socket';

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
      }) as { accessToken: string; refreshToken: string };

      this.setTokens(res.accessToken, res.refreshToken);
      connectSocket(res.accessToken);

      const profile = await apiFetch('/user/profile') as { user: { Username: string; AvatarUrl: string | null } };
      localStorage.setItem('user', JSON.stringify({
        email,
        username: profile.user.Username,
        AvatarUrl: profile.user.AvatarUrl,
      }));
    },

    async register (name: string, email: string, password: string, tagIds: string[]) {
      await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, tagIds }),
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
      disconnectSocket();
      this.accessToken = '';
      this.refreshToken = '';
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    },

    setTokens (accessToken: string, refreshToken: string) {
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    },
  },
});
