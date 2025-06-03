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
    const { data: serverData, error } = await supabase.rpc("get_latest_unique_servers");
    // console.log(serverData);
    if (error) throw error;

    const counts: ServerHealthCounts = {
      healthy: 0,
      degraded: 0,
      offline: 0,
      intermittent: 0,
      all: 0,
    };

    // Only count unique detected_hostname
    // const seenIpAddress = new Set<string>();
    const seenServerNames = new Set<string>();
    (serverData || []).forEach((item) => {
      // const ip_address = item.ip_address;
      const server_name = item.server_name;
      const status = item.health_status?.toLowerCase();
      // if (ip_address && !seenIpAddress.has(ip_address) && status && status in counts) {
      //   counts[status as keyof ServerHealthCounts]++;
      //   seenIpAddress.add(ip_address);
      // }
      if (server_name && !seenServerNames.has(server_name) && status && status in counts) {
        counts[status as keyof ServerHealthCounts]++;
        seenServerNames.add(server_name);
      }
    });

    // counts.all = seenIpAddress.size;
    counts.all = seenServerNames.size;
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