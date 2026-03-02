import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";

export type TimeRange = "week" | "last_week" | "month" | "quarter";

interface DashboardContextType {
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const setTimeRangeStable = useCallback((range: TimeRange) => {
    setTimeRange(range);
  }, []);

  const value = useMemo(
    () => ({ timeRange, setTimeRange: setTimeRangeStable }),
    [timeRange, setTimeRangeStable]
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
