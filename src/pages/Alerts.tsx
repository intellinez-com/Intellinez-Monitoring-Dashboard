
import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AlertsList } from "@/components/dashboard/AlertsList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockAlerts } from "@/data/mockData";
import { Bell, Check, AlertTriangle, Info } from "lucide-react";

const Alerts = () => {
  const [activeTab, setActiveTab] = useState("all");
  
  const criticalAlerts = mockAlerts.filter(alert => alert.level === "critical");
  const warningAlerts = mockAlerts.filter(alert => alert.level === "warning");
  const infoAlerts = mockAlerts.filter(alert => alert.level === "info");
  const unacknowledgedAlerts = mockAlerts.filter(alert => !alert.acknowledged);
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Alerts & Notifications</h1>
            <p className="text-muted-foreground mt-1">
              Monitor and manage system alerts
            </p>
          </div>
          <Button>
            <Bell className="mr-2 h-4 w-4" />
            Create Alert Rule
          </Button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-muted-foreground">All Alerts</p>
                <p className="text-2xl font-bold">{mockAlerts.length}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                <Bell className="h-4 w-4 text-gray-700" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold">{criticalAlerts.length}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-status-critical" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-muted-foreground">Warning</p>
                <p className="text-2xl font-bold">{warningAlerts.length}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-status-warning" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-muted-foreground">Info</p>
                <p className="text-2xl font-bold">{infoAlerts.length}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Info className="h-4 w-4 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Alert History</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="critical">Critical</TabsTrigger>
                <TabsTrigger value="warning">Warning</TabsTrigger>
                <TabsTrigger value="unacknowledged">Unacknowledged</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="mt-4">
                <AlertsList alerts={mockAlerts} />
              </TabsContent>
              <TabsContent value="critical" className="mt-4">
                <AlertsList alerts={criticalAlerts} />
              </TabsContent>
              <TabsContent value="warning" className="mt-4">
                <AlertsList alerts={warningAlerts} />
              </TabsContent>
              <TabsContent value="unacknowledged" className="mt-4">
                <AlertsList alerts={unacknowledgedAlerts} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Alerts;
