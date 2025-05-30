import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  RefreshCw, 
  Clock, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Download,
  Timer,
  Hash,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
  } from 'chart.js';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
  
  const chartContainerStyle = {
    minHeight: '32px',
    width: '96px',
    position: 'relative' as const,
    marginLeft: '8px',
    display: 'inline-block',
    verticalAlign: 'middle'
  };

  import { Bar } from 'react-chartjs-2';

  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
  );



interface MonitoringLog {
  id: string;
  website_id: string;
  status_code: number | null;
  response_time_ms: number | null;
  health_status: string;
  error_message: string | null;
  checked_at: string;
  created_at: string;
  created_by: string | null;
  updated_by: string | null;
  updated_at: string | null;
  User_Id: string | null;
}

// Add this type for time filter
type TimeFilter = '1h' | '12h' | '1d' | '1w';

export default function WebsiteLogs() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<MonitoringLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const websiteName = location.state?.websiteName || "Website";

  // Add these to your component's state
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('1h');
  const [showChartUnhappyOnly, setShowChartUnhappyOnly] = useState<boolean>(false);

  // New state variables for advanced filters
  const [selectedHealthStatus, setSelectedHealthStatus] = useState<string>("all");
  const [showErrorsOnly, setShowErrorsOnly] = useState<boolean>(false);

  // State for populating filter dropdowns
  const [uniqueHealthStatuses, setUniqueHealthStatuses] = useState<string[]>([]);

  // New function to filter logs specifically for the timeline chart (time-based only)
  const getTimelineChartFilteredLogs = () => {
    const now = new Date();
    let chartLogs = logs.filter(log => {
      if (!log.checked_at) return false;
      const logDate = new Date(log.checked_at);
      if (isNaN(logDate.getTime())) return false;

      const diffInHours = (now.getTime() - logDate.getTime()) / (1000 * 60 * 60);
      
      switch(timeFilter) {
        case '1h':
          return diffInHours <= 1;
        case '12h':
          return diffInHours <= 12;
        case '1d': 
          return diffInHours <= 24;
        case '1w': 
          return diffInHours <= 24 * 7;
        default:
          return diffInHours <= 1; 
      }
    });

    // Apply the new chart-specific filter for unhappy logs (non-healthy status)
    if (showChartUnhappyOnly) {
      chartLogs = chartLogs.filter(log => log.health_status.toLowerCase() !== 'healthy');
    }

    return chartLogs;
  };

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("website_monitoring_logs")
        .select("*")
        .eq("website_id", id)
        .order("checked_at", { ascending: false });

      if (error) throw error;
      setLogs(data || []);
      // Populate unique filter options after fetching logs
      if (data) {
        const predefinedStatuses = ["Offline", "Intermittent", "Degraded"];
        const statusesFromLogs = Array.from(new Set(data.map(log => log.health_status))).sort();
        const combinedStatuses = Array.from(new Set(["all", ...predefinedStatuses, ...statusesFromLogs])).sort((a,b) => {
          if (a === "all") return -1;
          if (b === "all") return 1;
          return a.localeCompare(b);
        });
        setUniqueHealthStatuses(combinedStatuses);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setIsLoading(false);
    }
  };


  // Add this function to filter logs based on time
  const getFilteredLogs = () => {
    const now = new Date();
    
    let filtered = logs.filter(log => {
      if (!log.checked_at) return false; 
      const logDate = new Date(log.checked_at);
      if (isNaN(logDate.getTime())) return false; 

      const diffInHours = (now.getTime() - logDate.getTime()) / (1000 * 60 * 60);
      
      switch(timeFilter) {
        case '1h':
          return diffInHours <= 1;
        case '12h':
          return diffInHours <= 12;
        case '1d': 
          return diffInHours <= 24;
        case '1w': 
          return diffInHours <= 24 * 7;
        default:
          return diffInHours <= 1; 
      }
    });

    // Apply health status filter
    if (selectedHealthStatus !== "all") {
      filtered = filtered.filter(log => log.health_status === selectedHealthStatus);
    }

    // Apply show errors only filter
    if (showErrorsOnly) {
      filtered = filtered.filter(log => !!log.error_message);
    }

    return filtered;
  };

  // Modify your prepareTimelineChartData function
  const prepareTimelineChartData = () => {
    const filteredLogs = getTimelineChartFilteredLogs(); // Use the new chart-specific filter
    // Sort logs by checked_at to ensure chronological order for the chart
    const sortedLogs = [...filteredLogs].sort((a, b) => 
      new Date(a.checked_at).getTime() - new Date(b.checked_at).getTime()
    );
    const chartLogs = sortedLogs;
    
    return {
      labels: chartLogs.map(log => new Date(log.checked_at).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit', second: '2-digit' })),
      datasets: [{
        label: 'Response Time',
        data: chartLogs.map(log => log.response_time_ms || 0),
        backgroundColor: chartLogs.map(log => 
          log.health_status.toLowerCase() === 'healthy' 
            ? 'rgb(34, 197, 94)'  // Solid green
            : 'rgb(239, 68, 68)' // Solid red
        ),
        borderColor: chartLogs.map(log => 
          log.health_status.toLowerCase() === 'healthy'
            ? 'rgb(34, 197, 94)'
            : 'rgb(239, 68, 68)'
        ),
        borderWidth: 1,
        borderRadius: 4,
        // barThickness: 12, // Removed to allow dynamic sizing with scroll
      }]
    };
  };

  // Add these chart options for the timeline
  const timelineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          title: (tooltipItems: any) => {
            const index = tooltipItems[0].dataIndex;
            const filteredLogs = getTimelineChartFilteredLogs(); // Use the new chart-specific filter for tooltips
            const sortedLogs = [...filteredLogs]
              .sort((a, b) => new Date(a.checked_at).getTime() - new Date(b.checked_at).getTime());
            const log = sortedLogs[index];
            if (log && log.checked_at) {
                return new Date(log.checked_at).toLocaleString();
            }
            return ""; 
          },
          label: (context: any) => {
            const index = context.dataIndex;
            const filteredLogs = getTimelineChartFilteredLogs(); // Use the new chart-specific filter for tooltips
            const sortedLogs = [...filteredLogs]
              .sort((a, b) => new Date(a.checked_at).getTime() - new Date(b.checked_at).getTime());
            const log = sortedLogs[index];
            if (log) {
                return [
                  `Response Time: ${context.raw}ms`,
                  `Status: ${log.health_status}`,
                  `Status Code: ${log.status_code || 'N/A'}`
                ];
            }
            return [];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: (value: number) => `${value}ms`
        },
        border: {
          display: false
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          display: false
        },
        border: {
          display: false
        }
      }
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [id]);

  const exportToCSV = () => {
    // Convert logs to CSV format
    const headers = [
      "Checked At",
      "Health Status",
      "Status Code",
      "Response Time (ms)",
      "Error Message",
      "Created At"
    ];

    const csvData = logs.map(log => [
      new Date(log.checked_at).toLocaleString(),
      log.health_status,
      log.status_code || "N/A",
      log.response_time_ms || "N/A",
      log.error_message || "None",
      new Date(log.created_at).toLocaleString()
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(cell => 
        typeof cell === 'string' && cell.includes(",") 
          ? `"${cell}"` 
          : cell
      ).join(","))
    ].join("\n");

    // Create and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${websiteName.replace(/\s+/g, '_')}_monitoring_logs.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getHealthStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "healthy":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "degraded":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "offline":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "healthy":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "degraded":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "offline":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusCodeColor = (code: number | null) => {
    if (!code) return "bg-gray-100 text-gray-700";
    if (code >= 200 && code < 300) return "bg-emerald-100 text-emerald-700";
    if (code >= 300 && code < 400) return "bg-blue-100 text-blue-700";
    if (code >= 400 && code < 500) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  // Prepare chart data once before return
  const chartData = prepareTimelineChartData();
  // The "noDataForSelectedRange" for the chart should also use the chart-specific filter
  const noDataForChart = getTimelineChartFilteredLogs().length === 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{websiteName} Monitoring Logs</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLogs}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Monitoring History</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Add this new section for the response time chart */}
            <div className="mb-6">
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium">Response Time Timeline</h3>
                  <div className="flex gap-2 flex-wrap items-center">
                    {/* Time Period Filters */}
                    <Button
                      variant={timeFilter === '1h' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTimeFilter('1h')}
                      className="h-7 text-xs"
                    >
                      Last Hour
                    </Button>
                    <Button
                      variant={timeFilter === '12h' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTimeFilter('12h')}
                      className="h-7 text-xs"
                    >
                      12 Hours
                    </Button>
                    <Button
                      variant={timeFilter === '1d' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTimeFilter('1d')}
                      className="h-7 text-xs"
                    >
                      1 Day
                    </Button>
                    <Button
                      variant={timeFilter === '1w' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTimeFilter('1w')}
                      className="h-7 text-xs"
                    >
                      1 Week
                    </Button>
                    {/* New Switch for chart: Show Unhappy Only */}
                    <div className="flex items-center space-x-2 pl-2">
                      <Switch 
                        id="showChartUnhappyOnly" 
                        checked={showChartUnhappyOnly} 
                        onCheckedChange={setShowChartUnhappyOnly} 
                      />
                      <Label htmlFor="showChartUnhappyOnly" className="text-xs text-muted-foreground">
                        Show Errors Only
                      </Label>
                    </div>
                  </div>
                </div>
                {/* MODIFIED: Chart container to fit available width */}
                <div className="h-[120px] w-full">
                  <Bar
                    data={chartData} // Use pre-calculated chartData
                    options={timelineChartOptions}
                  />
                </div>
                {/* Add a message when no data is available for the selected time range */}
                {noDataForChart && ( // Use chart-specific boolean
                  <div className="text-center py-2 text-muted-foreground text-sm">
                    No data available for the selected time range
                  </div>
                )}
              </div>
            </div>

            {/* New Advanced Filters Section */}
            <div className="px-1 py-4 border-t border-b">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                {/* Health Status Filter */}
                <div className="sm:col-span-1">
                  <Label htmlFor="healthStatusFilter" className="text-xs font-medium text-muted-foreground">Filter by Health Status</Label>
                  <Select value={selectedHealthStatus} onValueChange={setSelectedHealthStatus}>
                    <SelectTrigger id="healthStatusFilter" className="h-9 mt-1">
                      <SelectValue placeholder="Select health status" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueHealthStatuses.map(status => (
                        <SelectItem key={status} value={status}>
                          {status === "all" ? "All Health Statuses" : status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Show Errors Only Filter */}
                <div className="flex items-center space-x-2 justify-self-start sm:col-span-1">
                  <Switch 
                    id="showErrorsOnly" 
                    checked={showErrorsOnly} 
                    onCheckedChange={setShowErrorsOnly} 
                  />
                  <Label htmlFor="showErrorsOnly" className="text-sm">
                    Show Errors Only
                  </Label>
                </div>
              </div>
            </div>

            <ScrollArea className="h-[calc(100vh-500px)]"> {/* Adjusted height to accommodate filters */}
              <div className="space-y-4 pt-4">
                {getFilteredLogs().length === 0 ? ( // Use getFilteredLogs() here to reflect all filters
                  <div className="text-center py-8 text-muted-foreground">
                    No monitoring logs found
                  </div>
                ) : (
                  getFilteredLogs().map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-sm"
                    >
                      <div className="flex flex-wrap items-center gap-x-10 gap-y-1">
                        {/* Timestamp (Short) */}
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">Time:</span>
                          <span className="text-muted-foreground">
                            {new Date(log.checked_at).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                          </span>
                          <span className="text-muted-foreground hidden md:inline">
                             - {new Date(log.checked_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>

                        {/* Health Status & Code */}
                        <div className="flex items-center gap-4 whitespace-nowrap">
                          {getHealthStatusIcon(log.health_status)} 
                          <span className="font-medium">Health Status:</span>
                          <span 
                            className={cn(
                              log.health_status.toLowerCase() === 'healthy' ? "text-emerald-600" :
                              log.health_status.toLowerCase() === 'degraded' ? "text-yellow-600" :
                              log.health_status.toLowerCase() === 'offline' ? "text-red-600" : "text-gray-600"
                            )}
                          >
                            {log.health_status}
                          </span>
                          {log.status_code && (
                            <>
                              <span className="font-medium ml-1">Status Code:</span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "font-mono text-xs h-5 px-1.5",
                                  getStatusCodeColor(log.status_code)
                                )}
                              >
                                {log.status_code}
                              </Badge>
                            </>
                          )}
                        </div>
                        
                        {/* Response Time */}
                        {log.response_time_ms !== null && (
                           <div className="flex items-center gap-1 whitespace-nowrap">
                            <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-medium">Response time:</span>
                            <span className="text-muted-foreground font-mono">{log.response_time_ms}ms</span>
                          </div>
                        )}

                        {/* Error Indicator (only if error exists) */}
                        {log.error_message && (
                          <div className="flex items-center gap-1 text-red-500 whitespace-nowrap">
                            <AlertCircle className="h-3.5 w-3.5" />
                            <span className="font-medium">Error</span>
                          </div>
                        )}
                      </div>
                      {/* Error Message Section (if exists, on new line) */}
                      {log.error_message && (
                        <div className="mt-2 p-2 rounded-md bg-red-50 border border-red-200 text-xs text-red-700">
                          {log.error_message}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}