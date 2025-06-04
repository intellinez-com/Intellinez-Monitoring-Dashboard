import { useEffect, useState, useMemo, useCallback } from "react";
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
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  LineController,
  ChartData
} from 'chart.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Chart } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  LineController
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

type ChartTimeFilterType = '1h' | '6h' | '12h' | '24h';
type LogTimeFilterType = '1h' | '6h' | '12h' | '24h';

export default function WebsiteLogs() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  // Separate state for chart logs and table logs
  const [chartLogs, setChartLogs] = useState<MonitoringLog[]>([]);
  const [logs, setLogs] = useState<MonitoringLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const urlParams = new URLSearchParams(location.search);
  const websiteName = urlParams.get('name') || location.state?.websiteName || "Website";

  const [chartTimeFilter, setChartTimeFilter] = useState<ChartTimeFilterType>('1h');
  const [logTimeFilter, setLogTimeFilter] = useState<LogTimeFilterType>('1h');
  const [showChartUnhappyOnly, setShowChartUnhappyOnly] = useState<boolean>(false);

  const [selectedHealthStatus, setSelectedHealthStatus] = useState<string>("all");
  const [showErrorsOnly, setShowErrorsOnly] = useState<boolean>(false);

  const [uniqueHealthStatuses, setUniqueHealthStatuses] = useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(20);

  // Fetch chart data (for timeline chart)
  const fetchChartData = useCallback(async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      let hoursAgo = 1;
      switch (chartTimeFilter) {
        case '6h': hoursAgo = 6; break;
        case '12h': hoursAgo = 12; break;
        case '24h': hoursAgo = 24; break;
        default: hoursAgo = 1;
      }
      const startTime = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from("website_monitoring_logs")
        .select("*")
        .eq("website_id", id)
        .gte("checked_at", startTime.toISOString())
        .order("checked_at", { ascending: false });

      if (error) throw error;
      setChartLogs(data || []);
    } catch (error) {
      console.error("Error fetching chart data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id, chartTimeFilter]);

  // Fetch logs data (for table)
  const fetchLogsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      let hoursAgo = 1;
      switch (logTimeFilter) {
        case '6h': hoursAgo = 6; break;
        case '12h': hoursAgo = 12; break;
        case '24h': hoursAgo = 24; break;
        default: hoursAgo = 1;
      }
      let startTime = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
      let endTime = now;

      // If user selected fromDate or toDate, override the time filter
      if (fromDate) startTime = new Date(fromDate);
      if (toDate) endTime = new Date(toDate + "T23:59:59");

      let query = supabase
        .from("website_monitoring_logs")
        .select("*")
        .eq("website_id", id)
        .gte("checked_at", startTime.toISOString())
        .lte("checked_at", endTime.toISOString())
        .order("checked_at", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
      setCurrentPage(1);

      if (data) {
        const predefinedStatuses = ["Offline", "Intermittent", "Degraded"];
        const statusesFromLogs = Array.from(new Set(data.map(log => log.health_status))).sort();
        const combinedStatuses = Array.from(new Set(["all", ...predefinedStatuses, ...statusesFromLogs])).sort((a, b) => {
          if (a === "all") return -1;
          if (b === "all") return 1;
          return a.localeCompare(b);
        });
        setUniqueHealthStatuses(combinedStatuses);
      }
    } catch (error) {
      console.error("Error fetching logs data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id, logTimeFilter, fromDate, toDate]);

  // Fetch chart data when chartTimeFilter or id changes
  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  // Fetch logs data when logTimeFilter or id changes, or filters change
  useEffect(() => {
    fetchLogsData();
  }, [fetchLogsData, selectedHealthStatus, showErrorsOnly, fromDate, toDate]);

  // Filter chart logs for timeline chart
  const getTimelineChartFilteredLogs = useCallback(() => {
    let chartFiltered = chartLogs;
    if (showChartUnhappyOnly) {
      chartFiltered = chartFiltered.filter(log => log.health_status.toLowerCase() !== 'healthy');
    }
    return chartFiltered;
  }, [chartLogs, showChartUnhappyOnly]);

  // Filter logs for table
  const getFilteredLogs = useCallback(() => {
    let filtered = logs;

    // Health status filter
    if (selectedHealthStatus !== "all") {
      filtered = filtered.filter(log => log.health_status === selectedHealthStatus);
    }

    // Show errors only filter
    if (showErrorsOnly) {
      filtered = filtered.filter(log => !!log.error_message);
    }

    return filtered;
  }, [logs, selectedHealthStatus, showErrorsOnly]);

  // Memoized paginated logs
  const paginatedLogs = useMemo(() => {
    const filtered = getFilteredLogs();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      logs: filtered.slice(startIndex, endIndex),
      totalCount: filtered.length,
      totalPages: Math.ceil(filtered.length / itemsPerPage),
      hasNext: endIndex < filtered.length,
      hasPrev: currentPage > 1
    };
  }, [getFilteredLogs, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [logTimeFilter, selectedHealthStatus, showErrorsOnly]);

  // Chart data preparation
  const prepareTimelineChartData = useCallback((currentChartTimeFilter: ChartTimeFilterType): ChartData<'bar' | 'line', number[], string> => {
    const filteredLogs = getTimelineChartFilteredLogs();
    const sortedLogs = [...filteredLogs].sort((a, b) =>
      new Date(a.checked_at).getTime() - new Date(b.checked_at).getTime()
    );
    const chartLogs = sortedLogs;

    let barThicknessValue = 8;
    if (currentChartTimeFilter === '6h') barThicknessValue = 6;
    else if (currentChartTimeFilter === '12h') barThicknessValue = 4;
    else if (currentChartTimeFilter === '24h') barThicknessValue = 2;

    const responseTimes = chartLogs.map(log => log.response_time_ms || 0);
    const maxResponseTimeInView = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;
    const baseOffset = Math.max(maxResponseTimeInView * 0.25, 20);
    const dynamicLineData = responseTimes.map(rt => rt + maxResponseTimeInView * 0.3 + baseOffset);

    return {
      labels: chartLogs.map(log => new Date(log.checked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })),
      datasets: [{
        label: 'Response Time (Bars)',
        data: responseTimes,
        backgroundColor: chartLogs.map(log =>
          log.health_status.toLowerCase() === 'healthy'
            ? 'rgb(34, 197, 94)'
            : 'rgb(239, 68, 68)'
        ),
        borderColor: chartLogs.map(log =>
          log.health_status.toLowerCase() === 'healthy'
            ? 'rgb(34, 197, 94)'
            : 'rgb(239, 68, 68)'
        ),
        borderWidth: 1,
        borderRadius: 4,
        barThickness: barThicknessValue,
        order: 2
      },
      {
        type: 'line' as const,
        label: 'Trend Line',
        data: dynamicLineData,
        borderColor: 'rgb(100, 100, 100)',
        borderWidth: 2.5,
        pointBackgroundColor: chartLogs.map(log =>
          log.health_status.toLowerCase() !== 'healthy'
            ? 'rgb(255, 0, 0)'
            : 'transparent'
        ),
        pointBorderColor: chartLogs.map(log =>
          log.health_status.toLowerCase() !== 'healthy'
            ? 'rgb(255,0,0)'
            : 'transparent'
        ),
        pointRadius: chartLogs.map(log =>
          log.health_status.toLowerCase() !== 'healthy'
            ? 5
            : 0
        ),
        pointHoverRadius: chartLogs.map(log =>
          log.health_status.toLowerCase() !== 'healthy'
            ? 7
            : 0
        ),
        fill: false,
        tension: 0.3,
        order: 1
      }]
    };
  }, [getTimelineChartFilteredLogs]);

  const chartData = useMemo(() => prepareTimelineChartData(chartTimeFilter),
    [chartTimeFilter, prepareTimelineChartData]);

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
            const logsForTooltip = getTimelineChartFilteredLogs();
            const sortedLogs = [...logsForTooltip].sort((a, b) => new Date(a.checked_at).getTime() - new Date(b.checked_at).getTime());
            const log = sortedLogs[index];
            if (log && log.checked_at) {
              return new Date(log.checked_at).toLocaleString();
            }
            return "";
          },
          label: (context: any) => {
            const index = context.dataIndex;
            const logsForTooltip = getTimelineChartFilteredLogs();
            const sortedLogs = [...logsForTooltip].sort((a, b) => new Date(a.checked_at).getTime() - new Date(b.checked_at).getTime());
            const log = sortedLogs[index];
            if (log) {
              return [
                `Response Time: ${log.response_time_ms || 0}ms`,
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

  const noDataForChart = getTimelineChartFilteredLogs().length === 0;

  const exportToCSV = () => {
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

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${websiteName.replace(/\s+/g, '_')}_monitoring_logs.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const resetFilters = () => {
    setFromDate("");
    setToDate("");
    setLogTimeFilter("1h");
    setSelectedHealthStatus("all");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2 bg-zinc-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{websiteName}<span className="text-2xl font-semibold"> Monitoring Logs</span></h1>
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
              onClick={() => {
                fetchChartData(); fetchLogsData();
              }}
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
            <div className="mb-6">
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium">Response Time Timeline</h3>
                  <div className="flex gap-2 flex-wrap items-center">
                    <Button
                      variant={chartTimeFilter === '1h' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChartTimeFilter('1h')}
                      className="h-7 text-xs"
                    >
                      Last Hour
                    </Button>
                    <Button
                      variant={chartTimeFilter === '6h' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChartTimeFilter('6h')}
                      className="h-7 text-xs"
                    >
                      6 Hours
                    </Button>
                    <Button
                      variant={chartTimeFilter === '12h' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChartTimeFilter('12h')}
                      className="h-7 text-xs"
                    >
                      12 Hours
                    </Button>
                    <Button
                      variant={chartTimeFilter === '24h' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChartTimeFilter('24h')}
                      className="h-7 text-xs"
                    >
                      24 Hours
                    </Button>
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
                <div className="h-[120px] w-full">
                  <Chart
                    type='bar'
                    data={chartData}
                    options={timelineChartOptions}
                  />
                </div>
                {noDataForChart && (
                  <div className="text-center py-2 text-muted-foreground text-sm">
                    No data available for the selected time range
                  </div>
                )}
              </div>
            </div>

            <div className="px-1 py-4 border-t border-b">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-center">
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
                <div className="sm:col-span-1">
                  <Label htmlFor="logTimeFilter" className="text-xs font-medium text-muted-foreground">Filter Logs by Time</Label>
                  <Select
                    value={logTimeFilter}
                    onValueChange={value => setLogTimeFilter(value as LogTimeFilterType)}
                    disabled={!!fromDate || !!toDate}
                  >
                    <SelectTrigger id="logTimeFilter" className="h-9 mt-1">
                      <SelectValue placeholder="Select time range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">Last Hour</SelectItem>
                      <SelectItem value="6h">Last 6 Hours</SelectItem>
                      <SelectItem value="12h">Last 12 hours</SelectItem>
                      <SelectItem value="24h">Last 24 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2 sm:col-span-1">
                  <div>
                    <Label htmlFor="fromDate" className="text-xs font-medium text-muted-foreground">From</Label>
                    <Input
                      id="fromDate"
                      type="date"
                      value={fromDate}
                      onChange={e => setFromDate(e.target.value)}
                      className="h-9 mt-1"
                      max={toDate || undefined}
                    />
                  </div>
                  <div>
                    <Label htmlFor="toDate" className="text-xs font-medium text-muted-foreground">To</Label>
                    <Input
                      id="toDate"
                      type="date"
                      value={toDate}
                      onChange={e => setToDate(e.target.value)}
                      className="h-9 mt-1"
                      min={fromDate || undefined}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-22 p-4 ml-1 bg-gray-200"
                    onClick={resetFilters}
                  >
                    Reset Filters
                  </Button>
                </div>
                <div className="flex items-center mr-4 space-x-2 mt-2 md:mt-0 justify-end">
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

            <div className="space-y-4 pt-4">
              {paginatedLogs.logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No monitoring logs found
                </div>
              ) : (
                paginatedLogs.logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-sm"
                  >
                    <div className="flex flex-wrap items-center gap-x-10 gap-y-1">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">Time:</span>
                        <span className="text-muted-foreground">
                          {new Date(log.checked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-muted-foreground hidden md:inline">
                          - {new Date(log.checked_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
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
                      {log.response_time_ms !== null && (
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">Response time:</span>
                          <span className="text-muted-foreground font-mono">{log.response_time_ms}ms</span>
                        </div>
                      )}
                      {log.error_message && (
                        <div className="flex items-center gap-1 text-red-500 whitespace-nowrap">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span className="font-medium">Error</span>
                        </div>
                      )}
                    </div>
                    {log.error_message && (
                      <div className="mt-2 p-2 rounded-md bg-red-50 border border-red-200 text-xs text-red-700">
                        {log.error_message}
                      </div>
                    )}
                  </div>
                ))
              )}

              <div className="flex items-center justify-between pt-6 pb-2">
                <div className="text-sm text-gray-600">
                  Total: {paginatedLogs.totalCount} logs
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="gap-1 h-9"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    <span className="text-sm">Page {currentPage} of {paginatedLogs.totalPages}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage >= paginatedLogs.totalPages}
                    className="gap-1 h-9"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}