import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ServerStatusFilterProps {
  activeFilter: "All" | "Online" | "Offline" | "Slow" | "Unreachable";
  onFilterChange: (filter: "All" | "Online" | "Offline" | "Slow" | "Unreachable") => void;
  counts: {
    all: number;
    online: number;
    offline: number;
    slow: number;
    unreachable: number;
  };
}

export function ServerStatusFilter({
  activeFilter,
  onFilterChange,
  counts,
}: ServerStatusFilterProps) {
  const filters = [
    { label: "All", value: "All" as const, count: counts.all },
    { label: "Online", value: "Online" as const, count: counts.online },
    { label: "Offline", value: "Offline" as const, count: counts.offline },
    { label: "Slow", value: "Slow" as const, count: counts.slow },
    { label: "Unreachable", value: "Unreachable" as const, count: counts.unreachable },
  ];

  return (
    <div className="flex gap-2">
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={activeFilter === filter.value ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange(filter.value)}
          className={cn(
            "relative",
            activeFilter === filter.value && "bg-primary text-primary-foreground"
          )}
        >
          {filter.label}
          <span
            className={cn(
              "ml-2 rounded-full px-2 py-0.5 text-xs",
              activeFilter === filter.value
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {filter.count}
          </span>
        </Button>
      ))}
    </div>
  );
} 