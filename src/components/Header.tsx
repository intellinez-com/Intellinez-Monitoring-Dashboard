import {User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConnectionStatus } from "@/components/ConnectionStatus";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { toast } from "./ui/use-toast";
import { useUser } from "@/hooks/useUser";
import { useSession } from "../contexts/SessionContext";

export function Header() {
  const navigate = useNavigate();
  const user = useUser();
  const { sessionInfo, clearSessionInfo } = useSession();

  const handleLogout = async () => {
    try {
      // Get user details before signing out
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw userError;
      }

      if (!currentUser) {
        throw new Error("No user found");
      }

      // Prepare log entry before signing out
      const now = new Date().toISOString();
      const logEntry = {
        user_id: currentUser.id,
        action: 'logout',
        ip_address: sessionInfo?.ip || '',
        location: sessionInfo?.location || '',
        created_at: now,
      };


      // Insert the log entry
      const { error: logError } = await supabase
        .from('user_monitoring_log')
        .insert([logEntry]);

      if (logError) {
        console.error("❌ Error logging logout activity:", logError.message);
        // Don't throw here, continue with logout
      } else {
        console.log("✅ Logout activity logged successfully");
      }

      // Perform the actual sign out
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        console.error("❌ Error during sign out:", signOutError.message);
        throw signOutError;
      }


      // Clear local storage and session info
      localStorage.removeItem('is_Monitoring_websites');
      clearSessionInfo();

      toast({
        title: "Success",
        description: "Logged Out Successfully",
        variant: "success",
      });

      navigate("/login");
    } catch (error) {
      console.error("❌ Error during logout process:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not Logout",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center border-b bg-background px-4 md:px-6">
      <div className="flex flex-1 items-center justify-end gap-4 md:justify-end">
        <ConnectionStatus variant="full" />
        
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
            <DropdownMenuItem asChild >
              <Link to="/metrics">Metrics</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="bg-primary/10">Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
