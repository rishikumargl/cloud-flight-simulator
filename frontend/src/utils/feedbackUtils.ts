export function calculateDuration(startedAt?: string, completedAt?: string): number | null {
  if (!startedAt || !completedAt) return null;
  try {
    const start = new Date(startedAt).getTime();
    const end = new Date(completedAt).getTime();
    if (isNaN(start) || isNaN(end)) return null;
    return Math.round((end - start) / 60000);
  } catch {
    return null;
  }
}

export function calculateEfficiency(completedTime: number | null | undefined, expectedTime?: number): number | null {
  if (!completedTime || !expectedTime) return null;
  if (expectedTime === 0) return null;
  const efficiency = (expectedTime / completedTime) * 100;
  return Math.min(Math.max(efficiency, 0), 100);
}

export function formatDuration(minutes: number | null): string {
  if (minutes === null) return "—";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function getStatusMessage(status: "PASSED" | "PARTIAL" | "FAILED"): string {
  switch (status) {
    case "PASSED":
      return "You've completed this mission successfully.";
    case "PARTIAL":
      return "You've partially completed this mission.";
    case "FAILED":
      return "You haven't completed this mission yet.";
  }
}

export function getStatusColor(status: "PASSED" | "PARTIAL" | "FAILED"): {
  bg: string;
  border: string;
  text: string;
  icon: string;
} {
  switch (status) {
    case "PASSED":
      return {
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        text: "text-emerald-900",
        icon: "text-emerald-500",
      };
    case "PARTIAL":
      return {
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-900",
        icon: "text-amber-500",
      };
    case "FAILED":
      return {
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-900",
        icon: "text-red-500",
      };
  }
}
