import { DashboardLayout } from "@/components/DashboardLayout";
import { WebsiteManager } from "@/components/WebsiteManager";

const Websites = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-start items-center gap-6">
          <h1 className="text-3xl font-bold">Websites Monitoring</h1>
          <p className="text-muted-foreground mt-1">
            Monitor status and performance of all your web properties
          </p>
        </div>
        <WebsiteManager />
      </div>
    </DashboardLayout>
  );
};

export default Websites;
