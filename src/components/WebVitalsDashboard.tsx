import React, { useEffect } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import Loader from "../components/ui/Loader";
import { useWebVitalsStore } from "@/store/useWebVitalsStore";

type WebVital = {
    measured_at: string;
    lcp_ms: number | null;
    fid_ms: number | null;
    cls: number | null;
    fcp_ms: number | null;
    ttfb_ms: number | null;
    tti_ms: number | null;
    inp_ms: number | null;
    device_type: string | null;
};


const DEVICE_TYPES = [
    { label: "Mobile", value: "mobile" },
    { label: "Desktop", value: "desktop" },
];

const METRICS = [
    {
        key: "lcp_ms",
        label: "Largest Contentful Paint (LCP)",
        unit: "ms",
        thresholds: [2500, 4000],
        legend: [0, 2500, 4000, 6000],
    },
    {
        key: "fid_ms",
        label: "First Input Delay (FID)",
        unit: "ms",
        thresholds: [100, 300],
        legend: [0, 100, 300, 600],
    },
    {
        key: "cls",
        label: "Cumulative Layout Shift (CLS)",
        unit: "",
        thresholds: [0.1, 0.25],
        legend: [0, 0.1, 0.25, 0.5],
    },
    {
        key: "fcp_ms",
        label: "First Contentful Paint (FCP)",
        unit: "ms",
        thresholds: [1800, 3000],
        legend: [0, 1800, 3000, 6000],
    },
    {
        key: "ttfb_ms",
        label: "Time to First Byte (TTFB)",
        unit: "ms",
        thresholds: [800, 1800],
        legend: [0, 800, 1800, 4000],
    },
    {
        key: "tti_ms",
        label: "Time to Interactive (TTI)",
        unit: "ms",
        thresholds: [3800, 7300],
        legend: [0, 3800, 7300, 10000],
    },
    {
        key: "inp_ms",
        label: "Interaction to Next Paint (INP)",
        unit: "ms",
        thresholds: [200, 500],
        legend: [0, 200, 500, 1000],
    },
];


function getLabel(metric: string, value: number | null) {
    if (value === null || value === undefined) return "No data";
    if (metric === "cls") return value.toFixed(3);
    return `${value} ms`;
}

function getStatus(metric: string, value: number | null) {
    if (value === null || value === undefined) return "No data";
    const m = METRICS.find((m) => m.key === metric);
    if (!m) return "";
    if (value <= m.thresholds[0]) return "Good";
    if (value <= m.thresholds[1]) return "Concerning";
    return "Poor";
}

function getCircleColor(metric: string, value: number | null) {
    if (value === null || value === undefined) return "#d1d5db"; // gray-300
    const m = METRICS.find((m) => m.key === metric);
    if (!m) return "#d1d5db";
    if (value <= m.thresholds[0]) return "#22c55e"; // green-500
    if (value <= m.thresholds[1]) return "#f59e42"; // orange-400
    return "#ef4444"; // red-500
}

function getCirclePercent(metric: string, value: number | null) {
    const m = METRICS.find((m) => m.key === metric);
    if (!m || value === null || value === undefined) return 0;
    const max = m.key === "cls" ? 0.5 : m.legend[m.legend.length - 1];
    return Math.min((value / max) * 100, 100);
}

