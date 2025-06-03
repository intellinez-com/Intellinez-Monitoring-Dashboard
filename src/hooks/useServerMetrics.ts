import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useMonitoringWithConnectionCheck } from "./useMonitoringWithConnectionCheck";

interface ServerMetricPoint {
  timestamp: string;
  server_name: string;
  hostname: string;
  cpu_percent: number;
  memory_percent: number;
  disk_percent: number;
}

interface ServerMetrics {
  [key: string]: ServerMetricPoint[];
}

interface ChartDataPoint {
  timestamp: string;
  [key: string]: string | number;
}

// Generate a unique color for a server
const generateServerColor = (serverName: string): string => {
  // Try to get existing color from localStorage
  const storedColor = localStorage.getItem(`server-color-${serverName}`);
  if (storedColor) return storedColor;

  // Predefined, visually distinct colors
  const colors = [
    "#9932cc", // DarkOrchid
    "#ff7f50", // Coral
    "#ffff00", // Yellow
    "#adff2f", // GreenYellow
    "#00ff00", // Lime
    "#00ffff", // Aqua/Cyan
    "#40e0d0", // Turquoise
    "#1e90ff", // DodgerBlue
    "#ff4500", // OrangeRed
    "#ff6347", // Tomato
    "#00fa9a", // MediumSpringGreen
    "#7cfc00"  // LawnGreen
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

  // Gather all used colors to ensure uniqueness
  const usedColors: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("server-color-")) {
      const color = localStorage.getItem(key);
      if (color) usedColors.push(color);
    }
  }

  // Pick the first unused color from the array
  let color = colors.find(c => !usedColors.includes(c));
  // If all colors are used, generate a new unique, non-danger color
  if (!color) {
    let attempts = 0;
    do {
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
      if (
        !usedColors.includes(hex) &&
        !isDangerColor(hex) &&
        !colors.includes(hex)
      ) {
        color = hex;
        break;
      }
      attempts++;
    } while (attempts < 100);
    // Fallback if all else fails
    if (!color) color = "#3498db";
  }

  // Store the color
  localStorage.setItem(`server-color-${serverName}`, color);
  return color;
};

export const useServerMetrics = (enableDebugLogging = false) => {
  const [metrics, setMetrics] = useState<ServerMetrics>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [servers, setServers] = useState<{ serverName: string; hostname: string }[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all server metrics
      const { data, error } = await supabase
        .from("server_metrics")
        .select("id,server_name,hostname,checked_at,cpu_percent,memory_percent,disk_percent")
        .order("checked_at", { ascending: true });

      if (error) throw error;

      // Group by hostname (unique server)
      const metricsByServer: ServerMetrics = {};
      const serverList: { serverName: string; hostname: string }[] = [];
      const seenHostnames = new Set<string>();
      const seenServerNames = new Set<string>();

      (data || []).forEach((row: any) => {
        // Use hostname as the unique identifier
        if (!metricsByServer[row.server_name]) {
          metricsByServer[row.server_name] = [];
          // if (!seenHostnames.has(row.hostname)) {
          //   serverList.push({ name: row.server_name, hostname: row.hostname }); // Use server_name as name
          //   seenHostnames.add(row.hostname);
          // }
          if (!seenServerNames.has(row.server_name)) {
            serverList.push({ serverName: row.server_name, hostname: row.hostname }); // Use server_name as name
            seenServerNames.add(row.server_name);
          }
        }
        metricsByServer[row.server_name].push({
          timestamp: row.checked_at,
          server_name: row.server_name,
          hostname: row.hostname,
          cpu_percent: row.cpu_percent,
          memory_percent: row.memory_percent,
          disk_percent: row.disk_percent,
        });
      });


      setMetrics(metricsByServer);
      setServers(serverList);
      setError(null);
    } catch (err) {
      console.error("Error fetching server metrics:", err);
      setError("Failed to fetch server metrics");
    } finally {
      setLoading(false);
    }
  };

  const { isOnline, isInitialized, executeManually } = useMonitoringWithConnectionCheck(
    fetchData,
    {
      intervalMs: 50000, // Update every 50 seconds
      retryAttempts: 2,
      retryDelayMs: 3000,
      enableLogging: enableDebugLogging
    }
  );

  // Initial data generation on mount (only when initialized)
  useEffect(() => {
    if (isInitialized) {
      fetchData();
    }
  }, [isInitialized]);
  
  // Transform metrics data for charts
  const getChartData = (metricKey: keyof Omit<ServerMetricPoint, 'timestamp' | 'server_name' | 'hostname'>): ChartDataPoint[] => {
    const chartData: ChartDataPoint[] = [];

    // Step 1: Collect all unique timestamps
    const allTimestampsSet = new Set<string>();
    Object.values(metrics).forEach((points) => {
      points.forEach((point) => {
        allTimestampsSet.add(point.timestamp);
      });
    });

    const allTimestamps = Array.from(allTimestampsSet).sort();

    // Step 2: Build chart data grouped by timestamp
    allTimestamps.forEach((timestamp) => {
      const dataPoint: ChartDataPoint = { timestamp };

      Object.entries(metrics).forEach(([server_name, points]) => {
        const point = points.find((p) => p.timestamp === timestamp);
        if (point) {
          dataPoint[server_name] = point[metricKey];
        }
      });

      chartData.push(dataPoint);
    });

    return chartData;
  };

  // Get metrics configuration for charts
  const getMetricsConfig = (metricKey: keyof Omit<ServerMetricPoint, 'timestamp' | 'server_name' | 'hostname'>) => {
    return servers.map(server => ({
      name: server.serverName,               // For legend/display
      key: server.serverName,                // For identifying series in chart
      color: generateServerColor(server.serverName),
    }));
  };

  return {
    loading,
    error,
    isOnline,
    isInitialized,
    getChartData,
    getMetricsConfig,
    refetch: executeManually
  };
};