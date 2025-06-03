import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Servers from "./pages/Servers";
import Databases from "./pages/Databases";
import Metrics from "./pages/Metrics";
import Alerts from "./pages/Alerts";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoutes";
import MonitorWebsite from "./components/dashboard/MonitorWebsite";
import Websites from "./pages/Websites";
import WebsiteLogs from "./pages/WebsiteLogs";
import ServerLogs from "./pages/ServerLogs";
import { WebsiteStatusProvider } from "./contexts/WebsiteStatusContext";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";
import { useConnectionNotifications } from "@/hooks/useConnectionNotifications";
import { ConnectionLost } from "@/components/ConnectionLost";
import { SessionProvider } from "./contexts/SessionContext";

const queryClient = new QueryClient();


const App = () => {
  const { isOnline } = useConnectionStatus();
  
  // Initialize centralized connection notifications
  useConnectionNotifications();
  
  return (
  <QueryClientProvider client={queryClient}>
    <SessionProvider>
    <WebsiteStatusProvider>
    <TooltipProvider>
      <ConnectionLost show={!isOnline} />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/websites"
            element={
              <ProtectedRoute>
                <Websites />
              </ProtectedRoute>
            }
          />
          <Route
            path="/servers"
            element={
              <ProtectedRoute>
                <Servers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/databases"
            element={
              <ProtectedRoute>
                <Databases />
              </ProtectedRoute>
            }
          />
          <Route
            path="/metrics"
            element={
              <ProtectedRoute>
                <Metrics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
          <Route
            path="/website-logs/:id"
            element={
              <ProtectedRoute>
                <WebsiteLogs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/server-logs/:ip"
            element={
              <ProtectedRoute>
                <ServerLogs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alerts"
            element={
              <ProtectedRoute>
                <Alerts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/Monitorwebsite"
            element={
              <ProtectedRoute>
                <MonitorWebsite />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </WebsiteStatusProvider>
    </SessionProvider>
  </QueryClientProvider>
);
};

export default App;
