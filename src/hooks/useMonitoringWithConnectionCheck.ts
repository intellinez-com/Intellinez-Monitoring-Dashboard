import { useCallback, useEffect, useRef, useState } from "react";
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
    retryDelayMs = 20000, // 5 seconds
    enableLogging = false,
  } = config;

  const { isOnline, checkBeforeApiCall, isInitialized } = useConnectionStatus();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMonitoringRef = useRef(false);
  const retryCountRef = useRef(0);
  
  const [wasOffline, setWasOffline] = useState(false); // Track previous offline state

  const executeWithConnectionCheck = useCallback(async () => {
    if (isMonitoringRef.current) {
      if (enableLogging) console.log("Monitoring already in progress, skipping...");
      return;
    }

    isMonitoringRef.current = true;

    try {
      const isConnected = await checkBeforeApiCall();

      if (!isConnected) {
        if (enableLogging) console.warn("Skipping monitoring: No internet connection");
        return;
      }

      if (enableLogging) console.log("Executing monitoring function...");
      await monitoringFunction();

      retryCountRef.current = 0;
    } catch (error) {
      console.error("Monitoring function failed:", error);

      if (retryCountRef.current < retryAttempts && isOnline) {
        retryCountRef.current++;
        if (enableLogging) {
          console.log(`Scheduling retry ${retryCountRef.current}/${retryAttempts} in ${retryDelayMs}ms`);
        }

        retryTimeoutRef.current = setTimeout(() => {
          executeWithConnectionCheck();
        }, retryDelayMs);
      } else {
        retryCountRef.current = 0;
      }
    } finally {
      isMonitoringRef.current = false;
    }
  }, [monitoringFunction, checkBeforeApiCall, retryAttempts, retryDelayMs, isOnline, enableLogging]);

  // Setup interval monitoring and reconnect-based reload
  useEffect(() => {
    if (!isInitialized) {
      if (enableLogging) console.log("Waiting for connection status to initialize...");
      return;
    }

    if (isOnline && wasOffline) {
      if (enableLogging) console.log("Reconnected – reloading page...");
      window.location.reload(); // 👈 Reload page on reconnect
    }

    setWasOffline(!isOnline); // Track if user was offline

    if (intervalRef.current) clearInterval(intervalRef.current);
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);

    if (isOnline) {
      if (enableLogging) console.log("Starting monitoring - connection is online");
      setTimeout(() => {
        executeWithConnectionCheck();
      }, 100);

      intervalRef.current = setInterval(executeWithConnectionCheck, intervalMs);
    } else {
      if (enableLogging) console.log("Monitoring paused: No internet connection");
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [isOnline, executeWithConnectionCheck, intervalMs, isInitialized, enableLogging, wasOffline]);

  return {
    isOnline,
    isInitialized,
    executeManually: executeWithConnectionCheck,
  };
};
