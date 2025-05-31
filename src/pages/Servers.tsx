
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusCard } from "@/components/dashboard/StatusCard";
import { MetricsChart } from "@/components/dashboard/MetricsChart";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { mockStatusCards, mockPerformanceData } from "@/data/mockData";

const Servers = () => {
  // Filter only server type resources
  const serverCards = mockStatusCards.filter(card => card.type === "server");

  console.log("Inside the servers page.");
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Servers Monitoring</h1>
          <p className="text-muted-foreground mt-1">
            Track server performance and health status
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {serverCards.map((card) => (
            <StatusCard 
              key={card.id}
              name={card.name}
              type={card.type as any}
              status={card.status as any}
              uptime={card.uptime}
              lastCheck={card.lastCheck}
              metrics={card.metrics}
            />
          ))}
        </div>
        
        <div className="grid grid-cols-1 gap-6">
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
        
        <div className="mt-6">
          <h2 className="text-2xl font-bold mb-4">Server Details</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Server Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uptime</TableHead>
                <TableHead>CPU</TableHead>
                <TableHead>Memory</TableHead>
                <TableHead>Disk</TableHead>
                <TableHead>Last Check</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serverCards.map((server) => (
                <TableRow key={server.id}>
                  <TableCell className="font-medium">{server.name}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      server.status === 'healthy' ? 'bg-green-100 text-green-800' : 
                      server.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      server.status === 'critical' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {server.status}
                    </span>
                  </TableCell>
                  <TableCell>{server.uptime}%</TableCell>
                  <TableCell>
                    {server.metrics?.find(m => m.name === "CPU Usage")?.value || "-"}%
                  </TableCell>
                  <TableCell>
                    {server.metrics?.find(m => m.name === "Memory")?.value || "-"}GB
                  </TableCell>
                  <TableCell>
                    {server.metrics?.find(m => m.name === "Disk")?.value || "-"}GB
                  </TableCell>
                  <TableCell>{server.lastCheck}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Servers;
