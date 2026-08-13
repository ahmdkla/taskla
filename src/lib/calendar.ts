import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from "date-fns";

export function getMonthGrid(monthDate: Date) {
  const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end });
}

export const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
