import { useState } from "react";
import { useWebsiteHealthCounts } from "@/hooks/useWebsiteStatus";
import { StatsCard } from "./StatsCard";
import { WebsiteListModal } from "../WebsiteListModal";

export function StatusOverview() {
  const { data } = useWebsiteHealthCounts();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<"all" | "healthy" | "degraded" | "offline" | "intermittent">("all");
  const [selectedTitle, setSelectedTitle] = useState("");

  const handleCardClick = (status: "all" | "healthy" | "degraded" | "offline" | "intermittent", title: string) => {
    setSelectedStatus(status);
    setSelectedTitle(title);
    setModalOpen(true);
  };
  
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatsCard
          title="Total Websites"
          value={data.all}
          onClick={() => handleCardClick("all", "Total")}
        />
        <StatsCard
          title="Healthy"
          value={data.healthy}
          icon="healthy"
          onClick={() => handleCardClick("healthy", "Healthy")}
        />
        <StatsCard
          title="Degraded"
          value={data.degraded}
          icon="warning"
          onClick={() => handleCardClick("degraded", "Degraded")}
        />
        <StatsCard
          title="Offline"
          value={data.offline}
          icon="critical"
          onClick={() => handleCardClick("offline", "Offline")}
        />
        <StatsCard
          title="Intermittent"
          value={data.intermittent}
          icon="warning"
          onClick={() => handleCardClick("intermittent", "Intermittent")}
        />
      </div>

        <WebsiteListModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        status={selectedStatus}
        title={selectedTitle}
      />
    </>
  );
}