const WebVitalsDashboard: React.FC = () => {
    const {
        websites,
        selectedWebsite,
        webVitals,
        loading,
        deviceType,
        websitesLoading,
        fetchWebsites,
        setSelectedWebsite,
        setDeviceType,
        clearCache
    } = useWebVitalsStore();

    useEffect(() => {
        fetchWebsites();
        // Clear cache when component unmounts
        return () => {
            clearCache();
        };
    }, []);

    // Export to CSV logic
    const exportToCSV = () => {
        if (!webVitals.length) return;
        const headers = Object.keys(webVitals[0]);
        const rows = webVitals.map(row =>
            headers.map(h => row[h as keyof WebVital]).join(",")
        );
        const csvContent = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `web_vitals_${selectedWebsite || 'export'}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Get the latest record for the selected device type
    const latest = webVitals.length > 0 ? webVitals[webVitals.length - 1] : null;

    // Split metrics for two rows
    const firstRow = METRICS.slice(0, 4);
    const secondRow = METRICS.slice(4);

    return (
        <Card>
            <CardHeader className="">
                <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                        <CardTitle>Web Vitals Dashboard</CardTitle>
                        <CardDescription>
                            Monitor all core web vitals for your active websites in real time.
                        </CardDescription>
                    </div>
                    <div className="flex gap-4 items-center flex-wrap">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium">Website</label>
                            <Select
                                value={selectedWebsite}
                                onValueChange={(val) => {
                                    console.log('Website selection changed in UI:', val);
                                    setSelectedWebsite(val);
                                }}
                                disabled={loading || websitesLoading}
                            >
                                <SelectTrigger className="w-52">
                                    <SelectValue>
                                        {websites.find((w) => w.id === selectedWebsite)?.website_name || ""}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {websites.map((w) => (
                                        <SelectItem key={w.id} value={w.id}>
                                            {w.website_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium">Device</label>
                            <div className="flex bg-muted rounded-md p-1 gap-1">
                                {DEVICE_TYPES.map((dt) => (
                                    <button
                                        key={dt.value}
                                        className={`px-4 py-1 rounded-md text-sm font-medium transition-colors ${deviceType === dt.value
                                            ? "bg-primary text-white shadow"
                                            : "hover:bg-accent text-muted-foreground"
                                            }`}
                                        onClick={() => {
                                            console.log('Device type changed in UI:', dt.value);
                                            setDeviceType(dt.value);
                                        }}
                                        disabled={loading}
                                        type="button"
                                    >
                                        {dt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="gap-2 mt-6"
                            onClick={exportToCSV}
                            disabled={!webVitals.length}
                        >
                            <Download className="h-4 w-4" />
                            Export Data
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="h-[500px] flex flex-col justify-center relative">
                {(loading || websitesLoading) ? (
                    <div className="absolute inset-0 z-10 bg-white/70 flex items-center justify-center">
                        <Loader text={websitesLoading ? "Loading websites..." : "Loading metrics..."} />
                    </div>
                ) : !latest || !selectedWebsite ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        No data available for selected website, device, and time window.
                    </div>
                ) : (
                    <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto">
                        <div className="flex flex-wrap gap-6 justify-center items-stretch w-full">
                            {firstRow.map((metric) => {
                                // @ts-ignore
                                const value = latest?.[metric.key] ?? null;
                                const percent = getCirclePercent(metric.key, value);
                                const color = getCircleColor(metric.key, value);
                                const size = 110;
                                const stroke = 10;
                                const radius = (size - stroke) / 2;
                                const circumference = 2 * Math.PI * radius;
                                const offset = circumference * (1 - percent / 100);

                                return (
                                    <div
                                        key={metric.key}
                                        className="flex flex-col items-center justify-center bg-white rounded-xl shadow p-4 min-w-[140px] flex-1"
                                        style={{ minWidth: 140, maxWidth: 180 }}
                                    >
                                        <div className="relative" style={{ width: size, height: size }}>
                                            <svg width={size} height={size}>
                                                <circle
                                                    cx={size / 2}
                                                    cy={size / 2}
                                                    r={radius}
                                                    stroke="#e5e7eb"
                                                    strokeWidth={stroke}
                                                    fill="none"
                                                />
                                                <circle
                                                    cx={size / 2}
                                                    cy={size / 2}
                                                    r={radius}
                                                    stroke={color}
                                                    strokeWidth={stroke}
                                                    fill="none"
                                                    strokeDasharray={circumference}
                                                    strokeDashoffset={offset}
                                                    strokeLinecap="round"
                                                    style={{ transition: "stroke-dashoffset 0.5s, stroke 0.5s" }}
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="font-bold text-lg">
                                                    {getLabel(metric.key, value)}
                                                </span>
                                                <span className="text-xs font-semibold" style={{ color }}>
                                                    {getStatus(metric.key, value)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-2 text-center text-sm font-medium text-gray-700">
                                            {metric.label}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex flex-wrap gap-6 justify-center items-stretch w-full rounded-xl py-6 ">
                            {secondRow.map((metric) => {
                                // @ts-ignore
                                const value = latest?.[metric.key] ?? null;
                                const percent = getCirclePercent(metric.key, value);
                                const color = getCircleColor(metric.key, value);
                                const size = 110;
                                const stroke = 10;
                                const radius = (size - stroke) / 2;
                                const circumference = 2 * Math.PI * radius;
                                const offset = circumference * (1 - percent / 100);

                                return (
                                    <div
                                        key={metric.key}
                                        className="flex flex-col items-center justify-center bg-white rounded-xl shadow p-4 min-w-[140px] flex-1"
                                        style={{ minWidth: 140, maxWidth: 180 }}
                                    >
                                        <div className="relative" style={{ width: size, height: size }}>
                                            <svg width={size} height={size}>
                                                <circle
                                                    cx={size / 2}
                                                    cy={size / 2}
                                                    r={radius}
                                                    stroke="#e5e7eb"
                                                    strokeWidth={stroke}
                                                    fill="none"
                                                />
                                                <circle
                                                    cx={size / 2}
                                                    cy={size / 2}
                                                    r={radius}
                                                    stroke={color}
                                                    strokeWidth={stroke}
                                                    fill="none"
                                                    strokeDasharray={circumference}
                                                    strokeDashoffset={offset}
                                                    strokeLinecap="round"
                                                    style={{ transition: "stroke-dashoffset 0.5s, stroke 0.5s" }}
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="font-bold text-lg">
                                                    {getLabel(metric.key, value)}
                                                </span>
                                                <span className="text-xs font-semibold" style={{ color }}>
                                                    {getStatus(metric.key, value)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-2 text-center text-sm font-medium text-gray-700">
                                            {metric.label}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default WebVitalsDashboard;