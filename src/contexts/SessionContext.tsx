// SessionContext.tsx
import React, { createContext, useContext, useState } from 'react';

type SessionInfo = {
  ip: string;
  location: string;
};

const SessionContext = createContext<{
  sessionInfo: SessionInfo | null;
  setSessionInfo: (info: SessionInfo) => void;
  clearSessionInfo: () => void;
}>({
  sessionInfo: null,
  setSessionInfo: () => {},
  clearSessionInfo: () => {},
});

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessionInfo, setSession] = useState<SessionInfo | null>(null);

  const setSessionInfo = (info: SessionInfo) => {
    setSession(info);
    sessionStorage.setItem('sessionInfo', JSON.stringify(info));
  };

  const clearSessionInfo = () => {
    setSession(null);
    sessionStorage.removeItem('sessionInfo');
  };

  return (
    <SessionContext.Provider value={{ sessionInfo, setSessionInfo, clearSessionInfo }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
