// src/hooks/useWebsiteHealthCounts.ts
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type HealthCounts = {
  healthy: number;
  degraded: number;
  offline: number;
  intermittent: number;
  all: number;
};

export const useWebsiteHealthCounts = () => {
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
  };

  useEffect(() => {
    fetchCounts(); // Run on mount

    const interval = setInterval(fetchCounts, 40000); // 🕐 Every 40 seconds

    return () => clearInterval(interval); // 💣 Clean up on unmount
  }, []);

  return { data, loading, error };
};
