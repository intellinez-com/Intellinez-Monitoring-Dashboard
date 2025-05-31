import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { WebsiteWithSSL } from "@/types/website";

export const useWebsitesByStatus = (healthStatus?: string) => {
  const [websites, setWebsites] = useState<WebsiteWithSSL[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWebsitesByStatus = async (status?: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Fetching websites with status:", status);
      
      let query = supabase
        .from("latest_active_website_data")
        .select("*")
        .eq("is_active", true)
        .order("website_name", { ascending: true })
        .limit(1000); // Ensure we can get up to 1000 websites

      // Filter by status if provided and not "all"
      if (status && status.toLowerCase() !== "all") {
        query = query.eq("latest_health_status", status);
        console.log("Filtering by status:", status);
      } else {
        console.log("Fetching all websites");
      }

      const { data, error } = await query;

      if (error) throw error;

      console.log("Raw data from database:", data);
      console.log("Number of websites fetched:", data?.length || 0);

      const transformedData = data?.map((website) => ({
        id: website.id,
        website_name: website.website_name,
        url: website.url,
        is_active: website.is_active,
        health_status: website.latest_health_status || "Unknown",
        response_time_ms: website.latest_response_time_ms ?? null,
        status_code: website.latest_status_code ?? 0,
        checked_at: website.latest_checked_at || website.created_at,
        created_at: website.created_at,
        updated_at: website.updated_at,
        created_by: website.created_by,
        updated_by: website.updated_by,
        ssl_expiry: website.ssl_expiry || null,
        issuer: website.issuer || null,
        certificate_status: website.certificate_status || null,
        last_checked: website.ssl_last_checked || null,
        domain_expiry: website.domain_expiry || null,
      })) || [];

      console.log("Transformed websites:", transformedData);
      console.log("Number of transformed websites:", transformedData.length);

      setWebsites(transformedData);
    } catch (error) {
      console.error("Error fetching websites by status:", error);
      setError(error.message || "Failed to fetch websites");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Always fetch when hook is called, whether status is provided or not
    fetchWebsitesByStatus(healthStatus);
  }, [healthStatus]);

  return { websites, loading, error, refetch: () => fetchWebsitesByStatus(healthStatus) };
}; 