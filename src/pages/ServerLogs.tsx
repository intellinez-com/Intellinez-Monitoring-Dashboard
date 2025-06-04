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
  Hash,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
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
  ChartData,
} from "chart.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { Chart } from "react-chartjs-2";

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

interface ServerMonitoringLog {
  id: string;
  server_name: string;
  cpu_percent: number | null;
  memory_percent: number | null;
  disk_percent: number | null;
  running_processes: number | null;
  health_status: string;
  error_message: string | null;
  checked_at: string;
  created_at: string;
  created_by: string | null;
  updated_by: string | null;
  updated_at: string | null;
  User_Id: string | null;
}

type ChartTimeFilterType = "1h" | "6h" | "12h" | "24h";
type LogTimeFilterType = "1h" | "6h" | "12h" | "24h";
type MetricType = "cpu_percent" | "memory_percent" | "disk_percent";

export default function ServerLogs() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [logs, setLogs] = useState<ServerMonitoringLog[]>([]);
  const [chartLogs, setChartLogs] = useState<ServerMonitoringLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] =
    useState<MetricType>("cpu_percent");

  const urlParams = new URLSearchParams(location.search);
  const serverName =
    urlParams.get("name") || location.state?.serverName || "Server";

  const [chartTimeFilter, setChartTimeFilter] =
    useState<ChartTimeFilterType>("1h");
  const [logTimeFilter, setLogTimeFilter] = useState<LogTimeFilterType>("1h");
  const [showChartUnhappyOnly, setShowChartUnhappyOnly] =
    useState<boolean>(false);

  const [selectedHealthStatus, setSelectedHealthStatus] =
    useState<string>("all");
  const [showErrorsOnly, setShowErrorsOnly] = useState<boolean>(false);

  const [uniqueHealthStatuses, setUniqueHealthStatuses] = useState<string[]>(
    []
  );

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(20);

  const getTimelineChartFilteredLogs = useCallback(() => {
    const now = new Date();
    let filtered = chartLogs.filter((log) => {
      if (!log.checked_at) return false;
      const logDate = new Date(log.checked_at);
      if (isNaN(logDate.getTime())) return false;
      const diffInHours =
        (now.getTime() - logDate.getTime()) / (1000 * 60 * 60);
      switch (chartTimeFilter) {
        case "1h":
          return diffInHours <= 1;
        case "6h":
          return diffInHours <= 6;
        case "12h":
          return diffInHours <= 12;
        case "24h":
          return diffInHours <= 24;
        default:
          return diffInHours <= 1;
      }
    });
    if (showChartUnhappyOnly) {
      filtered = filtered.filter(
        (log) => log.health_status.toLowerCase() !== "healthy"
      );
    }
    return filtered;
  }, [chartLogs, chartTimeFilter, showChartUnhappyOnly]);

  const fetchChartLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("server_metrics")
        .select("*")
        .eq("server_name", serverName)
        .order("checked_at", { ascending: false });
      if (error) throw error;
      setChartLogs(data || []);
    } catch (error) {
      console.error("Error fetching chart logs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [serverName]);

  // Fetch logs data (for table, with date filtering)
  const fetchTableLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("server_metrics")
        .select("*")
        .eq("server_name", serverName)
        .order("checked_at", { ascending: false });

      // Apply date filters if set
      if (fromDate)
        query = query.gte("checked_at", new Date(fromDate).toISOString());
      if (toDate)
        query = query.lte(
          "checked_at",
          new Date(toDate + "T23:59:59").toISOString()
        );

      const { data, error } = await query;
      if (error) throw error;
      setLogs(data || []);
      setCurrentPage(1);

      if (data) {
        const predefinedStatuses = ["Offline", "Intermittent", "Degraded"];
        const statusesFromLogs = Array.from(
          new Set(data.map((log) => log.health_status))
        ).sort();
        const combinedStatuses = Array.from(
          new Set(["all", ...predefinedStatuses, ...statusesFromLogs])
        ).sort((a, b) => {
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
  }, [serverName, fromDate, toDate]);

  // Fetch chart logs and table logs on mount and when dependencies change
  useEffect(() => {
    fetchChartLogs();
  }, [fetchChartLogs, chartTimeFilter, showChartUnhappyOnly, selectedMetric]);

  useEffect(() => {
    fetchTableLogs();
  }, [
    fetchTableLogs,
    logTimeFilter,
    selectedHealthStatus,
    showErrorsOnly,
    fromDate,
    toDate,
  ]);

  const getFilteredLogs = () => {
    let filtered = logs;

    // Date range filter
    if (fromDate) {
      filtered = filtered.filter(
        (log) => new Date(log.checked_at) >= new Date(fromDate)
      );
    }
    if (toDate) {
      const toDateObj = new Date(toDate + "T23:59:59");
      filtered = filtered.filter(
        (log) => new Date(log.checked_at) <= toDateObj
      );
    }

    // Time filter (if no from/to date, fallback to hour-based)
    if (!fromDate && !toDate) {
      const now = new Date();
      filtered = filtered.filter((log) => {
        if (!log.checked_at) return false;
        const logDate = new Date(log.checked_at);
        if (isNaN(logDate.getTime())) return false;
        const diffInHours =
          (now.getTime() - logDate.getTime()) / (1000 * 60 * 60);
        switch (logTimeFilter) {
          case "1h":
            return diffInHours <= 1;
          case "6h":
            return diffInHours <= 6;
          case "12h":
            return diffInHours <= 12;
          case "24h":
            return diffInHours <= 24;
          default:
            return diffInHours <= 1;
        }
      });
    }

    if (selectedHealthStatus !== "all") {
      filtered = filtered.filter(
        (log) => log.health_status === selectedHealthStatus
      );
    }
    if (showErrorsOnly) {
      filtered = filtered.filter(
        (log) => log.health_status?.toLowerCase() !== "healthy"
      );
    }
    return filtered;
  };
  const getPaginatedLogs = () => {
    const filtered = getFilteredLogs();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      logs: filtered.slice(startIndex, endIndex),
      totalCount: filtered.length,
      totalPages: Math.ceil(filtered.length / itemsPerPage),
      hasNext: endIndex < filtered.length,
      hasPrev: currentPage > 1,
    };
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [logTimeFilter, selectedHealthStatus, showErrorsOnly]);

  const prepareTimelineChartData = useCallback(
    (
      currentChartTimeFilter: ChartTimeFilterType
    ): ChartData<"bar" | "line", number[], string> => {
      const filteredLogs = getTimelineChartFilteredLogs();
      const sortedLogs = [...filteredLogs].sort(
        (a, b) =>
          new Date(a.checked_at).getTime() - new Date(b.checked_at).getTime()
      );
      const chartLogs = sortedLogs;

      let barThicknessValue = 8;
      if (currentChartTimeFilter === "6h") barThicknessValue = 6;
      else if (currentChartTimeFilter === "12h") barThicknessValue = 4;
      else if (currentChartTimeFilter === "24h") barThicknessValue = 2;

      const metricData = chartLogs.map((log) => log[selectedMetric] || 0);
      const maxMetricInView =
        metricData.length > 0 ? Math.max(...metricData) : 0;
      const baseOffset = Math.max(maxMetricInView * 0.25, 20);
      const dynamicLineData = metricData.map(
        (value) => value + maxMetricInView * 0.3 + baseOffset
      );

      const getMetricLabel = () => {
        switch (selectedMetric) {
          case "cpu_percent":
            return "CPU Usage (Bars)";
          case "memory_percent":
            return "Memory Usage (Bars)";
          case "disk_percent":
            return "Disk Usage (Bars)";
          default:
            return "CPU Usage (Bars)";
        }
      };

      return {
        labels: chartLogs.map((log) =>
          new Date(log.checked_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        ),
        datasets: [
          {
            label: getMetricLabel(),
            data: metricData,
            backgroundColor: chartLogs.map((log) =>
              log.health_status.toLowerCase() === "healthy"
                ? "rgb(34, 197, 94)"
                : "rgb(239, 68, 68)"
            ),
            borderColor: chartLogs.map((log) =>
              log.health_status.toLowerCase() === "healthy"
                ? "rgb(34, 197, 94)"
                : "rgb(239, 68, 68)"
            ),
            borderWidth: 1,
            borderRadius: 4,
            barThickness: barThicknessValue,
            order: 2,
          },
          {
            type: "line" as const,
            label: "Trend Line",
            data: dynamicLineData,
            borderColor: "rgb(100, 100, 100)",
            borderWidth: 2.5,
            pointBackgroundColor: chartLogs.map((log) =>
              log.health_status.toLowerCase() !== "healthy"
                ? "rgb(255, 0, 0)"
                : "transparent"
            ),
            pointBorderColor: chartLogs.map((log) =>
              log.health_status.toLowerCase() !== "healthy"
                ? "rgb(255,0,0)"
                : "transparent"
            ),
            pointRadius: chartLogs.map((log) =>
              log.health_status.toLowerCase() !== "healthy" ? 5 : 0
            ),
            pointHoverRadius: chartLogs.map((log) =>
              log.health_status.toLowerCase() !== "healthy" ? 7 : 0
            ),
            fill: false,
            tension: 0.3,
            order: 1,
          },
        ],
      };
    },
    [getTimelineChartFilteredLogs, selectedMetric]
  );

  const chartData = useMemo(
    () => prepareTimelineChartData(chartTimeFilter),
    [chartTimeFilter, prepareTimelineChartData]
  );

  const timelineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: (tooltipItems: any) => {
            const index = tooltipItems[0].dataIndex;
            const logsForTooltip = getTimelineChartFilteredLogs();
            const sortedLogs = [...logsForTooltip].sort(
              (a, b) =>
                new Date(a.checked_at).getTime() -
                new Date(b.checked_at).getTime()
            );
            const log = sortedLogs[index];
            if (log && log.checked_at) {
              return new Date(log.checked_at).toLocaleString();
            }
            return "";
          },
          label: (context: any) => {
            const index = context.dataIndex;
            const logsForTooltip = getTimelineChartFilteredLogs();
            const sortedLogs = [...logsForTooltip].sort(
              (a, b) =>
                new Date(a.checked_at).getTime() -
                new Date(b.checked_at).getTime()
            );
            const log = sortedLogs[index];
            if (log) {
              return [
                `CPU Usage: ${log.cpu_percent || 0}%`,
                `Memory Usage: ${log.memory_percent || 0}%`,
                `Disk Usage: ${log.disk_percent || 0}%`,
                `Status: ${log.health_status}`,
              ];
            }
            return [];
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          callback: (value: number) => `${value}%`,
        },
        border: {
          display: false,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          display: false,
        },
        border: {
          display: false,
        },
      },
    },
  };

  const noDataForChart = getTimelineChartFilteredLogs().length === 0;

  const exportToCSV = () => {
    const headers = [
      "Checked At",
      "Health Status",
      "CPU Usage (%)",
      "Memory Usage (%)",
      "Disk Usage (%)",
      "Running Processes",
      "Error Message",
      "Created At",
    ];

    const csvData = logs.map((log) => [
      new Date(log.checked_at).toLocaleString(),
      log.health_status,
      log.cpu_percent || "N/A",
      log.memory_percent || "N/A",
      log.disk_percent || "N/A",
      log.running_processes || "N/A",
      log.error_message || "None",
      new Date(log.created_at).toLocaleString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        row
          .map((cell) =>
            typeof cell === "string" && cell.includes(",") ? `"${cell}"` : cell
          )
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${serverName.replace(/\s+/g, "_")}_monitoring_logs.csv`
    );
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
  const resetFilters = () => {
    setFromDate("");
    setToDate("");
    setLogTimeFilter("1h");
    setSelectedHealthStatus("all");
  };

  const maxDate = useMemo(() => {
  return new Date().toISOString().split("T")[0]; // Today
}, []);

const minDate = useMemo(() => {
  const date = new Date();
  date.setDate(date.getDate() - 30); // 30 days ago
  return date.toISOString().split("T")[0];
}, []);

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
              <h1 className="text-3xl font-bold">
                {serverName}
                <span className="text-2xl font-semibold"> Monitoring Logs</span>
              </h1>
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
                fetchChartLogs();
                fetchTableLogs();
              }}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
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
                  <div className="flex justify-between gap-2 items-center">
                    <h3 className="text-sm font-medium">
                      Resource Usage Timeline
                    </h3>
                    <div className="flex items-center space-x-2 pl-2">
                      <Button
                        variant={
                          selectedMetric === "cpu_percent"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => setSelectedMetric("cpu_percent")}
                        className="h-7 text-xs"
                      >
                        CPU
                      </Button>
                      <Button
                        variant={
                          selectedMetric === "memory_percent"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => setSelectedMetric("memory_percent")}
                        className="h-7 text-xs"
                      >
                        Memory
                      </Button>
                      <Button
                        variant={
                          selectedMetric === "disk_percent"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => setSelectedMetric("disk_percent")}
                        className="h-7 text-xs"
                      >
                        Disk
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap items-center ">
                    <div className="flex items-center space-x-2 pl-2">
                      <Button
                        variant={
                          chartTimeFilter === "1h" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setChartTimeFilter("1h")}
                        className="h-7 text-xs"
                      >
                        Last Hour
                      </Button>
                      <Button
                        variant={
                          chartTimeFilter === "6h" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setChartTimeFilter("6h")}
                        className="h-7 text-xs"
                      >
                        6 Hours
                      </Button>
                      <Button
                        variant={
                          chartTimeFilter === "12h" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setChartTimeFilter("12h")}
                        className="h-7 text-xs"
                      >
                        12 Hours
                      </Button>
                      <Button
                        variant={
                          chartTimeFilter === "24h" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setChartTimeFilter("24h")}
                        className="h-7 text-xs"
                      >
                        24 Hours
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2 pl-2">
                      <Switch
                        id="showChartUnhappyOnly"
                        checked={showChartUnhappyOnly}
                        onCheckedChange={setShowChartUnhappyOnly}
                      />
                      <Label
                        htmlFor="showChartUnhappyOnly"
                        className="text-xs text-muted-foreground"
                      >
                        Show Errors Only
                      </Label>
                    </div>
                  </div>
                </div>
                <div className="h-[120px] w-full">
                  <Chart
                    type="bar"
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

            <div className="px-1 py-4 border-t border-b ">
              <div className="flex items-center justify-between gap-4 items-center">
                <div className="flex items-center justify-between gap-5">
                  <div className="sm:col-span-1">
                    <Label
                      htmlFor="healthStatusFilter"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Filter by Health Status
                    </Label>
                    <Select
                      value={selectedHealthStatus}
                      onValueChange={setSelectedHealthStatus}
                    >
                      <SelectTrigger
                        id="healthStatusFilter"
                        className="h-7 mt-1"
                      >
                        <SelectValue placeholder="Select health status" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueHealthStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status === "all" ? "All Health Statuses" : status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-1">
                    <Label
                      htmlFor="logTimeFilter"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Filter Logs by Time
                    </Label>
                    <Select
                      value={logTimeFilter}
                      onValueChange={(value) => {
                        console.log("value changed for logtimefilter ", value);
                        setLogTimeFilter(value as LogTimeFilterType);
                        console.log("log time filter ", logTimeFilter);
                      }}
                      disabled={!!fromDate || !!toDate}
                    >
                      <SelectTrigger id="logTimeFilter" className="h-7 mt-1">
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
                      <Label
                        htmlFor="fromDate"
                        className="text-xs font-medium text-muted-foreground"
                      >
                        From
                      </Label>
                      <Input
                        id="fromDate"
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="h-7 mt-1"
                        max={maxDate}
                      min={minDate}
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="toDate"
                        className="text-xs font-medium text-muted-foreground"
                      >
                        To
                      </Label>
                      <Input
                        id="toDate"
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="h-7 mt-1"
                        max={maxDate}
                      min={minDate}
                      />
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-22 p-2 ml-1 bg-gray-200 text-xs "
                      onClick={resetFilters}
                    >
                      Reset Filters
                    </Button>
                  </div>
                </div>

                <div className="flex items-center mr-4 space-x-2 justify-end sm:col-span-1">
                  <Switch
                    id="showErrorsOnly"
                    checked={showErrorsOnly}
                    onCheckedChange={setShowErrorsOnly}
                  />
                  <Label
                    htmlFor="showErrorsOnly"
                    className="text-xs text-muted-foreground"
                  >
                    Show Errors Only
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              {getPaginatedLogs().logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No monitoring logs found
                </div>
              ) : (
                getPaginatedLogs().logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-sm"
                  >
                    <div className="flex flex-wrap items-center gap-x-10 gap-y-1">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">Time:</span>
                        <span className="text-muted-foreground">
                          {new Date(log.checked_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="text-muted-foreground hidden md:inline">
                          -{" "}
                          {new Date(log.checked_at).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 whitespace-nowrap">
                        {getHealthStatusIcon(log.health_status)}
                        <span className="font-medium">Health Status:</span>
                        <span
                          className={cn(
                            log.health_status.toLowerCase() === "healthy"
                              ? "text-emerald-600"
                              : log.health_status.toLowerCase() === "degraded"
                              ? "text-yellow-600"
                              : log.health_status.toLowerCase() === "offline"
                              ? "text-red-600"
                              : "text-gray-600"
                          )}
                        >
                          {log.health_status}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">CPU:</span>
                        <span className="text-muted-foreground font-mono">
                          {log.cpu_percent || 0}%
                        </span>
                      </div>

                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">Memory:</span>
                        <span className="text-muted-foreground font-mono">
                          {log.memory_percent || 0}%
                        </span>
                      </div>

                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">Disk:</span>
                        <span className="text-muted-foreground font-mono">
                          {log.disk_percent || 0}%
                        </span>
                      </div>

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
                  Total: {getPaginatedLogs().totalCount} logs
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1 || getPaginatedLogs().totalCount === 0}
                    className="gap-1 h-9"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    <span className="text-sm">
                      Page {getPaginatedLogs().totalCount === 0 ? 0 : currentPage} of{" "}
                      {getPaginatedLogs().totalPages} 
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={
                      currentPage >= getPaginatedLogs().totalPages || getPaginatedLogs().totalCount === 0
                    }
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
