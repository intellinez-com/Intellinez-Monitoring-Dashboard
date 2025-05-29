
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusOverview } from "@/components/dashboard/StatusOverview";
import { StatusCard } from "@/components/dashboard/StatusCard";
import { MetricsChart } from "@/components/dashboard/MetricsChart";
import { AlertsList } from "@/components/dashboard/AlertsList";
import { LiveSiteStatus } from "@/components/dashboard/LiveSiteStatus";
import { mockStatusCards, mockAlerts, mockPerformanceData, mockResponseTimeData } from "@/data/mockData";

const Index = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Monitoring Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of system performance and health status
          </p>
        </div>
        
        <StatusOverview />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <MetricsChart 
              title="Response Time (ms)" 
              description="Endpoint performance"
              data={mockResponseTimeData}
              metrics={[
                { name: "API Endpoints", key: "api", color: "#8b5cf6" },
                { name: "Web Frontend", key: "web", color: "#ec4899" },
                { name: "Auth Service", key: "auth", color: "#14b8a6" },
              ]}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MetricsChart 
            title="CPU Usage (%)" 
            description="Server performance metrics"
            data={mockPerformanceData}
            metrics={[
              { name: "Web Server 01", key: "server1", color: "#22c55e" },
              { name: "Web Server 02", key: "server2", color: "#f59e0b" },
              { name: "API Server", key: "server3", color: "#3b82f6" },
            ]}
          />
        </div>
        
        <h2 className="text-2xl font-bold mt-8">Resources Status</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockStatusCards.map((card) => (
            <StatusCard 
              key={card.id}
              name={card.name}
              type={card.type as any}
              status={card.status as any}
              uptime={card.uptime}
              responseTime={card.responseTime}
              lastCheck={card.lastCheck}
              metrics={card.metrics}
            />
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-3">
            <AlertsList alerts={mockAlerts} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
