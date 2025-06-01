import { CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type FilterOption = "All" | "Healthy" | "Degraded" | "Offline" | "Intermittent";

interface ServerStatusFilterProps {
  activeFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  counts: {
    all: number;
    healthy: number;
    degraded: number;
    offline: number;
    intermittent: number;
  };
}

export function ServerStatusFilter({
  activeFilter,
  onFilterChange,
  counts,
}: ServerStatusFilterProps) {
  const filters: Array<{
    value: FilterOption;
    label: string;
    icon: JSX.Element;
    className: string;
  }> = [
    {
      value: "All",
      label: "All Servers",
      icon: null,
      className: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
    },
    {
      value: "Healthy",
      label: "Healthy",
      icon: <CheckCircle className="h-4 w-4" />,
      className: "bg-emerald-100 text-emerald-900 hover:bg-emerald-200",
    },
    {
      value: "Degraded",
      label: "Degraded",
      icon: <AlertCircle className="h-4 w-4" />,
      className: "bg-yellow-100 text-yellow-900 hover:bg-yellow-200",
    },
    {
      value: "Intermittent",
      label: "Intermittent",
      icon: <XCircle className="h-4 w-4" />,
      className: "bg-orange-100 text-orange-900 hover:bg-orange-200",
    },
    {
      value: "Offline",
      label: "Offline",
      icon: <XCircle className="h-4 w-4" />,
      className: "bg-red-100 text-red-900 hover:bg-red-200",
    },
  ];

  return (
    <div className="flex flex-wrap gap-2 p-2 rounded-full bg-white/50 backdrop-blur-sm border border-zinc-200/80 shadow-sm">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full",
            "transition-all duration-200 ease-in-out",
            "font-medium text-sm",
            "transform hover:scale-105",
            filter.className,
            activeFilter === filter.value && "ring-2 ring-offset-2",
            activeFilter === filter.value &&
              filter.value === "Healthy" &&
              "ring-emerald-400",
            activeFilter === filter.value &&
              filter.value === "Degraded" &&
              "ring-yellow-400",
            activeFilter === filter.value &&
              filter.value === "Offline" &&
              "ring-red-400",
            activeFilter === filter.value &&
              filter.value === "Intermittent" &&
              "ring-grey-400",
            activeFilter === filter.value &&
              filter.value === "All" &&
              "ring-zinc-400"
          )}
        >
          {filter.icon && <span>{filter.icon}</span>}
          <span>{filter.label}</span>
          <span className="ml-1 px-2 py-0.5 rounded-full bg-black/10 text-xs">
            {filter.value === "All"
              ? counts.all
              : filter.value === "Healthy"
              ? counts.healthy
              : filter.value === "Degraded"
              ? counts.degraded
              : filter.value === "Intermittent"
              ? counts.intermittent
              : counts.offline}
          </span>
        </button>
      ))}
    </div>
  );
} 