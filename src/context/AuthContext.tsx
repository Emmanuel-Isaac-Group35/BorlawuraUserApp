import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-navigation/native'; // Fallback to a mock or use actual AsyncStorage

// Using direct AsyncStorage from package if possible
import RNAsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  isLoggedIn: boolean;
  user: any;
  login: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for persisted login state
    const checkAuth = async () => {
      try {
        const storedUser = await RNAsyncStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          setIsLoggedIn(true);
        }
      } catch (e) {
        console.error('Failed to load auth state', e);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (userData: any) => {
    try {
      await RNAsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setIsLoggedIn(true);
    } catch (e) {
      console.error('Failed to save auth state', e);
    }
  };

  const logout = async () => {
    try {
      await RNAsyncStorage.removeItem('user');
      setUser(null);
      setIsLoggedIn(false);
    } catch (e) {
      console.error('Failed to clear auth state', e);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
