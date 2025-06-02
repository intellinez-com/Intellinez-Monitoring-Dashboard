import { useEffect, useRef } from "react";
import { useConnectionStatus } from "./useConnectionStatus";
import { toast } from "@/components/ui/use-toast";

let isNotificationSystemActive = false;

export const useConnectionNotifications = () => {
  const { isOnline, getConnectionTransition, isInitialized } = useConnectionStatus();
  const hasShownOfflineToast = useRef(false);
  const hasShownOnlineToast = useRef(false);

  useEffect(() => {
    // Only allow one instance of the notification system to be active
    if (isNotificationSystemActive) {
      return;
    }

    isNotificationSystemActive = true;

    return () => {
      isNotificationSystemActive = false;
    };
  }, []);

  useEffect(() => {
    // Only proceed if this is the active notification system and we're initialized
    if (!isNotificationSystemActive || !isInitialized) {
      return;
    }

    const { justWentOffline, justWentOnline } = getConnectionTransition();

    // Show offline toast only once per offline session
    if (justWentOffline && !hasShownOfflineToast.current) {
      hasShownOfflineToast.current = true;
      hasShownOnlineToast.current = false; // Reset online toast flag
      
      toast({
        title: "Connection Lost",
        description: "Monitoring paused until connection is restored",
        variant: "destructive",
      });
    }

    // Show online toast only once per online session, and only if we were previously offline
    if (justWentOnline && !hasShownOnlineToast.current && hasShownOfflineToast.current) {
      hasShownOnlineToast.current = true;
      hasShownOfflineToast.current = false; // Reset offline toast flag
      
      toast({
        title: "Connection Restored",
        description: "Monitoring has resumed",
        variant: "success",
      });
    }
  }, [isOnline, getConnectionTransition, isInitialized]);

  return {
    isOnline,
    isInitialized
  };
}; 