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

      const { data: websitesData, error } = await supabase
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

    // Predefined visually distinct colors
    const colors = [
      "#ffb6c1", //Lightpink
      "#ee82ee", // Violet
      "#800080", // Purple
      "#ff7f50", // Coral
      "#ffff00", // Yellow
      "#adff2f", // GreenYellow
      "#228b22", // ForestGreen
      "#008080", // Teal
      "#ff1493", // DeepPink
      "#00ffff", // Cyan
      "#40e0d0", // Turquoise
      "#1e90ff", // DodgerBlue
      "#000080", // Navy
      "#daa520", // GoldenRod
      "#a0522d", // Sienna
      "#708090", // SlateGray
      "#9932cc", // DarkOrchid
      // "#000000"  // Black
    ];

    // Helper to check if a color is "dangerous" (red-ish or close to red)
    const isDangerColor = (hex: string) => {
      hex = hex.replace(/^#/, "");
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h = h * 60;
      }
      const isRedHue = (h >= 340 || h <= 20);
      const isHighSat = s > 0.5;
      const isGoodLight = l > 0.2 && l < 0.85;
      return isRedHue && isHighSat && isGoodLight;
    };

    // Assign colors to new websites
    let updated = false;
    const usedColors = Object.values(websiteColorMap);

    websites.forEach((website) => {
      if (!websiteColorMap[website]) {
        // Try to assign an unused color from the array
        let color = colors.find(c => !usedColors.includes(c));
        // If all colors are used, generate a new unique, non-danger color
        if (!color) {
          let attempts = 0;
          do {
            // Generate a random color in HSL, skipping red hues
            const hue = Math.floor(Math.random() * 360);
            if ((hue >= 340 && hue <= 360) || (hue >= 0 && hue <= 20)) continue;
            const saturation = 70;
            const lightness = 50;
            const hslColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            // Convert HSL to hex
            const tempDiv = document.createElement("div");
            tempDiv.style.color = hslColor;
            document.body.appendChild(tempDiv);
            const rgb = getComputedStyle(tempDiv).color.match(/\d+/g);
            document.body.removeChild(tempDiv);
            let hex = "#000000";
            if (rgb && rgb.length >= 3) {
              hex =
                "#" +
                ((1 << 24) + (parseInt(rgb[0]) << 16) + (parseInt(rgb[1]) << 8) + parseInt(rgb[2]))
                  .toString(16)
                  .slice(1);
            }
            if (!usedColors.includes(hex) && !isDangerColor(hex) && !colors.includes(hex)) {
              color = hex;
              break;
            }
            attempts++;
          } while (attempts < 100);
          // Fallback if all else fails
          if (!color) color = "#3498db";
        }
        websiteColorMap[website] = color;
        usedColors.push(color);
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
          <div className="lg:col-span-3 dark:scale-100">
            <MetricsChart
              title="Website Response Times (ms)"
              description="Last hour response time monitoring (updates every 50 seconds)"
              data={chartDataForWebsites}
              metrics={metricsForWebsites}
            />
          </div>

          {/* <div className="lg:col-span-3">
            <MetricsChart
              title="Server Response Times (ms)"
              description="Last hour response time monitoring (updates every 50 seconds)"
              data={getChartData('response_time_ms')}
              metrics={getMetricsConfig('response_time_ms')}
            />
          </div> */}

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