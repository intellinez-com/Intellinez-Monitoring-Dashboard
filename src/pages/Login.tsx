// src/pages/Login.tsx
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import logo from '../images/intellinez-logo.svg';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const fetchIpAndLocation = async () => {
    try {
      const res = await fetch('https://ipapi.co/json/'); // or 'https://ipinfo.io/json'
      const data = await res.json();
      return {
        ip: data.ip,
        location: `${data.city}, ${data.region}, ${data.country_name}`,
      };
    } catch (error) {
      console.error("Error fetching IP/location:", error);
      return {
        ip: '',
        location: '',
      };
    }
  };
   
  

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
      const {ip, location} = await fetchIpAndLocation();

      // Get IP address (this will be logged on the server side)
      const ipAddress = ip;

      // Get location (this should be handled securely on the server side)
      const loc = location;

      const newLogEntry = {
        user_id: user.id,
        action: 'login',
        ip_address: ipAddress,
        location: loc,
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
      navigate('/');
    }
    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md px-4">
        {/* Logo Section */}
        <div className="flex justify-center mb-8">
          <div className="flex flex-col items-center">
            {/* Replace the src with your company logo */}
            <img
              src={logo}
              alt="Company Logo"
              className="h-16 w-auto mb-2"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/fallback-logo.png'; // Provide a fallback logo
                target.onerror = null; // Prevent infinite loop
              }}
            />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              Monitoring Dashboard
            </h1>
          </div>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Enter your credentials to access the monitoring dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {errorMsg && (
                <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm p-3 rounded-md">
                  {errorMsg}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Login to Dashboard'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}