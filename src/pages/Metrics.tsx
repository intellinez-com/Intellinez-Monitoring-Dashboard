import { DashboardLayout } from "@/components/DashboardLayout";
import WebVitalsDashboard from "@/components/WebVitalsDashboard";
 
const Metrics = () => {
  return (
    <DashboardLayout>
      <div className="mt-2">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <WebVitalsDashboard />
          </div>
      </div>
    </DashboardLayout>
  );
};
 
export default Metrics;