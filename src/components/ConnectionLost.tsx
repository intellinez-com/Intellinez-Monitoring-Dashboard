import React from "react";
import { WifiOff, RefreshCw } from "lucide-react";
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
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-80 z-[9998]" />

      {/* Connection lost banner */}
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white text-center p-3 flex items-center justify-center gap-3 shadow-lg">
        <WifiOff className="w-5 h-5" />
        <span className="flex-1">
          Connection lost. Monitoring is paused until connection is restored.
          {lastChecked && (
            <span className="text-xs block opacity-80">
              Last checked: {lastChecked.toLocaleTimeString()}
            </span>
          )}
        </span>
        <div className="flex gap-2">
          <button
            onClick={handleRetryConnection}
            className="bg-white text-red-700 font-semibold py-1 px-3 rounded hover:bg-red-100 transition duration-200 flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
          <button
            onClick={handleReload}
            className="bg-white text-red-700 font-semibold py-1 px-3 rounded hover:bg-red-100 transition duration-200"
          >
            Reload Page
          </button>
        </div>
      </div>
    </>
  );
};
