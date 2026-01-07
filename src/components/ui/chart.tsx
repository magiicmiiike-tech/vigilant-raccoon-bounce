import * as React from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  Legend, // Import Legend
  TooltipProps, // Import TooltipProps
  LegendProps, // Import LegendProps
} from "recharts"
import {
  type AxisDomain,
  type ChartConfig,
  type ChartContainerProps,
  type ChartContext,
  type ChartCrosshairProps,
  type ChartLegendProps,
  type ChartTooltipProps,
} from "./chart-types" // Assuming chart-types defines these

import { cn } from "@/lib/utils"

// ... (rest of the file)

// CustomTooltipProps interface
interface CustomTooltipProps extends TooltipProps<any, any> { // Use any for ValueType, NameType if not specific
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; payload: any }>; // More specific payload type
  label?: string;
  labelFormatter?: (label: string) => string;
  nameKey?: string;
  valueKey?: string;
  hideIndicator?: boolean;
}

const CustomTooltip = ({
  active,
  payload,
  className,
  label,
  labelFormatter,
  nameKey,
  valueKey,
  hideIndicator = false,
}: CustomTooltipProps) => {
  if (!active || !payload?.length) return null

  const formattedLabel = labelFormatter ? labelFormatter(label!) : label

  return (
    <div
      className={cn(
        "grid min-w-[130px] gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs shadow-xl",
        className,
      )}
    >
      {formattedLabel ? (
        <div className="text-muted-foreground">{formattedLabel}</div>
      ) : null}
      <div className="grid gap-1.5">
        {payload.map((item: any, index: number) => { // Explicitly type item and index
          const key = `${nameKey || item.name || item.dataKey || "value"}`

          if (hideIndicator) {
            return (
              <div
                key={key}
                className="flex items-center justify-between gap-x-4"
              >
                <span className="text-muted-foreground">{item.name}</span>
                <span className="text-right font-medium text-foreground">
                  {item.value}
                </span>
              </div>
            )
          }

          return (
            <div
              key={key}
              className="flex items-center justify-between gap-x-4"
            >
              <div className="flex items-center gap-x-2">
                <div
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-muted-foreground">{item.name}</span>
              </div>
              <span className="text-right font-medium text-foreground">
                {item.value}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ChartLegendProps interface
interface ChartLegendProps extends React.ComponentProps<"div">, Pick<LegendProps, "verticalAlign"> {
  payload?: Array<{ value: string; color: string; payload: any }>; // More specific payload type
  hideIcon?: boolean;
  nameKey?: string;
}

const ChartLegend = ({
  payload,
  verticalAlign,
  hideIcon = false,
  nameKey,
  className,
  ...props
}: ChartLegendProps) => {
  if (!payload?.length) {
    return null
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-4",
        className,
      )}
      {...props}
    >
      {payload.map((item: any) => { // Explicitly type item
        const key = `${nameKey || item.dataKey || "value"}`

        return (
          <div
            key={key}
            className="flex items-center gap-x-2"
          >
            {!hideIcon && (
              <div
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
            )}
            <span className="text-muted-foreground">{item.value}</span>
          </div>
        )
      })}
    </div>
  )
}
// ... (rest of the file)