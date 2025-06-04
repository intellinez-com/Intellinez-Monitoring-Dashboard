import React from "react";
import { WifiOff } from "lucide-react";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";

interface Props {
  show: boolean;
}

export const ConnectionLost: React.FC<Props> = ({ show }) => {
  const { checkConnectivity, lastChecked } = useConnectionStatus();

  const handleRetryConnection = async () => {
    await checkConnectivity();
  };

  const handleReload = () => {
    window.location.reload();
  };

  if (!show) return null;

  return (
    <>
      {/* Dark transparent overlay */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998]" />

      {/* Notification bar */}
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white px-6 py-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <WifiOff className="w-6 h-6 text-white" />
          <div>
            <p className="font-medium text-sm sm:text-base">
              Connection lost. Monitoring is paused until connection is restored.
            </p>
            {lastChecked && (
              <p className="text-xs opacity-80 mt-1">
                Last checked: {lastChecked.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRetryConnection}
            className="bg-white text-red-700 font-semibold text-sm px-4 py-1.5 rounded-lg hover:bg-red-100 transition"
          >
            Retry
          </button>
          <button
            onClick={handleReload}
            className="bg-white text-red-700 font-semibold text-sm px-4 py-1.5 rounded-lg hover:bg-red-100 transition"
          >
            Reload Page
          </button>
        </div>
      </div>
    </>
  );
};
