
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleAlert, CircleCheck, Circle } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: "healthy" | "critical" | "warning" | "unknown";
  };


export function StatsCard({ title, value, icon }: StatsCardProps) {
  const getIcon = () => {
    switch (icon) {
      case "healthy":
        return <CircleCheck className="h-6 w-6 text-status-healthy" />;
      case "critical":
        return <CircleAlert className="h-6 w-6 text-status-critical" />;
      case "warning":
        return <CircleAlert className="h-6 w-6 text-status-warning" />;
      case "unknown":
        return <Circle className="h-6 w-6 text-status-unknown" />;
      default:
        return null;
    }
  };
  
  const getCardBgColor = () => {
    switch (icon) {
      case "healthy":
        return "bg-green-50 dark:bg-green-900/10";
      case "critical":
        return "bg-red-50 dark:bg-red-900/10";
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-900/10";
      case "unknown":
      default:
        return "bg-muted/50"; // fallback neutral
    }
  };

  
  return (
    <Card className={getCardBgColor()}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && getIcon()}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
    
         </CardContent>
    </Card>
  );
}
