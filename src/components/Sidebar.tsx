
import { useEffect,useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ActivitySquare, Monitor, Server, Database, BarChart, Bell, Home, User } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/hooks/useUser";
import intellinez_logo from "../images/intellinez-logo.svg"

export function Sidebar() {
  const location = useLocation();
  
  const links = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Websites", href: "/websites", icon: Monitor },
    { name: "Servers", href: "/servers", icon: Server },
    // { name: "Databases", href: "/databases", icon: Database },
    { name: "Metrics", href: "/metrics", icon: BarChart },
    // { name: "Alerts", href: "/alerts", icon: Bell },
  ];


 const {email} = useUser();

  return (
    <div className="hidden border-r bg-muted/40 sm:flex sm:w-50 sm:flex-col w-52">
      <div className="flex h-20 items-center justify-center">
        <Link to="/">
         <img src={intellinez_logo} className="w-44"/>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-4 py-2">
        {links.map((link) => (
          <Link
            key={link.name}
            to={link.href}
            className={cn(
              "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
              link.href === location.pathname
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted hover:text-foreground"
            )}
          >
            <link.icon className="mr-3 h-5 w-5" />
            {link.name}
          </Link>
        ))}
      </nav>
      {/* <div className="border-t p-4">
        <div className="flex items-center gap-3 rounded-md bg-muted/60 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="text-sm font-medium"><User/></span>
          </div>
          {/* <div>
            <p className="text-xs font-medium">Admin User</p>
            <p className="text-xs text-muted-foreground">{email}</p>
          </div> 
        </div>
      // </div> */}
    </div>
  );
}


