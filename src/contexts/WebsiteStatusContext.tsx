// context/WebsiteStatusContext.tsx
import { createContext, useContext, useState, ReactNode } from "react";

type WebsiteCounts = {
  all: number;
  healthy: number;
  degraded: number;
  offline: number;
  intermittent: number;
};

type WebsiteStatusContextType = {
  counts: WebsiteCounts;
  setCounts: (counts: WebsiteCounts) => void;
};

const WebsiteStatusContext = createContext<WebsiteStatusContextType | undefined>(undefined);

export const WebsiteStatusProvider = ({ children }: { children: ReactNode }) => {
  const [counts, setCounts] = useState<WebsiteCounts>({
    all: 0,
    healthy: 0,
    degraded: 0,
    offline: 0,
    intermittent: 0,
  });

  return (
    <WebsiteStatusContext.Provider value={{ counts, setCounts }}>
      {children}
    </WebsiteStatusContext.Provider>
  );
};

export const useWebsiteStatus = () => {
  const context = useContext(WebsiteStatusContext);
  if (!context) throw new Error("useWebsiteStatus must be used within a WebsiteStatusProvider");
  return context;
};
