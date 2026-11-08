import { apiRequest, setAuthToken, clearAuthToken } from './client';

export interface User {
  id: number;
  username: string;
  email: string;
  daily_pushup_goal: number;
  daily_egg_goal: number;
  daily_protein_goal: number;
  has_pin: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export const registerUser = async (username: string, email: string, password: string): Promise<AuthResponse> => {
  const data = await apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: { username, email, password },
    auth: false,
  });
  if (data.token) {
    await setAuthToken(data.token);
  }
  return data;
};

export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  const data = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });
  if (data.token) {
    await setAuthToken(data.token);
  }
  return data;
};

export const pinLoginUser = async (email: string, pin: string): Promise<AuthResponse> => {
  const data = await apiRequest<AuthResponse>('/auth/pin-login', {
    method: 'POST',
    body: { email, pin },
    auth: false,
  });
  if (data.token) {
    await setAuthToken(data.token);
  }
  return data;
};

export const setUserPin = async (pin: string): Promise<{ success: boolean; message: string }> => {
  return await apiRequest('/auth/set-pin', {
    method: 'POST',
    body: { pin },
  });
};

export const getProfile = async (): Promise<{ success: boolean; user: User }> => {
  return await apiRequest('/auth/profile', { method: 'GET' });
};

export const updateGoals = async (goals: {
  daily_pushup_goal?: number;
  daily_egg_goal?: number;
  daily_protein_goal?: number;
}): Promise<{ success: boolean; message: string; user: User }> => {
  return await apiRequest('/auth/goals', {
    method: 'PUT',
    body: goals,
  });
};

export const logoutUser = async () => {
  await clearAuthToken();
};
