import { create } from "zustand";
import { supabase } from "@/lib/supabaseClient";

type Website = {
  id: string;
  website_name: string;
};

type WebVital = {
  measured_at: string;
  lcp_ms: number | null;
  fid_ms: number | null;
  cls: number | null;
  fcp_ms: number | null;
  ttfb_ms: number | null;
  tti_ms: number | null;
  inp_ms: number | null;
  device_type: string | null;
};

// Cache type to store web vitals data
type WebVitalsCache = {
  [key: string]: WebVital[]; // key will be websiteId_deviceType
};

type State = {
  websites: Website[];
  selectedWebsite: string;
  deviceType: string;
  webVitals: WebVital[];
  loading: boolean;
  websitesLoading: boolean;
  cache: WebVitalsCache;

  fetchWebsites: () => Promise<void>;
  fetchWebVitals: () => Promise<void>;
  setSelectedWebsite: (id: string) => void;
  setDeviceType: (type: string) => void;
  clearCache: () => void;
};

export const useWebVitalsStore = create<State>((set, get) => ({
  websites: [],
  selectedWebsite: "",
  deviceType: "mobile",
  webVitals: [],
  loading: false,
  websitesLoading: true,
  cache: {},

  fetchWebsites: async () => {
    set({ websitesLoading: true });
    const { data, error } = await supabase
      .from("websites")
      .select("id, website_name")
      .eq("is_active", true);
    if (!error && data) {
      const initialWebsiteId = data[0]?.id || "";
      set({
        websites: data,
        selectedWebsite: initialWebsiteId,
        websitesLoading: false,
      });
      if (initialWebsiteId) {
        get().fetchWebVitals();
      }
    } else {
      set({ websitesLoading: false });
    }
  },

  fetchWebVitals: async () => {
    const { selectedWebsite, deviceType, cache } = get();
    if (!selectedWebsite) {
      set({ webVitals: [] });
      return;
    }

    // Create cache key
    const cacheKey = `${selectedWebsite}_${deviceType}`;

    // Check if data exists in cache
    if (cache[cacheKey]) {
      console.log('Using cached data for:', cacheKey);
      set({ webVitals: cache[cacheKey], loading: false });
      return;
    }

    // If not in cache, fetch from database
    set({ loading: true });
    console.log('Fetching web vitals for website:', selectedWebsite, 'device:', deviceType);
    const { data, error } = await supabase
      .from("web_vitals")
      .select(
        "measured_at, lcp_ms, fid_ms, cls, fcp_ms, ttfb_ms, tti_ms, inp_ms, device_type"
      )
      .eq("website_id", selectedWebsite)
      .eq("device_type", deviceType)
      .order("measured_at", { ascending: true });

    if (!error && data) {
      console.log('Received web vitals data:', data.length, 'records');
      // Update cache and state
      set((state) => ({
        webVitals: data,
        loading: false,
        cache: {
          ...state.cache,
          [cacheKey]: data
        }
      }));
    } else {
      console.error('Error fetching web vitals:', error);
      set({ webVitals: [], loading: false });
    }
  },

  setSelectedWebsite: (id) => {
    console.log('Setting selected website:', id);
    set({ selectedWebsite: id }, false);
    get().fetchWebVitals();
  },

  setDeviceType: (type) => {
    console.log('Setting device type:', type);
    set({ deviceType: type }, false);
    get().fetchWebVitals();
  },

  // Add a method to clear cache (useful when leaving dashboard)
  clearCache: () => {
    set({ cache: {} });
  }
}));
