import { createContext, useEffect, useState, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role: 'student' | 'teacher' | 'admin'
  ) => Promise<{ needsEmailConfirmation: boolean }>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(async ({ data: { session }, error: sessionError }) => {
      if (!isMounted) return;
      if (sessionError) {
        console.error('getSession error:', sessionError);
        setError(sessionError);
        setLoading(false);
        return;
      }
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      })();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (err: unknown) {
      console.error('Error loading profile:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: 'student' | 'teacher' | 'admin'
  ): Promise<{ needsEmailConfirmation: boolean }> => {
    // Pass full_name and role as user metadata.
    // The database trigger (handle_new_user) will read these and create the profile row
    // automatically — even when email confirmation is required and there is no active session.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Redirect back to this app after email confirmation.
        // In development this will be http://localhost:5173 (or whichever port Vite uses).
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
          role,
        },
      },
    });

    if (error) throw error;

    // If session is null after signUp, Supabase requires email confirmation.
    // The database trigger (handle_new_user) already created the profile row
    // using the metadata we passed above, so no manual insert is needed.
    const needsEmailConfirmation = !data.session;

    return { needsEmailConfirmation };
  };

  const verifyOtp = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (error) throw error;
    // onAuthStateChange fires → profile loaded → App routes to Dashboard
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, error, signIn, signUp, verifyOtp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
