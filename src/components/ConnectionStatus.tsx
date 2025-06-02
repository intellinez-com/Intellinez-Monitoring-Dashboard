import React from "react";
import { Wifi, WifiOff, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";
import { Badge } from "@/components/ui/badge";

interface ConnectionStatusProps {
  showLabel?: boolean;
  variant?: "compact" | "full";
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  showLabel = false, 
  variant = "compact" 
}) => {
  const { isOnline, lastChecked } = useConnectionStatus();

  const getStatusIcon = () => {
    if (isOnline) {
      return <Wifi className="w-4 h-4 text-green-600" />;
    } else {
      return <WifiOff className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusText = () => {
    if (isOnline) {
      return "Connected";
    } else {
      return "Offline";
    }
  };

  const getStatusColor = () => {
    return isOnline 
      ? "bg-green-50 text-green-700 border-green-200"
      : "bg-red-50 text-red-700 border-red-200";
  };

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        {showLabel && (
          <span className={cn(
            "text-sm font-medium",
            isOnline ? "text-green-600" : "text-red-600"
          )}>
            {getStatusText()}
          </span>
        )}
      </div>
    );
  }

  return (
    <Badge variant="outline" className={cn("gap-1", getStatusColor())}>
      {getStatusIcon()}
      <span className="text-xs">
        {getStatusText()}
        {lastChecked && (
          <span className="ml-1 opacity-70">
            ({lastChecked.toLocaleTimeString()})
          </span>
        )}
      </span>
    </Badge>
  );
}; 