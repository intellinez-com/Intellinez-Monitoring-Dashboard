// src/components/ProtectedRoute.tsx
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      setAuthenticated(!!data.session?.user);
      setLoading(false);
    };

    checkSession();
  }, []);

  if (loading) return <div className="p-4">Checking authentication...</div>;

  return authenticated ? children : <Navigate to="/login" replace />;
}
