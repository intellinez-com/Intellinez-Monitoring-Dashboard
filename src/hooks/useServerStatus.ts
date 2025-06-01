import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type ServerHealthCounts = {
  healthy: number;
  degraded: number;
  offline: number;
  intermittent: number;
  all: number;
};

export const useServerStatus = () => {
  const [data, setData] = useState<ServerHealthCounts>({
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
      const { data: serverData, error } = await supabase
        .from("server_metrics")
        .select("health_status");

      if (error) throw error;

      const counts: ServerHealthCounts = {
        healthy: 0,
        degraded: 0,
        offline: 0,
        intermittent: 0,
        all: 0,
      };

      serverData.forEach((item) => {
        const status = item.health_status?.toLowerCase();
        if (status && status in counts) {
          counts[status as keyof ServerHealthCounts]++;
        }
      });

      counts.all = serverData.length;
      setData(counts);
    } catch (error) {
      console.error("Error fetching server status counts:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 40000); // Update every 40 seconds
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error };
}; 