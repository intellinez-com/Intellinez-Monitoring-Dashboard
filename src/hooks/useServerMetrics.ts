import { useState, useEffect } from "react";

interface ServerMetricPoint {
  timestamp: string;
  server_id: string;
  hostname: string;
  cpu_percent: number;
  memory_percent: number;
  disk_percent: number;
  response_time_ms: number;
}

interface ServerMetrics {
  [key: string]: ServerMetricPoint[];
}

interface ChartDataPoint {
  timestamp: string;
  [key: string]: string | number;
}

// Generate a random value within a range
const randomInRange = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Generate dummy data for a single server
const generateServerData = (serverId: string, hostname: string): ServerMetricPoint[] => {
  const data: ServerMetricPoint[] = [];
  const now = new Date();

  // Generate data points for the last hour
  for (let i = 60; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60000);
    data.push({
      timestamp: timestamp.toISOString(),
      server_id: serverId,
      hostname,
      cpu_percent: randomInRange(20, 80),
      memory_percent: randomInRange(30, 90),
      disk_percent: randomInRange(40, 95),
      response_time_ms: randomInRange(50, 500)
    });
  }

  return data;
};

// Generate a unique color for a server
const generateServerColor = (serverId: string): string => {
  // Try to get existing color from localStorage
  const storedColor = localStorage.getItem(`server-color-${serverId}`);
  if (storedColor) return storedColor;

  // Predefined, visually distinct colors
  const colors = [
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
  localStorage.setItem(`server-color-${serverId}`, color);
  return color;
};

export const useServerMetrics = () => {
  const [metrics, setMetrics] = useState<ServerMetrics>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dummy server list - replace with real data later
  const dummyServers = [
    { id: "server-1", hostname: "web-server-1" },
    { id: "server-2", hostname: "app-server-1" },
    { id: "server-3", hostname: "db-server-1" }
  ];

  useEffect(() => {
    const generateData = () => {
      try {
        const newMetrics: ServerMetrics = {};

        // Generate data for each server
        dummyServers.forEach(server => {
          newMetrics[server.id] = generateServerData(server.id, server.hostname);
        });

        setMetrics(newMetrics);
        setError(null);
      } catch (err) {
        console.error("Error generating server metrics:", err);
        setError("Failed to generate server metrics");
      } finally {
        setLoading(false);
      }
    };

    generateData();
    const interval = setInterval(generateData, 50000); // Update every 50 seconds

    return () => clearInterval(interval);
  }, []);

  // Transform metrics data for charts
  const getChartData = (metricKey: keyof Omit<ServerMetricPoint, 'timestamp' | 'server_id' | 'hostname'>) => {
    const chartData: ChartDataPoint[] = [];

    // Get all timestamps
    const timestamps = Object.values(metrics)[0]?.map(point => point.timestamp) || [];

    // Create data points for each timestamp
    timestamps.forEach(timestamp => {
      const dataPoint: ChartDataPoint = { timestamp };

      // Add metric value for each server
      Object.entries(metrics).forEach(([serverId, points]) => {
        const point = points.find(p => p.timestamp === timestamp);
        if (point) {
          dataPoint[point.hostname] = point[metricKey];
        }
      });

      chartData.push(dataPoint);
    });

    return chartData;
  };

  // Get metrics configuration for charts
  const getMetricsConfig = (metricKey: keyof Omit<ServerMetricPoint, 'timestamp' | 'server_id' | 'hostname'>) => {
    return dummyServers.map(server => ({
      name: server.hostname,
      key: server.hostname,
      color: generateServerColor(server.id)
    }));
  };

  return {
    loading,
    error,
    getChartData,
    getMetricsConfig
  };
}; 