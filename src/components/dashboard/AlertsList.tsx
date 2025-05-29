
import { Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  service: string;
  message: string;
  level: "critical" | "warning" | "info";
  time: string;
  acknowledged: boolean;
}

interface AlertsListProps {
  alerts: Alert[];
}

export function AlertsList({ alerts }: AlertsListProps) {
  const getAlertColor = (level: string) => {
    switch (level) {
      case "critical":
        return "text-status-critical";
      case "warning":
        return "text-status-warning";
      case "info":
        return "text-blue-500";
      default:
        return "";
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Alerts</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {alerts.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No alerts at this time
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "p-4 hover:bg-muted/50 flex items-start gap-3",
                  alert.acknowledged ? "bg-transparent" : "bg-red-500/5"
                )}
              >
                <Circle className={cn("h-4 w-4 mt-1 fill-current", getAlertColor(alert.level))} />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">{alert.service}</h4>
                    <span className="text-sm text-muted-foreground">{alert.time}</span>
                  </div>
                  <p className="text-sm mt-1">{alert.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
