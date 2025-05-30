import { useWebsiteHealthCounts } from "@/hooks/useWebsiteStatus";
import { StatsCard } from "./StatsCard";

export function StatusOverview() {
  const { data } = useWebsiteHealthCounts();
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatsCard
        title="Total Websites"
        value={data.all}
      />
      <StatsCard
        title="Healthy"
        value={data.healthy}
        icon="healthy"
      />
      <StatsCard
        title="Degraded"
        value={data.degraded}
        icon="warning"
      />
      <StatsCard
        title="Offline"
        value={data.offline}
        icon="critical"
      />
    </div>
  );
}
