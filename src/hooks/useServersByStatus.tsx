import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface ServerMetrics {
  id: string;
  server_name: string;
  hostname: string;
  ip_address: string;
  health_status: string;
  cpu_percent: number;
  os: string;
  memory_percent: number;
  disk_percent: number;
  checked_at: string;
  created_at: string;
  updated_at: string;
}

export const useServersByStatus = (healthStatus?: string) => {
  const [servers, setServers] = useState<ServerMetrics[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServersByStatus = async (status?: string) => {
    console.log("inside the hook servers by status");
    setLoading(true);
    setError(null);

    try {
      // Call the RPC to get latest unique servers
      const { data, error } = await supabase.rpc("get_latest_unique_servers");
      
      if (error) throw error;

      // Apply status filter if status is provided
      const filteredData = status
        ? data.filter((server: ServerMetrics) => server.health_status === status)
        : data;

      // Keep only unique server_name entries
      const uniqueServers: ServerMetrics[] = [];
      const seenServerNames = new Set<string>();

      (filteredData || []).forEach((server: ServerMetrics) => {
        if (server.server_name && !seenServerNames.has(server.server_name)) {
          uniqueServers.push(server);
          seenServerNames.add(server.server_name);
        }
      });

      setServers(uniqueServers);
    } catch (error: any) {
      console.error("Error fetching servers by status:", error);
      setError(error.message || "Failed to fetch servers");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchServersByStatus(healthStatus);
  }, [healthStatus]);

  return { servers, loading, error, refetch: () => fetchServersByStatus(healthStatus) };
}; 