import { StatsCard } from "./StatsCard";
import { useWebsiteStatus } from "@/contexts/WebsiteStatusContext";

export function StatusOverview() {
  const { counts } = useWebsiteStatus();
  console.log(counts);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatsCard
        title="Total Resources"
        value={counts.all}
      />
      <StatsCard
        title="Healthy"
        value={counts.healthy}
        icon="healthy"
      />
      <StatsCard
        title="Warning"
        value={counts.degraded}
        icon="warning"
      />
      <StatsCard
        title="Critical"
        value={counts.offline}
        icon="critical"
      />
    </div>
  );
}
