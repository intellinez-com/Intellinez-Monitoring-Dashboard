
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusCard } from "@/components/dashboard/StatusCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { mockStatusCards } from "@/data/mockData";

const Databases = () => {
  // Filter only database type resources
  const databaseCards = mockStatusCards.filter(card => card.type === "database");
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Database Monitoring</h1>
          <p className="text-muted-foreground mt-1">
            Database health and performance metrics
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {databaseCards.map((card) => (
            <StatusCard 
              key={card.id}
              name={card.name}
              type={card.type as any}
              status={card.status as any}
              uptime={card.uptime}
              lastCheck={card.lastCheck}
              metrics={card.metrics}
            />
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Connections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {databaseCards.map((db) => (
                <div key={db.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{db.name}</span>
                    <span>
                      {db.metrics?.find(m => m.name === "Connections")?.value || 0}/
                      {db.metrics?.find(m => m.name === "Connections")?.max || 0}
                    </span>
                  </div>
                  <Progress 
                    value={
                      ((db.metrics?.find(m => m.name === "Connections")?.value || 0) /
                      (db.metrics?.find(m => m.name === "Connections")?.max || 1)) * 100
                    } 
                  />
                </div>
              ))}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Database Storage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {databaseCards.map((db) => (
                <div key={db.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{db.name}</span>
                    <span>
                      {db.metrics?.find(m => m.name === "Storage")?.value || 0}%
                    </span>
                  </div>
                  <Progress 
                    value={db.metrics?.find(m => m.name === "Storage")?.value || 0} 
                    className={
                      (db.metrics?.find(m => m.name === "Storage")?.value || 0) > 90 
                        ? "bg-status-critical" 
                        : (db.metrics?.find(m => m.name === "Storage")?.value || 0) > 70
                          ? "bg-status-warning"
                          : ""
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Databases;
