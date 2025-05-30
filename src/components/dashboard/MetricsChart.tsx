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

  useEffect(() => {
    setZoomData(data);
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

  // Legend click handler
  const handleLegendClick = (e: any) => {
    const clickedKey = e.dataKey;
    setFocusedMetricKey((prev) => (prev === clickedKey ? null : clickedKey));
  };

  // custom legend renderer
  const renderCustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <div style={{ padding: '10px', fontSize: 12 }}>
        {payload.map((entry: any, index: number) => {
          const isActive = focusedMetricKey === entry.dataKey;
          return (
            <div
              key={`item-${index}`}
              onClick={() => {handleLegendClick(entry);console.log("clicked");}}
              style={{
                cursor: 'pointer',
                marginBottom: 6,
                padding: '4px 8px',
                borderRadius: '5px',
                backgroundColor: isActive ? '#e0f7fa' : 'transparent',
                fontWeight: isActive ? 'bold' : 'normal',
                color: entry.color,
              }}
            >
              {entry.value}
            </div>
          );
        })}
      </div>
    );
  };


  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={zoomOut}
              className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
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
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#888" opacity={0.2} />
            <XAxis
              dataKey="timestamp"
              allowDataOverflow={true}
              domain={['dataMin', 'dataMax']}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleTimeString();
              }}
              tick={{ fontSize: 11 }}
              style={{ fontSize: 11 }}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              style={{ fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(17, 25, 40, 0.8)",
                border: "none",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                color: "white"
              }}
              labelFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleString();
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
                paddingLeft: '10px'
              }}
              onClick={handleLegendClick}
              // content={renderCustomLegend}
            />
            {/* Conditional message on chart */}
            {focusedMetricKey && (
              <text
                x={600}
                y={10}
                fill="#333"
                fontSize={14}
                fontWeight="bold"
              >
                Showing data for: {
                  metrics.find(m => m.key === focusedMetricKey)?.name || focusedMetricKey
                }
              </text>
            )}
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
                fill="#888"
                fillOpacity={0.1}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
