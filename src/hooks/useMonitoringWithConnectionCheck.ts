import { useCallback, useEffect, useRef } from "react";
import { useConnectionStatus } from "./useConnectionStatus";

interface MonitoringConfig {
  intervalMs?: number;
  retryAttempts?: number;
  retryDelayMs?: number;
  enableLogging?: boolean;
}

export const useMonitoringWithConnectionCheck = (
  monitoringFunction: () => Promise<void>,
  config: MonitoringConfig = {}
) => {
  const {
    intervalMs = 60000, // Default 1 minute
    retryAttempts = 3,
    retryDelayMs = 5000, // 5 seconds
    enableLogging = false
  } = config;

  const { isOnline, checkBeforeApiCall, isInitialized } = useConnectionStatus();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMonitoringRef = useRef(false);
  const retryCountRef = useRef(0);

  const executeWithConnectionCheck = useCallback(async () => {
    if (isMonitoringRef.current) {
      if (enableLogging) console.log("Monitoring already in progress, skipping...");
      return;
    }
    
    isMonitoringRef.current = true;

    try {
      // Check connection before making API call
      const isConnected = await checkBeforeApiCall();
      
      if (!isConnected) {
        if (enableLogging) console.warn("Skipping monitoring: No internet connection");
        return;
      }

      if (enableLogging) console.log("Executing monitoring function...");
      
      // Execute the monitoring function
      await monitoringFunction();
      
      // Reset retry count on successful execution
      retryCountRef.current = 0;
      
    } catch (error) {
      console.error("Monitoring function failed:", error);
      
      // If it's a network error and we have retry attempts left, schedule a retry
      if (retryCountRef.current < retryAttempts && isOnline) {
        retryCountRef.current++;
        if (enableLogging) {
          console.log(`Scheduling retry ${retryCountRef.current}/${retryAttempts} in ${retryDelayMs}ms`);
        }
        
        retryTimeoutRef.current = setTimeout(() => {
          executeWithConnectionCheck();
        }, retryDelayMs);
      } else {
        retryCountRef.current = 0; // Reset retry count after max attempts
      }
    } finally {
      isMonitoringRef.current = false;
    }
  }, [monitoringFunction, checkBeforeApiCall, retryAttempts, retryDelayMs, isOnline, enableLogging]);

  // Setup interval monitoring
  useEffect(() => {
    // Don't start monitoring until connection status is initialized
    if (!isInitialized) {
      if (enableLogging) console.log("Waiting for connection status to initialize...");
      return;
    }

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Clear any pending retry
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    if (isOnline) {
      if (enableLogging) console.log("Starting monitoring - connection is online");
      
      // Run immediately when online (with a small delay to avoid race conditions)
      setTimeout(() => {
        executeWithConnectionCheck();
      }, 100);
      
      // Set up interval
      intervalRef.current = setInterval(executeWithConnectionCheck, intervalMs);
    } else {
      if (enableLogging) console.log("Monitoring paused: No internet connection");
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [isOnline, executeWithConnectionCheck, intervalMs, isInitialized, enableLogging]);

  return {
    isOnline,
    isInitialized,
    executeManually: executeWithConnectionCheck,
  };
}; 