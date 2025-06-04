// src/hooks/useWebsiteStatus.ts
import { useEffect, useState, useCallback } from "react";
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
  const [loading, setLoading] = useState(true); // Initial loading state
  const [error, setError] = useState<string | null>(null);

  const fetchCounts = useCallback(async () => {
    setLoading(true); 
    // setError(null); // Clear error only on success or at the start of a user-initiated refetch.
                     // For automated polling, let previous error persist until success.
    try {
      if (enableDebugLogging) console.log("useWebsiteHealthCounts: Fetching website health counts...");
      
      const { data: countsData, error: rpcError } = await supabase.rpc("get_health_status_counts");

      if (rpcError) {
        console.error("useWebsiteHealthCounts: RPC error fetching counts:", rpcError);
        setError(rpcError.message);
        // setLoading(false); // Handled in finally
        return; 
      }

      let total = 0;
      const newCounts: HealthCounts = { healthy: 0, degraded: 0, offline: 0, intermittent: 0, all: 0 };

      if (Array.isArray(countsData)) {
        countsData.forEach((item: any) => {
          const key = item.health_status?.toLowerCase();
          if (key && key in newCounts) {
            newCounts[key as keyof HealthCounts] = item.count;
            total += item.count;
          }
        });
      } else {
        // This case should ideally not happen if RPC is well-defined.
        console.warn("useWebsiteHealthCounts: countsData from get_health_status_counts was not an array:", countsData);
        // Consider setting an error or default state if this is critical
      }

      newCounts.all = total;
      setData(newCounts);
      setError(null); // Clear any previous error on successful data fetch and processing
      
      if (enableDebugLogging) {
        console.log("useWebsiteHealthCounts: Website health counts updated:", newCounts);
      }
    } catch (err: any) {
      console.error("useWebsiteHealthCounts: Catch block error fetching counts:", err);
      setError(err.message || "Failed to fetch website health counts");
    } finally {
      setLoading(false);
    }
  }, [enableDebugLogging]); // supabase is module-scoped and thus stable

  const { 
    isOnline, 
    isInitialized, 
    executeManually: refetchCounts // Renaming for clarity for the returned refetch function
  } = useMonitoringWithConnectionCheck(
    fetchCounts, // Pass the STABLE fetchCounts callback
    { 
      intervalMs: 60000, // Every 1 minute
      retryAttempts: 3,
      retryDelayMs: 5000,
      enableLogging: enableDebugLogging // Pass this for logging within the monitor hook
    }
  );

  // The useMonitoringWithConnectionCheck hook is responsible for the initial call
  // to fetchCounts after its internal initialization and connection checks are done (includes a 5s startup delay).
  // An explicit useEffect here to call fetchCounts is redundant and can lead to double fetches or race conditions.
  // The 'loading' state defined above will be true until the monitor makes its first call.

  return { 
    data, 
    loading, 
    error, 
    isOnline, // from useMonitoringWithConnectionCheck -> useConnectionStatus
    isInitialized, // from useMonitoringWithConnectionCheck -> useConnectionStatus
    refetch: useCallback(() => { // Ensure the returned refetch also clears previous errors for better UX
      setError(null);
      refetchCounts();
    }, [refetchCounts]), 
  };
};
