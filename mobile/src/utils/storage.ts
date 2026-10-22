import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'miniledger_auth_token';
const USER_KEY = 'miniledger_user_profile';

// In-memory fallback if neither SecureStore nor localStorage is available
const memoryStorage: Record<string, string> = {};

export const storage = {
  async setToken(token: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(TOKEN_KEY, token);
        } else {
          memoryStorage[TOKEN_KEY] = token;
        }
      } else {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      }
    } catch (error) {
      memoryStorage[TOKEN_KEY] = token;
    }
  },

  async getToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(TOKEN_KEY);
        }
        return memoryStorage[TOKEN_KEY] || null;
      } else {
        return await SecureStore.getItemAsync(TOKEN_KEY);
      }
    } catch (error) {
      return memoryStorage[TOKEN_KEY] || null;
    }
  },

  async removeToken(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(TOKEN_KEY);
        }
        delete memoryStorage[TOKEN_KEY];
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    } catch {
      delete memoryStorage[TOKEN_KEY];
    }
  },

  async setUser(user: any): Promise<void> {
    const serialized = JSON.stringify(user);
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(USER_KEY, serialized);
        } else {
          memoryStorage[USER_KEY] = serialized;
        }
      } else {
        await SecureStore.setItemAsync(USER_KEY, serialized);
      }
    } catch {
      memoryStorage[USER_KEY] = serialized;
    }
  },

  async getUser(): Promise<any | null> {
    try {
      let raw: string | null = null;
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          raw = window.localStorage.getItem(USER_KEY);
        } else {
          raw = memoryStorage[USER_KEY] || null;
        }
      } else {
        raw = await SecureStore.getItemAsync(USER_KEY);
      }
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async clearAll(): Promise<void> {
    await this.removeToken();
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(USER_KEY);
        }
      } else {
        await SecureStore.deleteItemAsync(USER_KEY);
      }
    } catch {}
  },
};
