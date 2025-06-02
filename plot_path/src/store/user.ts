import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { User } from '@/types/user.interface';

interface IAuthPayload {
  email: string;
  password: string;
}

const API = 'http://localhost:3000/api';
const token = localStorage.getItem('accessToken') || '';
const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
};

export const useUserStore = defineStore('user', () => {

  const user = ref<User|null>(null);
  const userLoading = ref(false);

  // Load user from localStorage if available
  const cachedUser = localStorage.getItem('user');
  if (cachedUser) {
    try {
      user.value = JSON.parse(cachedUser);
    } catch (e) {
      console.log(e);
      user.value = null;
    }
  }

  async function login (payload: IAuthPayload) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('login', payload);
  }

  async function logout () {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('logout');
    user.value = null;
    localStorage.removeItem('user');
  }

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API}/user/profile`, { headers });
      const data = await res.json();
      console.log('[user.vue] Profile:', data);

      user.value = {
        Id: data.user.Id,
        Username: data.user.Username,
        Email: data.user.Email,
        AvatarUrl: data.user.AvatarUrl ?? '',
      };

    } catch (err) {
      console.error('[user.vue] Failed to fetch profile:', err);
    }
  };

  return {
    user,
    userLoading,
    fetchProfile,
    login,
    logout,
  }
});
