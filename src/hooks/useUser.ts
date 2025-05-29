import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User } from '@supabase/supabase-js';

interface UserHookReturn {
  user: User | null;
  email: string | null;
  loading: boolean;
  error: Error | null;
}

export const useUser = (): UserHookReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        setUser(data?.user ?? null);
      } catch (err) {
        setError(err as Error);
        console.error("Error fetching user:", err);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, []);

  return {
    user,
    email: user?.email ?? null,
    loading,
    error
  };
};