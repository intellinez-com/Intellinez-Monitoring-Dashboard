import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Server, Circle, ArrowUp, ArrowDown, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface ServerStatusCardProps {
  server: {
    id: string;
    proxy_ip: string;
    port: number;
    type: 'HTTP' | 'HTTPS' | 'SOCKS4' | 'SOCKS5';
    auth_required: boolean;
    username: string | null;
    is_active: boolean;
    last_checked: string | null;
    response_time_ms: number | null;
    status: 'online' | 'offline' | 'slow' | 'unreachable';
    created_at: string;
    created_by: string | null;
    server_monitoring_logs?: {
      status: string;
      response_time_ms: number | null;
      status_code: number | null;
      error_message: string | null;
      checked_at: string;
    }[];
  };
  onDelete: () => void;
  onUpdate: () => void;
  isMonitoring: boolean;
}

export function ServerStatusCard({ server, onDelete, onUpdate, isMonitoring }: ServerStatusCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  const statusColor = {
    online: "text-emerald-500",
    offline: "text-red-500",
    slow: "text-yellow-500",
    unreachable: "text-gray-500"
  };

  const statusBgColor = {
    online: "bg-emerald-100",
    offline: "bg-red-100",
    slow: "bg-yellow-100",
    unreachable: "bg-gray-100"
  };

  const statusTextColor = {
    online: "text-emerald-800",
    offline: "text-red-800",
    slow: "text-yellow-800",
    unreachable: "text-gray-800"
  };
  
  const getLatestMetrics = () => {
    if (!server.server_monitoring_logs || server.server_monitoring_logs.length === 0) {
      return {
        responseTime: null,
        statusCode: null,
        errorMessage: null,
        checkedAt: server.last_checked
      };
    }

    const latestLog = server.server_monitoring_logs[0];
    return {
      responseTime: latestLog.response_time_ms,
      statusCode: latestLog.status_code,
      errorMessage: latestLog.error_message,
      checkedAt: latestLog.checked_at
    };
  };

  const metrics = getLatestMetrics();
  
  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-200 border-l-4",
      server.status === "online" && "border-l-emerald-500",
      server.status === "offline" && "border-l-red-500 animate-pulse-fast",
      server.status === "slow" && "border-l-yellow-500 animate-pulse-mid",
      server.status === "unreachable" && "border-l-gray-500",
    )}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            <CardTitle className="text-lg">{server.proxy_ip}:{server.port}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Circle className={cn("h-3 w-3 fill-current", statusColor[server.status])} />
            <span className={cn("text-sm font-medium capitalize", statusColor[server.status])}>
              {server.status}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onUpdate}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <CardDescription className="flex justify-between">
          <span>{server.type}</span>
          <span>Last check: {metrics.checkedAt ? new Date(metrics.checkedAt).toLocaleTimeString() : 'Never'}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Response Time</span>
            <span className="font-medium">
              {metrics.responseTime ? `${metrics.responseTime}ms` : 'N/A'}
            </span>
          </div>
          {metrics.responseTime && (
            <Progress
              value={Math.min((metrics.responseTime / 1000) * 100, 100)}
              className={cn(
                "h-2",
                metrics.responseTime < 200 ? "bg-emerald-100" :
                metrics.responseTime < 500 ? "bg-yellow-100" : "bg-red-100"
              )}
            />
          )}
          {metrics.statusCode && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Status Code</span>
              <span className={cn(
                "font-medium",
                metrics.statusCode >= 200 && metrics.statusCode < 300 ? "text-emerald-500" :
                metrics.statusCode >= 300 && metrics.statusCode < 400 ? "text-yellow-500" :
                "text-red-500"
              )}>
                {metrics.statusCode}
              </span>
            </div>
          )}
          {metrics.errorMessage && (
            <div className="text-sm text-red-500 mt-2">
              Error: {metrics.errorMessage}
            </div>
          )}
          {server.auth_required && (
            <div className="text-sm text-muted-foreground mt-2">
              Auth Required: {server.username || 'No username set'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 