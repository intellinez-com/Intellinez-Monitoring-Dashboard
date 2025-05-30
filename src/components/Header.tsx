import { Bell, Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { toast } from "./ui/use-toast";
import { useUser } from "@/hooks/useUser";

export function Header() {
  const navigate = useNavigate();

  const user = useUser()


const handleLogout = async () => {
  try {
    // Get user details before signing out
    const { data: { user } } = await supabase.auth.getUser();

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      console.error("Error logging out:", signOutError.message);
      toast({
        title: "Error",
        description: "Could not Logout",
        variant: "destructive",
      });
      return;
    }

    // Log the logout activity
    if (user) {
      const now = new Date().toISOString();

      const newLogEntry = {
        user_id: user.id,
        action: 'logout',
        device_info: null, // Or fetch device info if available
        ip_address: null, // Or fetch IP address if available
        location: 'Mohali', // Or fetch location if available
        interaction_duration: '0', // Or calculate session duration
        created_at: now,
      };

      const { error: logError } = await supabase
        .from('user_monitoring_log')
        .insert([newLogEntry]);

      if (logError) {
        console.error("Error inserting logout log:", logError);
        toast({
          title: "Error",
          description: "Logged out, but could not log activity",
          variant: "destructive",
        });
      }
    }
      localStorage.removeItem('is_Monitoring');
    toast({
      title: "Success",
      description: "Logged Out Successfully",
      variant: "success",
    });
    navigate("/login");
  } catch (error) {
    console.error("Error during logout:", error);
    toast({
      title: "Error",
      description: "Could not Logout",
      variant: "destructive",
    });
  }
};

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center border-b bg-background px-4 md:px-6">
      
      <div className="flex flex-1 items-center justify-end gap-4 md:justify-end">
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <span className="text-sm font-medium">
                  <User />
                </span>
              </div>
              <span className="hidden sm:inline-block">{user.email}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* <DropdownMenuLabel>Navigation</DropdownMenuLabel> */}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/">Dashboard</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/websites">Websites</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/servers">Servers</Link>
            </DropdownMenuItem>
            {/* <DropdownMenuItem asChild>
              <Link to="/databases">Databases</Link>
            </DropdownMenuItem> */}
            <DropdownMenuItem asChild >
              <Link to="/metrics">Metrics</Link>
            </DropdownMenuItem>
            {/* <DropdownMenuItem asChild>
              <Link to="/alerts">Alerts</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem> */}
            <DropdownMenuItem onClick={handleLogout} className="bg-primary/10" >Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
