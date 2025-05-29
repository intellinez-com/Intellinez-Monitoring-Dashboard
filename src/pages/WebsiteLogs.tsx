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
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setIsLoading(false);
    }
  };


  // Add this function to filter logs based on time
  const getFilteredLogs = () => {
    const now = new Date();
    
    return logs.filter(log => {
      if (!log.checked_at) return false; // Guard for null checked_at
      const logDate = new Date(log.checked_at);
      if (isNaN(logDate.getTime())) return false; // Guard for invalid date string

      const diffInHours = (now.getTime() - logDate.getTime()) / (1000 * 60 * 60);
      
      switch(timeFilter) {
        case '1h':
          return diffInHours <= 1;
        case '12h':
          return diffInHours <= 12;
        case '1d': // 1 day
          return diffInHours <= 24;
        case '1w': // 1 week
          return diffInHours <= 24 * 7;
        default:
          return diffInHours <= 1; // Fallback to 1 hour
      }
    });
  };

  // Modify your prepareTimelineChartData function
  const prepareTimelineChartData = () => {
    const filteredLogs = getFilteredLogs();
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
            ? 'rgba(34, 197, 94, 0.5)' 
            : 'rgba(239, 68, 68, 0.5)'
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
            const filteredLogs = getFilteredLogs();
            const sortedLogs = [...filteredLogs]
              .sort((a, b) => new Date(a.checked_at).getTime() - new Date(b.checked_at).getTime());
            // No slice here, use the full sorted and filtered list
            const log = sortedLogs[index];
            if (log && log.checked_at) {
                return new Date(log.checked_at).toLocaleString();
            }
            return ""; 
          },
          label: (context: any) => {
            const index = context.dataIndex;
            const filteredLogs = getFilteredLogs();
            const sortedLogs = [...filteredLogs]
              .sort((a, b) => new Date(a.checked_at).getTime() - new Date(b.checked_at).getTime());
            // No slice here
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

  // Prepare chart data and related constants once before return
  const chartData = prepareTimelineChartData();
  const numDataPoints = chartData.datasets[0]?.data?.length || 0;
  const chartMinWidth = Math.max(300, numDataPoints * 20); // 20px per bar, min 300px width
  const noDataForSelectedRange = numDataPoints === 0;

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
                  <div className="flex gap-2">
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
                  </div>
                </div>
                {/* MODIFIED: Chart container with horizontal scroll */}
                <div style={{ overflowX: 'auto', width: '100%', height: '140px' }}>
                  <div style={{ height: '120px', minWidth: `${chartMinWidth}px` }}>
                    <Bar
                      data={chartData} // Use pre-calculated chartData
                      options={timelineChartOptions}
                    />
                  </div>
                </div>
                {/* Add a message when no data is available for the selected time range */}
                {noDataForSelectedRange && ( // Use pre-calculated boolean
                  <div className="text-center py-2 text-muted-foreground text-sm">
                    No data available for the selected time range
                  </div>
                )}
              </div>
            </div>

            <ScrollArea className="h-[calc(100vh-420px)]"> {/* Adjusted height to accommodate chart */}
              <div className="space-y-4">
                {logs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No monitoring logs found
                  </div>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="space-y-4">
                        {/* Timestamp Section */}
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Checked:</span>
                          <span className="text-muted-foreground">
                            {formatDistanceToNow(new Date(log.checked_at), {
                              addSuffix: true
                            })}
                            {" • "}
                            {new Date(log.checked_at).toLocaleString()}
                          </span>
                        </div>

                        <Separator />

                        {/* Status Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Activity className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">Health Status:</span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "flex items-center gap-1.5",
                                  getHealthStatusColor(log.health_status)
                                )}
                              >
                                {getHealthStatusIcon(log.health_status)}
                                {log.health_status}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-2">
                              <Hash className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">Status Code:</span>
                              {log.status_code ? (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "font-mono",
                                    getStatusCodeColor(log.status_code)
                                  )}
                                >
                                  {log.status_code}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">N/A</span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Timer className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">Response Time:</span>
                              {log.response_time_ms ? (
                                <Badge variant="outline" className="font-mono">
                                  {log.response_time_ms}ms
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">N/A</span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">Checked At:</span>
                              <span className="text-muted-foreground">
                                {new Date(log.created_at).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Error Message Section */}
                        {log.error_message && (
                          <>
                            <Separator />
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                <span className="font-medium">Error Message:</span>
                              </div>
                              <div className="p-3 rounded-md bg-red-50 border border-red-200">
                                <p className="text-sm text-red-700">
                                  {log.error_message}
                                </p>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
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