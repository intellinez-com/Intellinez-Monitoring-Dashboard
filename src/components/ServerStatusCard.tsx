import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FileText, Pencil, Trash, Network, Clock, Server, ChevronDown, ChevronUp, Circle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface ServerMetrics {
  id: string;
  hostname: string;
  detected_hostname: string | null;
  ip_address: string;
  os: string | null;
  cpu_percent: number | null;
  memory_percent: number | null;
  memory_total_gb: number | null;
  disk_percent: number | null;
  disk_total_gb: number | null;
  disk_used_gb: number | null;
  disk_free_gb: number | null;
  network_sent_mb: number | null;
  network_recv_mb: number | null;
  running_processes: number | null;
  health_status: "Healthy" | "Degraded" | "Offline" | "Intermittent";
  checked_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ServerStatusCardProps {
  server: ServerMetrics;
  onDelete: (id: string) => void;
  onUpdate: (server: ServerMetrics) => void;
  isMonitoring: boolean;
}

export function ServerStatusCard({ server, onDelete, onUpdate, isMonitoring }: ServerStatusCardProps) {
  const navigate = useNavigate();
  const [showMetrics, setShowMetrics] = useState(false);

  const statusColor = {
    Healthy: "text-emerald-500",
    Degraded: "text-yellow-500",
    Offline: "text-red-500",
    Intermittent: "text-orange-500"
  }[server.health_status];

  const handleViewLogs = () => {
    navigate(`/server-logs/${server.id}`, {
      state: { serverName: server.hostname },
    });
  };

  return (
    <TooltipProvider>
      <Card className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-lg",
        server.health_status.toLowerCase() === "offline" && "animate-pulse-fast",
        !isMonitoring && "filter grayscale-[0.7]"
      )}>
        <div
          className={cn(
            "absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-30 blur-2xl pointer-events-none",
            server.health_status === "Healthy" && "bg-emerald-200",
            server.health_status === "Degraded" && "bg-yellow-200",
            server.health_status === "Offline" && "bg-red-200",
            server.health_status === "Intermittent" && "bg-gray-200"
          )}
        />
        <div
          className={cn(
            "absolute -bottom-10 -left-10 w-60 h-28 rounded-full opacity-30 blur-2xl pointer-events-none",
            server.health_status === "Healthy" && "bg-emerald-200",
            server.health_status === "Degraded" && "bg-yellow-200",
            server.health_status === "Offline" && "bg-red-200",
            server.health_status === "Intermittent" && "bg-gray-200"
          )}
        />

        <CardHeader className="px-4">
          <div className="flex justify-between items-start space-x-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <CardTitle className="font-semibold text-xl tracking-tight truncate text-zinc-800 dark:text-zinc-100">
                  {server.hostname}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2 group/url">
                <Network className="h-4 w-4 text-muted-foreground/70" />
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate max-w-[220px] group-hover/url:text-foreground transition-colors">
                    {server.ip_address}
                  </p>
                </div>
              </div>
            </div>
            <div
              className={cn(
                "px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm border",
                {
                  "bg-emerald-100 border-emerald-200": server.health_status === "Healthy",
                  "bg-yellow-100 border-yellow-200": server.health_status === "Degraded",
                  "bg-red-100 border-red-200": server.health_status === "Offline",
                  "bg-orange-100 border-orange-200": server.health_status === "Intermittent"
                },
                "transition-all duration-300"
              )}
            >
              <Circle className={cn("h-2.5 w-2.5 fill-current", statusColor)} />
              <span className={cn("capitalize text-sm font-medium", statusColor)}>
                {server.health_status}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-4 grid gap-4">
          <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>
                Last checked:{" "}
                <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                  {server.checked_at ? new Date(server.checked_at).toLocaleTimeString() : "Never"}
                </span>
              </span>
            </div>
            <div className="flex items-center justify-end gap-2">
              <span>
                Processes:{" "}
                <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                  {server.running_processes || 0}
                </span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-1 text-xs sm:text-xs text-zinc-600 dark:text-zinc-300 leading-tight">
            <div className="flex items-center justify-between">
              <span className="font-semibold">OS:</span>
              <span className="font-bold text-zinc-700 dark:text-zinc-200">
                {server.os || "Unknown"}
              </span>
            </div>
            {server.detected_hostname && (
              <div className="flex items-center justify-between">
                <span className="font-semibold">Detected Hostname:</span>
                <span className="font-bold text-zinc-700 dark:text-zinc-200">
                  {server.detected_hostname}
                </span>
              </div>
            )}
          </div>

          <div className="border-t pt-2">
              
            <Button
              variant="ghost"
              size="sm"
              className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowMetrics(!showMetrics)}
            >
              <span>Resource Usage</span>
              {showMetrics ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {showMetrics && (
              <div className="mt-2 space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>CPU Usage</span>
                    <span className="font-mono">{server.cpu_percent || 0}%</span>
                  </div>
                  <Progress value={server.cpu_percent || 0} className="h-1.5" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Memory Usage</span>
                    <span className="font-mono">{server.memory_percent || 0}%</span>
                  </div>
                  <Progress value={server.memory_percent || 0} className="h-1.5" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Disk Usage</span>
                    <span className="font-mono">{server.disk_percent || 0}%</span>
                  </div>
                  <Progress value={server.disk_percent || 0} className="h-1.5" />
                </div>
              </div>
            )}
            <div className={cn(
            "rounded-md flex items-center justify-end gap-3 duration-300"
          )}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleViewLogs}
                  className="h-8 w-8  rounded-full hover:bg-blue-100 hover:text-blue-700 transition"
                >
                  <FileText className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View logs</TooltipContent>
            </Tooltip>
          </div>
          </div>

          {/* this code has to be retained for now as it might be asked to add during testing */}
          {/* <div className={cn(
            "rounded-md flex items-center justify-end gap-3 duration-300 mt-0"
          )}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleViewLogs}
                  className="h-8 w-8  rounded-full hover:bg-blue-100 hover:text-blue-700 transition"
                >
                  <FileText className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View logs</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onUpdate(server)}
                  className="h-8 w-8 rounded-full hover:bg-emerald-100 hover:text-emerald-700 transition"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(server.id)}
                  className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-700 transition"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </div> */}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
} 