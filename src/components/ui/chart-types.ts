// Placeholder for chart-types.ts
// Define necessary types here if they are custom to your project
// For now, we'll use basic types to resolve import errors.

export type AxisDomain = [number | string, number | string];

export interface ChartConfig {
  [key: string]: {
    label?: string;
    color?: string;
    icon?: React.ComponentType<{ className?: string }>;
  };
}

export interface ChartContext {
  config: ChartConfig;
}

export interface ChartContainerProps extends React.ComponentProps<"div"> {
  config: ChartConfig;
  children: React.ReactNode;
}

export interface ChartCrosshairProps {
  value: string;
  x: number;
  y: number;
  payload: any;
}

export interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; payload: any }>;
  label?: string;
  labelFormatter?: (label: string) => string;
  nameKey?: string;
  valueKey?: string;
  hideIndicator?: boolean;
  className?: string; // Added className here
}

export interface ChartLegendProps extends React.ComponentProps<"div"> {
  payload?: Array<{ value: string; color: string; payload: any }>;
  hideIcon?: boolean;
  nameKey?: string;
}