// src/pages/Login.tsx
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

const handleLogin = async () => {
  setLoading(true);
  setErrorMsg('');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError) {
    setErrorMsg(authError.message);
    toast({
      title: "Error",
      description: "Could not Login",
      variant: "destructive",
    });
  } else {
    // Get user details
    const user = authData.user;
    const now = new Date().toISOString();

    // Get device info (example, you might need a library for this)
    const deviceInfo = ""

    // Get IP address (example, you might need an external service for this)
    const ipAddress = ""

    // Get location (example, you might need an external service for this)
    const location = 'Mohali'; // Replace with actual location data if available

    const newLogEntry = {
      user_id: user.id,
      action: 'login',
      device_info: deviceInfo,
      ip_address: ipAddress,
      location: location,
      interaction_duration: '0', // Initial value, update later
      created_at: now,
    };

    const { error: logError } = await supabase
      .from('user_monitoring_log')
      .insert([newLogEntry]);

    if (logError) {
      console.error("Error inserting login log:", logError);
      toast({
        title: "Error",
        description: "Login Successful, but could not log activity",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Login Successful",
        variant: "success",
      });
    }
    navigate('/');  // or use react-router's navigate
  }
  setLoading(false);
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Login</h2>
        {errorMsg && <p className="text-red-500 mb-2">{errorMsg}</p>}
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 mb-3 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 mb-4 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </div>
    </div>
  );
}
