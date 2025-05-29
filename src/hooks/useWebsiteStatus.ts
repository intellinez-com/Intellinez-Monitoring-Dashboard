// hooks/useWebsiteStatus.ts
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Website } from "@/types/website";

export function useWebsiteStatus() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshWebsite = async (id: string): Promise<Website | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("websites")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      return data as Website;
    } catch (err: any) {
      console.error("Error refreshing website:", err.message);
      setError("Failed to refresh website");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { refreshWebsite, loading, error };
}
