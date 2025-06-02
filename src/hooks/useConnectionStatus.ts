// src/hooks/useConnectionStatus.ts
import { useEffect, useState, useCallback, useRef } from "react";

export function useConnectionStatus(
  pingUrl = "https://httpbin.org/status/200",
  intervalMs = 30000
) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const previousOnlineState = useRef<boolean | null>(null);

  // 1️⃣ Instant "offline" if browser event fires
  useEffect(() => {
    const handleOffline = () => {
      setIsOnline(false);
      setLastChecked(new Date());
    };
    const handleOnline = () => {
      // We'll double-check with a ping (in case "online" is flaky)
      checkConnectivity();
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  // 2️⃣ A reusable ping check with better error handling
  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(pingUrl, {
        method: "HEAD",
        cache: "no-cache",
        signal: controller.signal,
        // Remove no-cors to get actual response status
      });

      clearTimeout(timeoutId);
      
      const wasOnline = isOnline;
      
      if (response.ok) {
        setIsOnline(true);
        setLastChecked(new Date());
        
        if (!isInitialized) {
          setIsInitialized(true);
        }
        
        // Track state transition
        previousOnlineState.current = true;
        return true;
      } else {
        setIsOnline(false);
        setLastChecked(new Date());
        
        if (!isInitialized) {
          setIsInitialized(true);
        }
        
        // Track state transition
        previousOnlineState.current = false;
        return false;
      }
    } catch (error) {
      console.warn("Connection check failed:", error);
      setIsOnline(false);
      setLastChecked(new Date());
      
      if (!isInitialized) {
        setIsInitialized(true);
      }
      
      // Track state transition
      previousOnlineState.current = false;
      return false;
    }
  }, [pingUrl, isOnline, isInitialized]);

  // 3️⃣ Check connection before making API calls
  const checkBeforeApiCall = useCallback(async (): Promise<boolean> => {
    // If we recently checked (less than 10 seconds ago) and were online, assume still online
    if (lastChecked && isOnline && Date.now() - lastChecked.getTime() < 10000) {
      return true;
    }
    
    // Otherwise, do a fresh check
    return await checkConnectivity();
  }, [checkConnectivity, isOnline, lastChecked]);

  // 4️⃣ Get connection transition info
  const getConnectionTransition = useCallback(() => {
    const wasOnline = previousOnlineState.current;
    const isCurrentlyOnline = isOnline;
    
    return {
      justWentOffline: wasOnline === true && !isCurrentlyOnline && isInitialized,
      justWentOnline: wasOnline === false && isCurrentlyOnline && isInitialized,
      isInitialized
    };
  }, [isOnline, isInitialized]);

  // 5️⃣ Periodic ping every intervalMs to catch "silent" drops
  useEffect(() => {
    const intervalId = setInterval(checkConnectivity, intervalMs);
    // Run one immediately on mount
    checkConnectivity();

    return () => clearInterval(intervalId);
  }, [checkConnectivity, intervalMs]);

  return { 
    isOnline, 
    checkConnectivity, 
    checkBeforeApiCall,
    setIsOnline,
    lastChecked,
    isInitialized,
    getConnectionTransition
  };
}
