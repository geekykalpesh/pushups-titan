import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User,
  loginUser,
  registerUser,
  pinLoginUser,
  setUserPin as apiSetUserPin,
  getProfile,
  logoutUser,
} from '../api/authApi';
import { getAuthToken } from '../api/client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isPinLocked: boolean;
  savedEmail: string | null;
  hasPinConfigured: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (username: string, email: string, pass: string) => Promise<void>;
  unlockWithPin: (pin: string) => Promise<boolean>;
  unlockWithBiometrics: () => Promise<boolean>;
  setupPin: (pin: string) => Promise<void>;
  logout: () => Promise<void>;
  lockWithPin: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SAVED_EMAIL_KEY = '@pushup_saved_email';
const HAS_PIN_KEY = '@pushup_has_pin';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPinLocked, setIsPinLocked] = useState(false);
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const [hasPinConfigured, setHasPinConfigured] = useState(false);

  useEffect(() => {
    checkInitialAuth();
  }, []);

  const checkInitialAuth = async () => {
    try {
      setIsLoading(true);
      const email = await AsyncStorage.getItem(SAVED_EMAIL_KEY);
      const hasPin = (await AsyncStorage.getItem(HAS_PIN_KEY)) === 'true';
      const token = await getAuthToken();

      setSavedEmail(email);
      setHasPinConfigured(hasPin);

      if (token) {
        if (hasPin) {
          // Require 4-digit PIN unlock on app open!
          setIsPinLocked(true);
        } else {
          // Attempt to fetch profile
          try {
            const res = await getProfile();
            if (res.success && res.user) {
              setUser(res.user);
              if (res.user.has_pin) {
                setHasPinConfigured(true);
                await AsyncStorage.setItem(HAS_PIN_KEY, 'true');
              }
            }
          } catch {
            // Token may be invalid/expired
          }
        }
      } else if (email && hasPin) {
        setIsPinLocked(true);
      }
    } catch (err) {
      console.warn('Initial auth check error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, pass: string) => {
    const res = await loginUser(email, pass);
    setUser(res.user);
    setSavedEmail(res.user.email);
    setHasPinConfigured(res.user.has_pin);

    await AsyncStorage.setItem(SAVED_EMAIL_KEY, res.user.email);
    await AsyncStorage.setItem(HAS_PIN_KEY, res.user.has_pin ? 'true' : 'false');
    setIsPinLocked(false);
  };

  const register = async (username: string, email: string, pass: string) => {
    const res = await registerUser(username, email, pass);
    setUser(res.user);
    setSavedEmail(res.user.email);
    setHasPinConfigured(false);

    await AsyncStorage.setItem(SAVED_EMAIL_KEY, res.user.email);
    await AsyncStorage.setItem(HAS_PIN_KEY, 'false');
    setIsPinLocked(false);
  };

  const unlockWithPin = async (pin: string): Promise<boolean> => {
    const emailToUse = savedEmail || user?.email;
    if (!emailToUse) return false;

    try {
      const res = await pinLoginUser(emailToUse, pin);
      setUser(res.user);
      setIsPinLocked(false);
      return true;
    } catch {
      return false;
    }
  };

  const unlockWithBiometrics = async (): Promise<boolean> => {
    // Biometric fingerprint emulation / fallback to stored authentication token
    try {
      const token = await getAuthToken();
      if (!token) return false;
      const res = await getProfile();
      if (res.success && res.user) {
        setUser(res.user);
        setIsPinLocked(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const setupPin = async (pin: string) => {
    await apiSetUserPin(pin);
    setHasPinConfigured(true);
    await AsyncStorage.setItem(HAS_PIN_KEY, 'true');
    if (user) {
      setUser({ ...user, has_pin: true });
    }
  };

  const lockWithPin = () => {
    if (hasPinConfigured) {
      setIsPinLocked(true);
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      await AsyncStorage.removeItem(SAVED_EMAIL_KEY);
      await AsyncStorage.removeItem(HAS_PIN_KEY);
    } catch (e) {
      console.warn('Logout error:', e);
    }
    setUser(null);
    setSavedEmail(null);
    setHasPinConfigured(false);
    setIsPinLocked(false);
  };

  const refreshUser = async () => {
    try {
      const res = await getProfile();
      if (res.success && res.user) {
        setUser(res.user);
      }
    } catch (err) {
      console.warn('Refresh user error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isPinLocked,
        savedEmail,
        hasPinConfigured,
        login,
        register,
        unlockWithPin,
        unlockWithBiometrics,
        setupPin,
        logout,
        lockWithPin,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
