import { useEffect, useState } from "react";

const DEBUG_KEY = "monitoring_debug_enabled";

export const useConnectionDebug = () => {
  const [debugEnabled, setDebugEnabled] = useState(() => {
    return localStorage.getItem(DEBUG_KEY) === "true";
  });

  const toggleDebug = () => {
    const newValue = !debugEnabled;
    setDebugEnabled(newValue);
    localStorage.setItem(DEBUG_KEY, newValue.toString());
    
    if (newValue) {
      console.log("🔍 Connection monitoring debug enabled");
      console.log("📱 To disable: localStorage.setItem('monitoring_debug_enabled', 'false')");
    } else {
      console.log("🔇 Connection monitoring debug disabled");
    }
  };

  const enableDebug = () => {
    setDebugEnabled(true);
    localStorage.setItem(DEBUG_KEY, "true");
    console.log("🔍 Connection monitoring debug enabled");
  };

  const disableDebug = () => {
    setDebugEnabled(false);
    localStorage.setItem(DEBUG_KEY, "false");
    console.log("🔇 Connection monitoring debug disabled");
  };

  // Expose global functions for debugging
  useEffect(() => {
    (window as any).enableConnectionDebug = enableDebug;
    (window as any).disableConnectionDebug = disableDebug;
    (window as any).toggleConnectionDebug = toggleDebug;

    return () => {
      delete (window as any).enableConnectionDebug;
      delete (window as any).disableConnectionDebug;
      delete (window as any).toggleConnectionDebug;
    };
  }, []);

  return {
    debugEnabled,
    toggleDebug,
    enableDebug,
    disableDebug
  };
}; 