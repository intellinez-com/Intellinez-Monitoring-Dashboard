// src/hooks/useWebsiteHealthCounts.ts
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useMonitoringWithConnectionCheck } from "./useMonitoringWithConnectionCheck";

type HealthCounts = {
  healthy: number;
  degraded: number;
  offline: number;
  intermittent: number;
  all: number;
};

export const useWebsiteHealthCounts = (enableDebugLogging = false) => {
  const [data, setData] = useState<HealthCounts>({
    healthy: 0,
    degraded: 0,
    offline: 0,
    intermittent: 0,
    all: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCounts = async () => {
    try {
      setError(null);
      if (enableDebugLogging) console.log("Fetching website health counts...");
      
      const { data: countsData, error } = await supabase.rpc("get_health_status_counts");

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      let total = 0;
      const counts: HealthCounts = {
        healthy: 0,
        degraded: 0,
        offline: 0,
        intermittent: 0,
        all: 0,
      };

      countsData.forEach((item: any) => {
        const key = item.health_status?.toLowerCase();
        if (key && key in counts) {
          counts[key as keyof HealthCounts] = item.count;
          total += item.count;
        }
      });

      counts.all = total;

      setData(counts);
      setLoading(false);
      
      if (enableDebugLogging) {
        console.log("Website health counts updated:", counts);
      }
    } catch (err) {
      console.error("Error fetching website health counts:", err);
      setError("Failed to fetch website health counts");
      setLoading(false);
    }
  };

  // Use the new monitoring hook with connection checking
  const { isOnline, isInitialized, executeManually } = useMonitoringWithConnectionCheck(
    fetchCounts,
    { 
      intervalMs: 60000, // Every 1 minute
      retryAttempts: 3,
      retryDelayMs: 5000,
      enableLogging: enableDebugLogging
    }
  );

  // Initial fetch on mount (only when initialized)
  useEffect(() => {
    if (isInitialized && isOnline) {
      fetchCounts();
    }
  }, [isInitialized, isOnline]);

  return { 
    data, 
    loading, 
    error, 
    isOnline, 
    isInitialized,
    refetch: executeManually 
  };
};
