import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Production backend on Render
export const PRODUCTION_API_URL = 'https://pushups-titan.onrender.com/api';

// Candidate URLs in priority order:
// 1. Production Render Cloud API (HTTPS)
// 2. 127.0.0.1:5000 (Local USB with adb reverse)
// 3. 10.68.120.150:5000 (Local Wi-Fi)
// 4. 10.0.2.2:5000 (Android Emulator loopback)
export const CANDIDATE_URLS = [
  PRODUCTION_API_URL,
  'http://127.0.0.1:5000/api',
  'http://10.68.120.150:5000/api',
  Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api',
  'http://localhost:5000/api',
];

export const DEFAULT_API_URL = PRODUCTION_API_URL;

const API_BASE_KEY = '@pushup_api_base_url';
const TOKEN_KEY = '@pushup_auth_token';

let cachedBaseUrl: string | null = null;

// Probe an endpoint with quick timeout to verify if backend is reachable
const pingEndpoint = async (url: string, timeoutMs: number = 1500): Promise<boolean> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const healthUrl = `${url.replace(/\/+$/, '')}/health`;
    const res = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Automatically find the working backend URL for this device
 * Uses concurrent probing to find the fastest reachable server in <100ms
 */
export const autoDetectBaseUrl = async (): Promise<string> => {
  // Check if current cached URL is still healthy
  if (cachedBaseUrl && (await pingEndpoint(cachedBaseUrl, 1000))) {
    return cachedBaseUrl;
  }

  // Gather saved URL from AsyncStorage + predefined candidates
  let saved: string | null = null;
  try {
    saved = await AsyncStorage.getItem(API_BASE_KEY);
    if (saved && (await pingEndpoint(saved, 1000))) {
      cachedBaseUrl = saved;
      return saved;
    }
  } catch {}

  const allUrls = Array.from(
    new Set([...(saved ? [saved] : []), ...CANDIDATE_URLS])
  );

  // Probe all candidates in parallel; first healthy response wins immediately
  try {
    const fastest = await Promise.any(
      allUrls.map(async (url) => {
        const ok = await pingEndpoint(url, 1500);
        if (ok) return url;
        throw new Error(`Offline: ${url}`);
      })
    );

    cachedBaseUrl = fastest;
    await AsyncStorage.setItem(API_BASE_KEY, fastest).catch(() => {});
    console.log(`[API Client] Connected to backend at: ${fastest}`);
    return fastest;
  } catch {
    // If all fail, fallback to Production Cloud API
    const fallback = PRODUCTION_API_URL;
    cachedBaseUrl = fallback;
    return fallback;
  }
};

export const getBaseUrl = async (): Promise<string> => {
  if (cachedBaseUrl) {
    return cachedBaseUrl;
  }
  return await autoDetectBaseUrl();
};

export const setCustomBaseUrl = async (url: string) => {
  cachedBaseUrl = url;
  await AsyncStorage.setItem(API_BASE_KEY, url);
};

export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setAuthToken = async (token: string) => {
  await AsyncStorage.setItem(TOKEN_KEY, token);
};

export const clearAuthToken = async () => {
  await AsyncStorage.removeItem(TOKEN_KEY);
};

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  auth?: boolean;
  timeoutMs?: number;
}

export const apiRequest = async <T = any>(
  endpoint: string,
  options: RequestOptions = {},
  isRetry = false
): Promise<T> => {
  let baseUrl = await getBaseUrl();
  const token = await getAuthToken();
  const timeoutMs = options.timeoutMs || 8000;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  if (options.auth !== false && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl.replace(/\/+$/, '')}${cleanEndpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  const config: RequestInit = {
    method: options.method || 'GET',
    headers,
    signal: controller.signal,
  };

  if (options.body && options.method !== 'GET') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.message || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return data as T;
  } catch (err: any) {
    clearTimeout(timeoutId);

    // If fetch failed or timed out, attempt re-detecting URL and retry once
    if (!isRetry) {
      console.warn(`[API Client] Call to ${url} failed: ${err.message}. Re-detecting URL...`);
      const newUrl = await autoDetectBaseUrl();
      if (newUrl !== baseUrl) {
        return apiRequest<T>(endpoint, options, true);
      }
    }

    if (err.name === 'AbortError') {
      throw new Error(
        `Connection timed out (${Math.round(timeoutMs / 1000)}s) to server ${baseUrl}. Please check backend server status.`
      );
    }

    throw new Error(err.message || 'Network request failed. Please check server connection.');
  }
};
