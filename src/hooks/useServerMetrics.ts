import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useMonitoringWithConnectionCheck } from "./useMonitoringWithConnectionCheck";

interface ServerMetricPoint {
  timestamp: string;
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
const generateServerColor = (serverHostname: string): string => {
  // Try to get existing color from localStorage
  const storedColor = localStorage.getItem(`server-color-${serverHostname}`);
  if (storedColor) return storedColor;

  // Predefined, visually distinct colors
  const colors = [
    "#ff1493", // DeepPink
    "#ee82ee", // Violet
    "#9932cc", // DarkOrchid
    "#800080", // Purple
    "#ff7f50", // Coral
    "#ffff00", // Yellow
    "#adff2f", // GreenYellow
    "#228b22", // ForestGreen
    "#008080", // Teal
    "#00ffff", // Cyan
    "#40e0d0", // Turquoise
    "#1e90ff", // DodgerBlue
    "#000080", // Navy
    "#daa520", // GoldenRod
    "#a0522d", // Sienna
    "#708090", // SlateGray
    "#000000"  // Black
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
  localStorage.setItem(`server-color-${serverHostname}`, color);
  return color;
};

export const useServerMetrics = (enableDebugLogging = false) => {
  const [metrics, setMetrics] = useState<ServerMetrics>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [servers, setServers] = useState<{ id: string; hostname: string }[]>([]);

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all server metrics
        const { data, error } = await supabase
          .from("server_metrics")
          .select("id,hostname,checked_at,cpu_percent,memory_percent,disk_percent")
          .order("checked_at", { ascending: true });

        if (error) throw error;

        // Group by hostname (unique server)
        const metricsByServer: ServerMetrics = {};
        const serverList: { id: string; hostname: string }[] = [];
        const seenHostnames = new Set<string>();

        (data || []).forEach((row: any) => {
          // Use hostname as the unique identifier
          if (!metricsByServer[row.hostname]) {
            metricsByServer[row.hostname] = [];
            if (!seenHostnames.has(row.hostname)) {
              serverList.push({ id: row.hostname, hostname: row.hostname }); // Use hostname as id
              seenHostnames.add(row.hostname);
            }
          }
          metricsByServer[row.hostname].push({
            timestamp: row.checked_at,
            hostname: row.hostname,
            cpu_percent: row.cpu_percent,
            memory_percent: row.memory_percent,
            disk_percent: row.disk_percent,
          });
        });
        // console.log("data:", data);
        // console.log("metricsbyserver:", metricsByServer);
        // console.log("serverlist:", serverList);

        setMetrics(metricsByServer);
        setServers(serverList);
        // console.log("metrics", metrics);
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
  const getChartData = (metricKey: keyof Omit<ServerMetricPoint, 'timestamp' | 'hostname'>) => {
    const chartData: ChartDataPoint[] = [];

    // Collect all unique timestamps across all servers
    const allTimestampsSet = new Set<string>();
    Object.values(metrics).forEach(points => {
      points.forEach(point => {
        allTimestampsSet.add(point.timestamp);
      });
    });
    // Sort timestamps chronologically
    const allTimestamps = Array.from(allTimestampsSet).sort();

    // For each timestamp, collect the metric for each server (by hostname)
    allTimestamps.forEach(timestamp => {
      const dataPoint: ChartDataPoint = { timestamp };
      Object.entries(metrics).forEach(([hostname, points]) => {
        // Find the metric entry for this timestamp for this server
        const point = points.find(p => p.timestamp === timestamp);
        if (point) {
          dataPoint[hostname] = point[metricKey];
        } else {
          // Optionally, you can set null or 0 if no data for this timestamp
          // dataPoint[hostname] = null;
        }
      });
      chartData.push(dataPoint);
    });

    return chartData;
  };

  // Get metrics configuration for charts
  const getMetricsConfig = (metricKey: keyof Omit<ServerMetricPoint, 'timestamp' | 'hostname'>) => {
    return servers.map(server => ({
      name: server.hostname,
      key: server.hostname,
      color: generateServerColor(server.hostname)
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