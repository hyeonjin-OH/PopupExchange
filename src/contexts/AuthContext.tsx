"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface AppUser extends FirebaseUser {
  username?: string;
  role?: 'user' | 'admin';
}

interface AuthContextType {
  user: AppUser | null;
  username: string | null;
  role: 'user' | 'admin' | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  username: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<'user' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        let appUserData: AppUser = { ...firebaseUser };

        if (userDoc.exists()) {
          const firestoreData = userDoc.data();
          appUserData = {
            ...appUserData,
            username: firestoreData.username,
            role: firestoreData.role,
          };
          setUsername(firestoreData.username || null);
          setRole(firestoreData.role || null);
        } else {
          console.warn("User exists in Auth but not in Firestore:", firebaseUser.uid);
          setUsername(null);
          setRole(null);
        }
        setUser(appUserData);
      } else {
        setUser(null);
        setUsername(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setUsername(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, username, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 