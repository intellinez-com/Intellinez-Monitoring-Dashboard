import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleAlert, CircleCheck, Circle, CrossIcon, Cross, X, CrosshairIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: "healthy" | "critical" | "warning" | "unknown" |"intermittent";
  onClick?: () => void;
}

export function StatsCard({ title, value, icon, onClick }: StatsCardProps) {
  const getIcon = () => {
    switch (icon) {
      case "healthy":
        return <CircleCheck className="h-6 w-6 text-status-healthy" />;
      case "critical":
        return <X className="h-6 w-6 text-status-critical" />;
      case "warning":
        return <CircleAlert className="h-6 w-6 text-status-warning" />;
      case "intermittent":
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
        return "bg-green-100 dark:bg-green-900/10";
      case "critical":
        return "bg-red-100 dark:bg-red-900/10";
      case "warning":
        return "bg-yellow-100 dark:bg-yellow-900/10";
      case "intermittent":
        return "bg-orange-200 dark:bg-orange-900/10";
      case "unknown":
      default:
        return "bg-muted/50"; // fallback neutral
    }
  };

  
  return (
    <Card 
      className={cn(
        getCardBgColor(),
        onClick && "cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && (
          <div
            className="transition-all duration-200 hover:scale-110 hover:opacity-80"
            title={`View ${title.toLowerCase()} websites`}
          >
            {getIcon()}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
