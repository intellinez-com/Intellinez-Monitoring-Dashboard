import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceArea
} from "recharts";
import Loader from "../ui/Loader";

interface DataPoint {
  timestamp: string;
  [key: string]: string | number;
}

interface MetricsChartProps {
  title: string;
  description?: string;
  data: DataPoint[];
  metrics: Array<{
    name: string;
    key: string;
    color: string;
  }>;
}

export function MetricsChart({ title, description, data, metrics }: MetricsChartProps) {
  const [refAreaLeft, setRefAreaLeft] = useState<string | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<string | null>(null);
  const [zoomData, setZoomData] = useState<DataPoint[]>(data);
  const [focusedMetricKey, setFocusedMetricKey] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setZoomData(data);
    setLoading(false);
  }, [data]);


  const zoom = () => {
    if (refAreaLeft === refAreaRight || !refAreaRight) {
      setRefAreaLeft(null);
      setRefAreaRight(null);
      return;
    }

    // Find the indices of the selected range
    const leftIndex = data.findIndex(item => item.timestamp === refAreaLeft);
    const rightIndex = data.findIndex(item => item.timestamp === refAreaRight);

    // Ensure left is less than right
    const start = Math.min(leftIndex, rightIndex);
    const end = Math.max(leftIndex, rightIndex);

    // Update the zoomed data
    setZoomData(data.slice(start, end + 1));
    setRefAreaLeft(null);
    setRefAreaRight(null);
  };

  const zoomOut = () => {
    setZoomData(data);
    setRefAreaLeft(null);
    setRefAreaRight(null);
  };

  // Handle mouse leave on chart to clear focus if it was set by hover
  const handleChartMouseLeave = () => {
    setFocusedMetricKey(null);
  };

  // Legend click handler
  const handleLegendClick = (e: any) => {
    const clickedKey = e.dataKey;
    setFocusedMetricKey((prev) => (prev === clickedKey ? null : clickedKey));
  };

  if (loading) {
    return (
      <Card className="bg-slate-800 text-white">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-white">{title}</CardTitle>
              {description && <CardDescription className="text-slate-400">{description}</CardDescription>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <Loader text="Loading data..." />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    // setTimeout(()=> setLoading(false),2000);
    return (
      <Card className="bg-slate-800 text-white">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-white">{title}</CardTitle>
              {description && <CardDescription className="text-slate-400">{description}</CardDescription>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <Loader text="Loading data..." />
          {/* <p className="text-muted-foreground">No data available</p> */}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 text-white">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-white">{title}</CardTitle>
            {description && <CardDescription className="text-slate-400">{description}</CardDescription>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={zoomOut}
              className="px-2 py-1 text-sm bg-slate-400 hover:bg-slate-700 text-white rounded"
            >
              Reset Zoom
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={zoomData}
            margin={{ top: 5, right: 20, left: 100, bottom: 5 }}
            onMouseDown={e => e && setRefAreaLeft(e.activeLabel)}
            onMouseMove={e => refAreaLeft && e && setRefAreaRight(e.activeLabel)}
            onMouseUp={zoom}
            onMouseLeave={handleChartMouseLeave}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#444" opacity={0.2} />
            <XAxis
              dataKey="timestamp"
              allowDataOverflow={true}
              domain={['dataMin', 'dataMax']}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleTimeString();
              }}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              stroke="#4b5563"
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              stroke="#4b5563"
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || payload.length === 0) return null;
                const hovered = payload[0];
                return (
                  <div className="bg-slate-400 text-white rounded px-3 py-2 shadow text-xs border border-slate-700">
                    <div className="font-semibold mb-1">{hovered.name}</div>
                    <div>
                      <span className="text-slate-400">Time:</span> {new Date(label).toLocaleTimeString()}
                    </div>
                    <div>
                      <span className="text-slate-400">Value:</span> {hovered.value}
                    </div>
                  </div>
                );
              }}
            />
            <Legend
              verticalAlign="middle"
              align="left"
              layout="vertical"
              wrapperStyle={{
                left: 0,
                top: 0,
                height: '100%',
                paddingLeft: '10px',
                color: '#fff',
                userSelect: 'none',
              }}
              onClick={handleLegendClick}
            />
            {focusedMetricKey && (
              <text
                x="65%"
                y={20}
                textAnchor="middle"
                fill="#9ca3af"
                fontSize={15}
                fontWeight="bold"
                className="select-none"
              >
                Showing data for: {
                  metrics.find(m => m.key === focusedMetricKey)?.name || focusedMetricKey
                }
              </text>
            )}
            {!metrics && 
              <span className="text-slate-400">No data</span>
            }
            {[...metrics]
              .sort((a, b) => a.key.localeCompare(b.key))
              .map((metric) => (
                <Line
                  key={metric.key}
                  type="monotone"
                  dataKey={metric.key}
                  name={metric.name}
                  stroke={metric.color}
                  dot={false}
                  strokeWidth={
                    !focusedMetricKey || focusedMetricKey === metric.key ? 2 : 1
                  }
                  strokeOpacity={
                    !focusedMetricKey || focusedMetricKey === metric.key ? 1 : 0.15
                  }
                  connectNulls={true}
                  animationDuration={1000}
                  animationBegin={0}
                  animationEasing="ease-in-out"
                />
              ))}
            {refAreaLeft && refAreaRight && (
              <ReferenceArea
                x1={refAreaLeft}
                x2={refAreaRight}
                strokeOpacity={0.3}
                fill="#475569"
                fillOpacity={0.2}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}