// src/hooks/useConnectionStatus.ts
import { useEffect, useState, useCallback, useRef } from "react";

export function useConnectionStatus(
  pingUrl = "https://www.cloudflare.com/cdn-cgi/trace",
  intervalMs = 30000 // Default to 30 seconds for ping interval
) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const isOnlineRef = useRef(isOnline);
  const isInitializedRef = useRef(isInitialized);
  const previousOnlineStateRef = useRef<boolean | null>(isOnline);

  // Update refs when their corresponding state changes
  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  useEffect(() => {
    isInitializedRef.current = isInitialized;
  }, [isInitialized]);

  const stableCheckConnectivity = useCallback(async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout for the ping

      const response = await fetch(pingUrl, {
        method: "HEAD",
        cache: "no-cache",
        mode: "cors",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const newOnlineStatus = response.ok;
      
      // Only update state if it actually changed to prevent unnecessary re-renders
      if (newOnlineStatus !== isOnlineRef.current) {
        setIsOnline(newOnlineStatus);
      }
      
      setLastChecked(new Date());

      if (!isInitializedRef.current) {
        setIsInitialized(true);
      }
      return newOnlineStatus;
    } catch (error) {
      // console.warn("Connection check failed:", error); // Log sparingly
      if (isOnlineRef.current) { // Only update state if it changed
        setIsOnline(false);
      }
      setLastChecked(new Date());
      if (!isInitializedRef.current) {
        setIsInitialized(true);
      }
      return false;
    }
  }, [pingUrl]); // Depends only on pingUrl, so it's stable

  const handleOfflineEvent = useCallback(() => {
    if (isOnlineRef.current) { // Check against ref to prevent race conditions
        setIsOnline(false);
        setLastChecked(new Date());
    }
  }, []);

  const handleOnlineEvent = useCallback(() => {
    // When browser merely reports online, always verify with a real check
    stableCheckConnectivity();
  }, [stableCheckConnectivity]);

  useEffect(() => {
    window.addEventListener("offline", handleOfflineEvent);
    window.addEventListener("online", handleOnlineEvent);
    return () => {
      window.removeEventListener("offline", handleOfflineEvent);
      window.removeEventListener("online", handleOnlineEvent);
    };
  }, [handleOfflineEvent, handleOnlineEvent]);

  // Initial connectivity check on mount if not yet initialized
  useEffect(() => {
    if (!isInitializedRef.current) {
      stableCheckConnectivity();
    }
  }, [stableCheckConnectivity]);

  // Periodic connectivity check
  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    if (isInitializedRef.current) { // Start interval only after the first check (initialization)
      intervalId = setInterval(stableCheckConnectivity, intervalMs);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
    // Re-run if isInitialized changes (e.g. after the first check) or if intervalMs changes (though unlikely)
  }, [isInitialized, intervalMs, stableCheckConnectivity]);
  
  const stableCheckBeforeApiCall = useCallback(async (): Promise<boolean> => {
    if (isOnlineRef.current && lastChecked && Date.now() - lastChecked.getTime() < 10000) { // 10s grace period
      return true;
    }
    return await stableCheckConnectivity();
  }, [lastChecked, stableCheckConnectivity]); // Depends on lastChecked (state) and stableCheckConnectivity (stable)

  const getConnectionTransition = useCallback(() => {
    const wasOnline = previousOnlineStateRef.current;
    const isCurrentlyOnline = isOnlineRef.current;
    return {
      justWentOffline: wasOnline === true && !isCurrentlyOnline && isInitializedRef.current,
      justWentOnline: wasOnline === false && isCurrentlyOnline && isInitializedRef.current,
      isInitialized: isInitializedRef.current,
    };
  }, []); // This callback is stable as it only relies on refs

  // Update previousOnlineStateRef *after* isOnline state has possibly changed
  useEffect(() => {
    // This effect runs after the render where `isOnline` might have changed.
    // `previousOnlineStateRef` will store the value of `isOnline` from this render,
    // making it the "previous" value for the *next* render's `getConnectionTransition`.
    previousOnlineStateRef.current = isOnline;
  }, [isOnline]);

  return {
    isOnline,
    checkConnectivity: stableCheckConnectivity, // Expose the stable version
    checkBeforeApiCall: stableCheckBeforeApiCall, // Expose the stable version
    setIsOnline, // If external control is needed
    lastChecked,
    isInitialized,
    getConnectionTransition,
  };
}
