import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusOverview } from "@/components/dashboard/StatusOverview";
import { MetricsChart } from "@/components/dashboard/MetricsChart";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useServerMetrics } from "@/hooks/useServerMetrics";

interface MonitoringLog {
  website_id: string;
  response_time_ms: number;
  checked_at: string;
  website: {
    website_name: string;
  };
}

const Index = () => {
  const [loading, setLoading] = useState(true);
  const [websiteMonitoringData, setWebsiteMonitoringData] = useState<MonitoringLog[]>([]);
  const { getChartData, getMetricsConfig } = useServerMetrics();

  // function for fetching the monitoring data from supabase
  const fetchMonitoringData = async () => {
    try {
      // Calculate timestamp for 1 hour ago
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const { data:websitesData, error } = await supabase
        .from("website_monitoring_logs")
        .select(`
          website_id,
          response_time_ms,
          checked_at,
          website:websites!inner(website_name,is_active)
        `)
        .gte('checked_at', oneHourAgo.toISOString())
        .eq('websites.is_active', true)
        .order('checked_at', { ascending: true });

      if (error) throw error;

      // Transform the data to match our MonitoringLog interface
      const transformedData = (websitesData || []).map((item: any) => ({
        website_id: item.website_id,
        response_time_ms: item.response_time_ms,
        checked_at: item.checked_at,
        website: {
          website_name: item.website.website_name
        }
      }));

      setWebsiteMonitoringData(transformedData);
    } catch (error) {
      console.error("Error fetching monitoring data:", error);
    } finally {
      setLoading(false);
    }
  };

  // hook for fetching data and setting interval
  useEffect(() => {
    fetchMonitoringData();

    // Set up interval for real-time updates (every 50 seconds)
    const intervalId = setInterval(fetchMonitoringData, 50000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Transform monitoring data for the chart
  const chartDataForWebsites = websiteMonitoringData.reduce((acc: any[], log) => {
    const timestamp = new Date(log.checked_at).toISOString();
    const existingPoint = acc.find(point => point.timestamp === timestamp);

    if (existingPoint) {
      existingPoint[log.website.website_name] = log.response_time_ms;
    } else {
      acc.push({
        timestamp,
        [log.website.website_name]: log.response_time_ms
      });
    }

    return acc;
  }, []);

  // Generate and persist a unique color for each website, mapping website name to color
  const getOrGenerateWebsiteColorMap = (websites: string[]): Record<string, string> => {
    // Load existing map from localStorage
    let websiteColorMap: Record<string, string> = {};
    try {
      const stored = localStorage.getItem("websiteColorMap");
      if (stored) websiteColorMap = JSON.parse(stored);
    } catch { }

    // Helper to check if a color is "dangerous" (red-ish)
    const isDangerColor = (hex: string) => {
      // Convert hex to RGB
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      // Heuristic: red is dominant and not much green/blue
      return r > 180 && g < 100 && b < 100;
    };

    // Helper to generate a unique color not already used and not "danger"
    const generateUniqueColor = (usedColors: string[]): string => {
      let color = "";
      let attempts = 0;
      const maxAttempts = 200;
      while (attempts < maxAttempts) {
        const hue = Math.floor(Math.random() * 360);
        const saturation = 70;
        const lightness = 50;
        const h = hue;
        const s = saturation / 100;
        const l = lightness / 100;
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;
        let r = 0, g = 0, b = 0;
        if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
        else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
        else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
        else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
        else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
        else { r = c; g = 0; b = x; }
        const toHex = (n: number) => {
          const hex = Math.round((n + m) * 255).toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        };
        color = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        if (
          !usedColors.includes(color) &&
          !isDangerColor(color)
        ) break;
        attempts++;
      }
      // Fallback: if all else fails, pick a safe blue
      if (isDangerColor(color)) color = "#3498db";
      return color;
    };

    // Assign colors to new websites
    let updated = false;
    const usedColors = Object.values(websiteColorMap);
    websites.forEach((website) => {
      if (!websiteColorMap[website]) {
        const newColor = generateUniqueColor(usedColors);
        websiteColorMap[website] = newColor;
        usedColors.push(newColor);
        updated = true;
      }
    });

    // Save updated map if new colors were added
    if (updated) {
      try {
        localStorage.setItem("websiteColorMap", JSON.stringify(websiteColorMap));
      } catch { }
    }

    return websiteColorMap;
  };

  // Get unique website names from the data
  const uniqueWebsites = Array.from(new Set(websiteMonitoringData.map(log => log.website.website_name)));

  // Get or generate the color map
  const websiteColorMap = getOrGenerateWebsiteColorMap(uniqueWebsites);

  // Build metrics array for the chart
  const metricsForWebsites = uniqueWebsites.map((websiteName) => ({
    name: websiteName,
    key: websiteName,
    color: websiteColorMap[websiteName]
  }));

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
          <div className="lg:col-span-3">
            <MetricsChart
              title="Website Response Times (ms)"
              description="Last hour response time monitoring (updates every 50 seconds)"
              data={chartDataForWebsites}
              metrics={metricsForWebsites}
            />
          </div>

          <div className="lg:col-span-3">
            <MetricsChart
              title="Server Response Times (ms)"
              description="Last hour response time monitoring (updates every 50 seconds)"
              data={getChartData('response_time_ms')}
              metrics={getMetricsConfig('response_time_ms')}
            />
          </div>

          <div className="lg:col-span-3">
            <MetricsChart
              title="CPU Usage (%)"
              description="Last hour CPU usage monitoring (updates every 50 seconds)"
              data={getChartData('cpu_percent')}
              metrics={getMetricsConfig('cpu_percent')}
            />
          </div>

          <div className="lg:col-span-3">
            <MetricsChart
              title="Memory Usage (%)"
              description="Last hour memory usage monitoring (updates every 50 seconds)"
              data={getChartData('memory_percent')}
              metrics={getMetricsConfig('memory_percent')}
            />
          </div>

          <div className="lg:col-span-3">
            <MetricsChart
              title="Disk Usage (%)"
              description="Last hour disk usage monitoring (updates every 50 seconds)"
              data={getChartData('disk_percent')}
              metrics={getMetricsConfig('disk_percent')}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;