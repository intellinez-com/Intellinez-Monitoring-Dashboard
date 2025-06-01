import { useState } from "react";
import { useWebsiteHealthCounts } from "@/hooks/useWebsiteStatus";
import { useServerStatus } from "@/hooks/useServerStatus";
import { StatsCard } from "./StatsCard";
import { WebsiteListModal } from "../WebsiteListModal";
import { ServerListModal } from "../ServerListModal";

export function StatusOverview() {
  const { data: websiteData } = useWebsiteHealthCounts();
  const { data: serverData } = useServerStatus();
  const [websiteModalOpen, setWebsiteModalOpen] = useState(false);
  const [serverModalOpen, setServerModalOpen] = useState(false);
  const [selectedWebsiteStatus, setSelectedWebsiteStatus] = useState<"all" | "healthy" | "degraded" | "offline" | "intermittent">("all");
  const [selectedServerStatus, setSelectedServerStatus] = useState<"all" | "healthy" | "degraded" | "offline" | "intermittent">("all");
  const [selectedWebsiteTitle, setSelectedWebsiteTitle] = useState("");
  const [selectedServerTitle, setSelectedServerTitle] = useState("");

  const handleWebsiteCardClick = (status: "all" | "healthy" | "degraded" | "offline" | "intermittent", title: string) => {
    setSelectedWebsiteStatus(status);
    setSelectedWebsiteTitle(title);
    setWebsiteModalOpen(true);
  };

  const handleServerCardClick = (status: "all" | "healthy" | "degraded" | "offline" | "intermittent", title: string) => {
    setSelectedServerStatus(status);
    setSelectedServerTitle(title);
    setServerModalOpen(true);
  };
  
  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Website Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatsCard
              title="Total Websites"
              value={websiteData.all}
              onClick={() => handleWebsiteCardClick("all", "Total")}
            />
            <StatsCard
              title="Healthy"
              value={websiteData.healthy}
              icon="healthy"
              onClick={() => handleWebsiteCardClick("healthy", "Healthy")}
            />
            <StatsCard
              title="Degraded"
              value={websiteData.degraded}
              icon="warning"
              onClick={() => handleWebsiteCardClick("degraded", "Degraded")}
            />
            <StatsCard
              title="Offline"
              value={websiteData.offline}
              icon="critical"
              onClick={() => handleWebsiteCardClick("offline", "Offline")}
            />
            <StatsCard
              title="Intermittent"
              value={websiteData.intermittent}
              icon="warning"
              onClick={() => handleWebsiteCardClick("intermittent", "Intermittent")}
            />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Server Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatsCard
              title="Total Servers"
              value={serverData.all}
              onClick={() => handleServerCardClick("all", "Total")}
            />
            <StatsCard
              title="Healthy"
              value={serverData.healthy}
              icon="healthy"
              onClick={() => handleServerCardClick("healthy", "Healthy")}
            />
            <StatsCard
              title="Degraded"
              value={serverData.degraded}
              icon="warning"
              onClick={() => handleServerCardClick("degraded", "Degraded")}
            />
            <StatsCard
              title="Offline"
              value={serverData.offline}
              icon="critical"
              onClick={() => handleServerCardClick("offline", "Offline")}
            />
            <StatsCard
              title="Intermittent"
              value={serverData.intermittent}
              icon="warning"
              onClick={() => handleServerCardClick("intermittent", "Intermittent")}
            />
          </div>
        </div>
      </div>

      <WebsiteListModal
        isOpen={websiteModalOpen}
        onClose={() => setWebsiteModalOpen(false)}
        status={selectedWebsiteStatus}
        title={selectedWebsiteTitle}
      />

      <ServerListModal
        isOpen={serverModalOpen}
        onClose={() => setServerModalOpen(false)}
        status={selectedServerStatus}
        title={selectedServerTitle}
      />
    </>
  );
}
