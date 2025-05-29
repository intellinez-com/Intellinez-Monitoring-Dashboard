
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, RefreshCw } from "lucide-react";
import { mockStatusCards } from "@/data/mockData";

export function LiveSiteStatus() {
  const [sites, setSites] = useState(mockStatusCards.filter(card => card.type === "website"));
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);

  // Function to refresh site status - in a real app this would call an API
  const refreshSiteStatus = () => {
    setIsLoading(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      // In a real app, this would be an API call to get fresh data
      const updatedSites = [...mockStatusCards.filter(card => card.type === "website")];
      
      // Randomly update some statuses for demo purposes
      updatedSites.forEach(site => {
        if (Math.random() > 0.7) {
          const statuses = ["healthy", "warning", "critical"];
          site.status = statuses[Math.floor(Math.random() * statuses.length)] as any;
          
          // Update response time randomly
          if (site.responseTime) {
            site.responseTime = Math.floor(Math.random() * 1000) + 100;
          }
        }
      });
       
      setSites(updatedSites);
      setLastUpdated(new Date());
      setIsLoading(false);
    }, 800);
  };
  
  // Effect to refresh site status every minute
  useEffect(() => {
    refreshSiteStatus(); // Initial load
    
    const intervalId = setInterval(() => {
      refreshSiteStatus();
    }, 20000); // Refresh every minute
    
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge className="bg-status-healthy text-white">Healthy</Badge>;
      case "warning":
        return <Badge className="bg-status-warning text-white">Warning</Badge>;
      case "critical":
        return <Badge className="bg-status-critical text-white">Critical</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">Live Site Status</CardTitle>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          <button 
            onClick={refreshSiteStatus} 
            disabled={isLoading}
            className="ml-2 rounded-full p-1 hover:bg-muted"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-2">
          {sites.map((site) => (
            <div 
              key={site.id} 
              className="flex items-center justify-between rounded-md border p-2"
            >
              <div className="font-medium">{site.name}</div>
              <div className="flex items-center gap-4">
                <div className="text-sm">{site.responseTime}ms</div>
                {getStatusBadge(site.status as string)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
