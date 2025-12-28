'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  signInUser, 
  signUpUser, 
  signOutUser, 
  addUser,
  getUserData,
  app
} from '@/lib/firebase';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';

interface AuthContextType {
  currentUser: User | null;
  userDoc: any;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Initialize auth with the app instance
  const auth = getAuth(app);

  useEffect(() => {
    let isMounted = true;
    
    // Initialize loading to true
    setLoading(true);
    
    // Set a timer to ensure loading state doesn't get stuck
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('Auth state timeout reached, setting loading to false');
        setLoading(false);
      }
    }, 5000); // 5 seconds timeout
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (isMounted) {
        // Clear the timeout since we received auth state
        clearTimeout(timeoutId);
        
        setCurrentUser(user);
        
        if (user) {
          // Fetch user document from Firestore
          try {
            const userData = await getUserData(user.uid);
            if (isMounted) setUserDoc(userData);
          } catch (error) {
            console.error("Error fetching user data:", error);
          }
        } else {
          if (isMounted) setUserDoc(null);
        }
        
        // Set loading to false after getting the auth state
        if (isMounted) {
          setLoading(false);
        }
      }
    });

    // Handle case where onAuthStateChanged doesn't fire immediately
    const initialCheckTimeout = setTimeout(() => {
      if (isMounted) {
        // Firebase is initialized but auth state didn't change, set loading to false
        setLoading(false);
      }
    }, 1000);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      clearTimeout(initialCheckTimeout);
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const user = await signInUser(email, password);
      // Fetch user document after login
      const userData = await getUserData(user.uid);
      setUserDoc(userData);
      setCurrentUser(user);
      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, displayName?: string) => {
    setLoading(true);
    try {
      const user = await signUpUser(email, password, displayName);
      // Create user document in Firestore
      const userData = {
        email: user.email,
        createdAt: new Date().toISOString(),
        displayName: displayName || user.email?.split('@')[0] || 'User',
        uid: user.uid
      };
      await addUser(user.uid, userData);
      setUserDoc(userData);
      setCurrentUser(user);
      return user;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOutUser();
      setCurrentUser(null);
      setUserDoc(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    userDoc,
    login,
    signup,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}