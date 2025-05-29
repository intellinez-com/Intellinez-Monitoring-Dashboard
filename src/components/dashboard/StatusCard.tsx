
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Server, Monitor, Database, Circle, ArrowUp, ArrowDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface StatusCardProps {
  name: string;
  type: "website" | "server" | "database";
  status: "healthy" | "warning" | "critical" | "unknown";
  uptime: number;
  responseTime?: number;
  lastCheck: string;
  metrics?: {
    name: string;
    value: number;
    max: number;
  }[];
}

export function StatusCard({
  name,
  type,
  status,
  uptime,
  responseTime,
  lastCheck,
  metrics
}: StatusCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  const statusColor = {
    healthy: "text-status-healthy",
    warning: "text-status-warning",
    critical: "text-status-critical",
    unknown: "text-status-unknown"
  };
  
  const getIcon = () => {
    switch (type) {
      case "website":
        return <Monitor className="h-5 w-5" />;
      case "server":
        return <Server className="h-5 w-5" />;
      case "database":
        return <Database className="h-5 w-5" />;
    }
  };
  
  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-200 border-l-4",
      status === "healthy" && "border-l-status-healthy",
      status === "warning" && "border-l-status-warning animate-pulse-mid",
      status === "critical" && "border-l-status-critical animate-pulse-fast",
      status === "unknown" && "border-l-status-unknown",
    )}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {getIcon()}
            <CardTitle className="text-lg">{name}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Circle className={cn("h-3 w-3 fill-current", statusColor[status])} />
            <span className={cn("text-sm font-medium capitalize", statusColor[status])}>
              {status}
            </span>
          </div>
        </div>
        <CardDescription className="flex justify-between">
          <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
          <span>Last check: {lastCheck}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm">Uptime: <span className="font-medium">{uptime}%</span></div>
          {responseTime && (
            <div className="text-sm">
              Response time: <span className="font-medium">{responseTime}ms</span>
            </div>
          )}
        </div>
        
        {expanded && metrics && (
          <div className="space-y-3 mt-3 pt-3 border-t">
            {metrics.map((metric, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{metric.name}</span>
                  <span className="font-medium">{metric.value}/{metric.max}</span>
                </div>
                <Progress 
                  value={(metric.value / metric.max) * 100} 
                  className={cn(
                    (metric.value / metric.max) > 0.9 && "bg-status-critical",
                    (metric.value / metric.max) > 0.7 && (metric.value / metric.max) <= 0.9 && "bg-status-warning",
                  )}
                />
              </div>
            ))}
          </div>
        )}
        
        <button 
          onClick={() => setExpanded(!expanded)}
          className="w-full text-center mt-2 text-sm text-muted-foreground hover:text-foreground"
        >
          {expanded ? (
            <span className="flex items-center justify-center gap-1">
              Hide details <ArrowUp className="h-3 w-3" />
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1">
              Show details <ArrowDown className="h-3 w-3" />
            </span>
          )}
        </button>
      </CardContent>
    </Card>
  );
}
