import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useServersByStatus } from "@/hooks/useServersByStatus";
import { CircleCheck, CircleAlert, Circle, Activity, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
interface ServerListModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: "all" | "healthy" | "degraded" | "offline" | "intermittent";
  title: string;
}

export function ServerListModal({ isOpen, onClose, status, title }: ServerListModalProps) {
  const navigate = useNavigate();
  const { servers, loading, error } = useServersByStatus(
    status === "all" ? "" : status.charAt(0).toUpperCase() + status.slice(1)
  );
  // console.log(servers);
  const getStatusIcon = (healthStatus: string) => {
    switch (healthStatus.toLowerCase()) {
      case "healthy":
        return <CircleCheck className="h-4 w-4 text-status-healthy" />;
      case "degraded":
        return <CircleAlert className="h-4 w-4 text-status-warning" />;
      case "offline":
        return <CircleAlert className="h-4 w-4 text-status-critical" />;
      case "intermittent":
        return <CircleAlert className="h-4 w-4 text-gray-500" />;
      default:
        return <Circle className="h-4 w-4 text-status-unknown" />;
    }
  };

  const getStatusColor = (healthStatus: string) => {
    switch (healthStatus.toLowerCase()) {
      case "healthy":
        return "bg-green-50 text-green-700 border-green-200";
      case "degraded":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "offline":
        return "bg-red-50 text-red-700 border-red-200";
      case "intermittent":
        return "bg-gray-50 text-gray-700 border-gray-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };


  const handleViewLogs = (server) => {
    navigate(`/server-logs/${server.ip_address}`, {
      state: { serverName: server.server_name },
    });
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            {status !== "all" && getStatusIcon(status)}
            {title} Servers
            {!loading && (
              <Badge variant="secondary" className="ml-2">
                {servers.length}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full pr-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Activity className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading servers...</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-8 text-red-600">
                <p>Error loading servers: {error}</p>
              </div>
            ) : servers.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <p>No servers found for this status</p>
              </div>
            ) : (
              <div className="space-y-3 pb-4">
                {servers.map((server) => (
                  <div
                    key={server.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-sm">{server.server_name}</h3>
                        <p className="text-xs text-muted-foreground">
                          IP: {server.ip_address}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn("text-xs", getStatusColor(server.health_status))}
                        >
                          {server.health_status}
                        </Badge>
                      </div>
                      {/* <h3 className="font-medium text-sm">{server.hostname}</h3> */}
                      <p className="text-xs text-muted-foreground">
                        Hostname: {server.hostname}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        OS: {server.os}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>CPU: {server.cpu_percent}%</span>
                        <span>Memory: {server.memory_percent}%</span>
                        <span>Disk: {server.disk_percent}%</span>
                        {server.checked_at && (
                          <span>
                            Last checked: {new Date(server.checked_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-8 w-8 p-0"
                        onClick={() => { handleViewLogs(server) }}
                      >
                        <a href='' title="Go to Logs" >
                        {/*navigate(`/server-logs/${server.ip_address}`, {state: { serverName: server.server_name },});*/}
                        <FileText className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="flex justify-end pt-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 