import { DashboardLayout } from "@/components/DashboardLayout";
import { ServerManager } from "@/components/ServerManager";

const Servers = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-start items-center gap-6">
          <h1 className="text-3xl font-bold">Servers Monitoring</h1>
          <p className="text-muted-foreground mt-1">
            Monitor status and performance of all your servers
          </p>
        </div>
        <ServerManager />
      </div>
    </DashboardLayout>
  );
};

export default Servers;
