import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface ServerMetrics {
  id: string;
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
  setLoading(true);
  setError(null);

  try {
    let query = supabase
      .from("server_metrics")
      .select("*")
      .order("hostname", { ascending: true });

    if (status && status.toLowerCase() !== "all") {
      query = query.eq("health_status", status);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Filter for unique hostnames (keep first occurrence)
    const uniqueServers: ServerMetrics[] = [];
    const seenHostnames = new Set<string>();
    (data || []).forEach((server: ServerMetrics) => {
      if (server.ip_address && !seenHostnames.has(server.ip_address)) {
        uniqueServers.push(server);
        seenHostnames.add(server.ip_address);
      }
    });

    setServers(uniqueServers);
  } catch (error) {
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