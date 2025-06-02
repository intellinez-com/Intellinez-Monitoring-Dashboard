import { useState, useEffect } from "react";
import { useMonitoringWithConnectionCheck } from "./useMonitoringWithConnectionCheck";

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

  // Generate new color if none exists
  const hue = Math.floor(Math.random() * 360);
  const saturation = 70;
  const lightness = 50;
  const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  
  // Store the color
  localStorage.setItem(`server-color-${serverId}`, color);
  return color;
};

export const useServerMetrics = (enableDebugLogging = false) => {
  const [metrics, setMetrics] = useState<ServerMetrics>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dummy server list - replace with real data later
  const dummyServers = [
    { id: "server-1", hostname: "web-server-1" },
    { id: "server-2", hostname: "app-server-1" },
    { id: "server-3", hostname: "db-server-1" }
  ];

  const generateData = async () => {
    try {
      setError(null);
      if (enableDebugLogging) console.log("Generating server metrics data...");
      
      const newMetrics: ServerMetrics = {};
      
      // Generate data for each server
      dummyServers.forEach(server => {
        newMetrics[server.id] = generateServerData(server.id, server.hostname);
      });

      setMetrics(newMetrics);
      setLoading(false);
      
      if (enableDebugLogging) {
        console.log("Server metrics updated for", Object.keys(newMetrics).length, "servers");
      }
    } catch (err) {
      console.error("Error generating server metrics:", err);
      setError("Failed to generate server metrics");
      setLoading(false);
    }
  };

  // Use the new monitoring hook with connection checking
  const { isOnline, isInitialized, executeManually } = useMonitoringWithConnectionCheck(
    generateData,
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
      generateData();
    }
  }, [isInitialized]);

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
    isOnline,
    isInitialized,
    getChartData,
    getMetricsConfig,
    refetch: executeManually
  };
}; 