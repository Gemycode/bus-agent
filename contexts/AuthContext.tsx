import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api';
import { User } from '../types';
import { ToastAndroid, Platform, Alert } from 'react-native';
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      const response = await apiService.getMe() as { data: { user: User } };
      setUser(response.data.user);
      // Attempt silent token refresh
      try {
        await apiService.refreshToken();
      } catch (error) {
        // console.error('Token refresh failed during auth check:', error);
      }
    }
  } catch (error) {
    // console.error('Auth check failed:', error);
    await AsyncStorage.removeItem('authToken');
  } finally {
    setIsLoading(false);
  }
};

useEffect(() => {
  const interval = setInterval(async () => {
    try {
      await apiService.refreshToken();
    } catch (error) {
      // console.error('Token refresh failed:', error);
    }
  }, 15 * 60 * 1000); // Refresh every 15 minutes

  return () => clearInterval(interval);
}, []);



const showToast = (message: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('Message', message);
  }
};


const login = async (email: string, password: string) => {
  try {
    const response = await apiService.login(email, password) as { data: { user: User; token: string } };
    
    // Check if response has the expected structure
    if (!response.data || !response.data.token) {
      throw new Error('Invalid response format from server');
    }
    
    await AsyncStorage.setItem('authToken', response.data.token);
    setUser(response.data.user);
  } catch (error: any) {
    showToast(error?.message || 'Login failed');
    throw error;
  }
};

const register = async (userData: any) => {
  try {
    // Try simple registration first (without image)
    const response = await apiService.registerSimple(userData) as { data: { user: User; token: string } };
    
    // Check if response has the expected structure
    if (!response.data || !response.data.token) {
      throw new Error('Invalid response format from server');
    }
    
    await AsyncStorage.setItem('authToken', response.data.token);
    setUser(response.data.user);
  } catch (error: any) {
    showToast(error?.message || 'Registration failed');
    throw error;
  }
};

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      setUser(null);
    } catch (error) {
      // console.error('Logout failed:', error);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;     
};