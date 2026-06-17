import { apiClient } from './api.client';
import { DEMO_MODE, DEMO_SESSION_KEY, DEMO_TOKEN, DEMO_USER } from '@/config/demo';
import { getCookie, setCookie, eraseCookie } from '../utils/cookies';

const normalizeUser = (user: any) => ({
  ...user,
  role: typeof user?.role === 'string' ? user.role.toLowerCase() : user?.role,
});

const hasDemoSession = () =>
  DEMO_MODE &&
  typeof window !== 'undefined' &&
  localStorage.getItem(DEMO_SESSION_KEY) === 'true';

export const AuthService = {
  login: async (email?: string, password?: string) => {
    if (hasDemoSession()) {
      return { token: DEMO_TOKEN, user: DEMO_USER };
    }

    console.log("calling login");
    const response = await apiClient.post('/auth/login', { email, password });
    console.log("login response", response);
    const { success, data, message } = response.data;
    if (success && data) {
      const { access_token, refresh_token } = data;
      setCookie('grademind_auth', access_token, 1);
      setCookie('grademind_refresh_token', refresh_token, 7);

      // Perform a follow-up request to /auth/me to fetch profile details
      const meResponse = await apiClient.get('/auth/me');
      const meData = normalizeUser(meResponse.data.data);

      if (typeof window !== 'undefined') {
        localStorage.setItem('grademind_user', JSON.stringify(meData));
      }
      return { token: access_token, user: meData };
    }
    throw new Error(message || 'Login failed');
  },

  register: async (name?: string, email?: string, role?: string, password?: string) => {
    if (!password) {
      throw new Error('Password is required for registration.');
    }
    const response = await apiClient.post('/auth/register', { 
      name, 
      email, 
      role: role ? role.toUpperCase() : 'TEACHER', 
      password
    });
    return response.data;
  },

  getCurrentSession: async () => {
    if (hasDemoSession()) {
      return { token: DEMO_TOKEN, user: DEMO_USER };
    }

    try {
      const token = getCookie('grademind_auth');
      if (!token) return null;

      const response = await apiClient.get('/auth/me');
      const { success, data } = response.data;
      if (success && data) {
        const user = normalizeUser(data);
        if (typeof window !== 'undefined') {
          localStorage.setItem('grademind_user', JSON.stringify(user));
        }
        return { token, user };
      }
      return null;
    } catch (error) {
      return null;
    }
  },

  getCurrentUser: () => {
    if (hasDemoSession()) {
      return DEMO_USER;
    }

    if (typeof window !== 'undefined') {
      const u = localStorage.getItem('grademind_user');
      return u ? JSON.parse(u) : null;
    }
    return null;
  },

  refresh: async () => {
    if (hasDemoSession()) {
      return { token: DEMO_TOKEN };
    }

    const refreshToken = getCookie('grademind_refresh_token');
    if (!refreshToken) throw new Error('No refresh token available');
    const response = await apiClient.post('/auth/refresh', { refresh_token: refreshToken });
    const { success, data } = response.data;
    if (success && data) {
      const { access_token, refresh_token } = data;
      setCookie('grademind_auth', access_token, 1);
      setCookie('grademind_refresh_token', refresh_token, 7);
      return { token: access_token };
    }
    throw new Error('Refresh failed');
  },

  logout: async () => {
    if (DEMO_MODE) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('grademind_user');
        localStorage.removeItem(DEMO_SESSION_KEY);
        window.location.href = '/login';
      }
      return;
    }

    try {
      const refreshToken = getCookie('grademind_refresh_token');
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refresh_token: refreshToken });
      }
    } catch (error) {
      // Ignore logout API failures and clear client cookies anyway
    } finally {
      eraseCookie('grademind_auth');
      eraseCookie('grademind_refresh_token');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('grademind_user');
        window.location.href = '/login';
      }
    }
  },

  isAuthenticated: () => {
    if (hasDemoSession()) {
      return true;
    }

    return !!getCookie('grademind_auth');
  }
};
