
// Mock data for dashboard
export const mockStatusCards = [
  {
    id: "1",
    name: "Main Website",
    type: "website",
    status: "healthy",
    uptime: 99.99,
    responseTime: 235,
    lastCheck: "2 min ago",
    metrics: [
      { name: "Response Time", value: 235, max: 1000 },
      { name: "SSL Certificate", value: 60, max: 90 },
    ],
  },
  {
    id: "2",
    name: "API Server",
    type: "website",
    status: "warning",
    uptime: 98.5,
    responseTime: 850,
    lastCheck: "1 min ago",
    metrics: [
      { name: "Response Time", value: 850, max: 1000 },
      { name: "SSL Certificate", value: 30, max: 90 },
    ],
  },
  {
    id: "3",
    name: "Web Server 01",
    type: "server",
    status: "healthy",
    uptime: 99.8,
    lastCheck: "3 min ago",
    metrics: [
      { name: "CPU Usage", value: 35, max: 100 },
      { name: "Memory", value: 4.2, max: 8 },
      { name: "Disk", value: 120, max: 500 },
    ],
  },
  {
    id: "4",
    name: "Web Server 02",
    type: "server",
    status: "critical",
    uptime: 85.4,
    lastCheck: "5 min ago",
    metrics: [
      { name: "CPU Usage", value: 95, max: 100 },
      { name: "Memory", value: 7.8, max: 8 },
      { name: "Disk", value: 480, max: 500 },
    ],
  },
  {
    id: "5",
    name: "Production DB",
    type: "database",
    status: "healthy",
    uptime: 99.95,
    lastCheck: "1 min ago",
    metrics: [
      { name: "Connections", value: 45, max: 200 },
      { name: "Query Time", value: 15, max: 100 },
      { name: "Storage", value: 65, max: 100 },
    ],
  },
  {
    id: "6",
    name: "Backup Server",
    type: "server",
    status: "unknown",
    uptime: 0,
    lastCheck: "1 day ago",
  },
];

export const mockAlerts = [
  {
    id: "1",
    service: "Web Server 02",
    message: "High CPU usage detected (95%)",
    level: "critical" as const,
    time: "15 minutes ago",
    acknowledged: false,
  },
  {
    id: "2",
    service: "API Server",
    message: "Response time exceeded threshold (850ms)",
    level: "warning" as const,
    time: "35 minutes ago",
    acknowledged: true,
  },
  {
    id: "3",
    service: "Production DB",
    message: "Database backup completed successfully",
    level: "info" as const,
    time: "2 hours ago",
    acknowledged: true,
  },
  {
    id: "4",
    service: "Backup Server",
    message: "Server unreachable - connection timeout",
    level: "critical" as const,
    time: "1 day ago",
    acknowledged: false,
  },
];

export const mockPerformanceData = [
  { timestamp: "00:00", server1: 65, server2: 45, server3: 30 },
  { timestamp: "01:00", server1: 70, server2: 48, server3: 28 },
  { timestamp: "02:00", server1: 68, server2: 52, server3: 32 },
  { timestamp: "03:00", server1: 72, server2: 58, server3: 35 },
  { timestamp: "04:00", server1: 75, server2: 62, server3: 30 },
  { timestamp: "05:00", server1: 80, server2: 65, server3: 34 },
  { timestamp: "06:00", server1: 85, server2: 60, server3: 36 },
  { timestamp: "07:00", server1: 92, server2: 58, server3: 42 },
  { timestamp: "08:00", server1: 88, server2: 62, server3: 45 },
  { timestamp: "09:00", server1: 82, server2: 70, server3: 48 },
  { timestamp: "10:00", server1: 78, server2: 72, server3: 52 },
  { timestamp: "11:00", server1: 75, server2: 68, server3: 56 },
  { timestamp: "12:00", server1: 70, server2: 65, server3: 50 },
];

export const mockResponseTimeData = [
  { timestamp: "00:00", api: 320, web: 280, auth: 180 },
  { timestamp: "01:00", api: 350, web: 290, auth: 185 },
  { timestamp: "02:00", api: 380, web: 300, auth: 190 },
  { timestamp: "03:00", api: 400, web: 320, auth: 195 },
  { timestamp: "04:00", api: 450, web: 350, auth: 210 },
  { timestamp: "05:00", api: 500, web: 370, auth: 220 },
  { timestamp: "06:00", api: 520, web: 380, auth: 230 },
  { timestamp: "07:00", api: 550, web: 390, auth: 235 },
  { timestamp: "08:00", api: 600, web: 410, auth: 240 },
  { timestamp: "09:00", api: 650, web: 430, auth: 245 },
  { timestamp: "10:00", api: 700, web: 450, auth: 250 },
  { timestamp: "11:00", api: 750, web: 500, auth: 255 },
  { timestamp: "12:00", api: 850, web: 520, auth: 260 },
];
