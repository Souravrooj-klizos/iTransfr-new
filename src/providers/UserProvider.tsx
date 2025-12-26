'use client';

import { createClient } from '@/lib/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useRef, useState } from 'react';

interface UserContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();
  const mounted = useRef(false);

  const fetchUser = async () => {
    try {
      const {
        data: { user: currentUser },
        error,
      } = await supabase.auth.getUser();
      if (currentUser) {
        setUser(currentUser);
        // If we have a user, try to get the session too
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();
        setSession(currentSession);
      } else {
        setUser(null);
        setSession(null);
      }
    } catch (error) {
      console.error('Error in UserProvider:', error);
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Prevent double fetch in StrictMode and ensure we only start listeners once
    if (mounted.current) return;
    mounted.current = true;

    // Initial fetch
    fetchUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // If we receive a session from the event, update state directly
      // This avoids needing to call fetchUser() again
      if (session?.user) {
        setUser(session.user);
        setSession(session);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        setLoading(false);
        router.push('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
      mounted.current = false;
    };
  }, [router, supabase]);

  // Redirect unauthenticated users away from protected routes
  useEffect(() => {
    if (!loading && !user) {
      // Check if we're on a client route that requires authentication
      const clientRoutes = [
        '/dashboard',
        '/balance',
        '/deposit',
        '/recipients',
        '/send',
        '/team',
        '/transactions',
      ];
      const currentPath = window.location.pathname;

      if (clientRoutes.some(route => currentPath.startsWith(route))) {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <UserContext.Provider value={{ user, session, loading, refreshUser: () => fetchUser() }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
