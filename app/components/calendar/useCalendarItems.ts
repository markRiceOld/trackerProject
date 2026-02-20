import { useEffect, useState, useMemo } from "react";
import { addDays, addMonths, startOfMonth, endOfMonth, setHours, setMinutes, format } from "date-fns";
import { parseDateOnly } from "~/utils/dateUtils";
import { useApi } from "~/api/useApi";
import {
  GET_GOALS,
  GET_ACTIONS,
  GET_INTERVALS,
  GET_ROUTINES,
} from "~/api/queries";
import type { CalendarItem, CalendarFilters } from "./calendarTypes";

/** Default range: 3 months back, 6 months forward. */
function defaultRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: addMonths(startOfMonth(now), -3),
    end: addMonths(endOfMonth(now), 6),
  };
}

/** Add minutes to a date (same day). */
function addMinutesToDate(d: Date, minutes: number): Date {
  const out = new Date(d);
  out.setMinutes(out.getMinutes() + minutes);
  return out;
}

function toDateSafe(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export function useCalendarItems(
  dateRange: { start: Date; end: Date } | null,
  filters: CalendarFilters
) {
  const { call } = useApi();
  const [goalsRaw, setGoalsRaw] = useState<any[]>([]);
  const [actionsRaw, setActionsRaw] = useState<any[]>([]);
  const [intervalsRaw, setIntervalsRaw] = useState<any[]>([]);
  const [routinesRaw, setRoutinesRaw] = useState<any[]>([]);

  useEffect(() => {
    call({ query: GET_GOALS }).then((res) => setGoalsRaw(res?.goals ?? []));
    call({ query: GET_ACTIONS }).then((res) => setActionsRaw(res?.actions ?? []));
    call({ query: GET_INTERVALS }).then((res) => setIntervalsRaw(res?.intervals ?? []));
    call({ query: GET_ROUTINES }).then((res) => setRoutinesRaw(res?.routines ?? []));
  }, [call]);

  const range = dateRange ?? defaultRange();

  const items = useMemo(() => {
    const list: CalendarItem[] = [];
    const rangeStart = range.start.getTime();
    const rangeEnd = range.end.getTime();

    // —— Goals & milestones ——
    if (filters.goalsMilestones) {
      for (const g of goalsRaw) {
        const goalStart = g.startDate ? parseDateOnly(g.startDate) : null;
        const goalEnd = g.endDate ? parseDateOnly(g.endDate) : null;
        if (goalStart && goalEnd) {
          const start = goalStart.getTime();
          const end = goalEnd.getTime();
          if (start <= rangeEnd && end >= rangeStart) {
            list.push({
              id: `goal-${g.id}`,
              type: "goal",
              title: g.title ?? "Goal",
              start: goalStart,
              end: addDays(goalEnd, 1),
              entityId: g.id,
              allDay: true,
            });
          }
        }
        const milestones = g.milestones ?? [];
        for (const m of milestones) {
          const doa = m.doa ? parseDateOnly(m.doa) : null;
          const pred = m.predictionDate ? parseDateOnly(m.predictionDate) : null;
          const d = doa ?? pred;
          if (d) {
            const t = d.getTime();
            if (t >= rangeStart && t <= rangeEnd) {
              list.push({
                id: `milestone-${m.id}`,
                type: "milestone",
                title: m.title ?? "Milestone",
                start: d,
                end: addDays(d, 1),
                entityId: m.id,
                allDay: true,
              });
            }
          }
        }
      }
    }

    // —— Actions (tbd + optional startTimeOfDay + estimatedTimeMinutes) ——
    if (filters.actions) {
      for (const a of actionsRaw) {
        const tbd = a.tbd ? parseDateOnly(a.tbd) : null;
        if (!tbd) continue;
        const t = tbd.getTime();
        if (t < rangeStart || t > rangeEnd) continue;
        const estMin = a.estimatedTimeMinutes ?? 60;
        const timeStr = a.startTimeOfDay && /^\d{1,2}:\d{2}/.test(String(a.startTimeOfDay)) ? String(a.startTimeOfDay).trim().slice(0, 5) : null;
        const start = timeStr
          ? setMinutes(setHours(new Date(tbd), parseInt(timeStr.slice(0, 2), 10)), parseInt(timeStr.slice(3, 5), 10))
          : new Date(tbd.getFullYear(), tbd.getMonth(), tbd.getDate(), 9, 0);
        const end = addMinutesToDate(start, estMin);
        list.push({
          id: `action-${a.id}`,
          type: "action",
          title: a.title ?? "Action",
          start,
          end,
          entityId: a.id,
          allDay: !timeStr,
        });
      }
    }

    // —— Intervals (customRepeatDates only; recurrence expansion can be added later) ——
    if (filters.intervals) {
      for (const iv of intervalsRaw) {
        if (iv.status !== "active") continue;
        const customDates: string[] = iv.customRepeatDates ?? [];
        const endTime = toDateSafe(iv.endTime);
        const estMin = 60;
        for (const iso of customDates) {
          const d = toDateSafe(iso);
          if (!d) continue;
          const t = d.getTime();
          if (t < rangeStart || t > rangeEnd) continue;
          if (endTime && t > endTime.getTime()) continue;
          const end = addMinutesToDate(d, estMin);
          list.push({
            id: `interval-${iv.id}-${iso}`,
            type: "interval",
            title: iv.title ?? "Interval",
            start: d,
            end,
            entityId: iv.id,
          });
        }
      }
    }

    // —— Routines (timeOfDayBlocks × each day in range) ——
    if (filters.routines) {
      const blocks = (r: any): string[] => {
        const b = r.timeOfDayBlocks;
        if (Array.isArray(b) && b.length) return b.map(String);
        return [];
      };
      const estMin = (r: any) => r.estimatedTimeMinutes ?? 30;
      for (const r of routinesRaw) {
        if (r.status !== "active") continue;
        const times = blocks(r);
        if (!times.length) continue;
        const routineEnd = toDateSafe(r.endTime);
        let d = new Date(range.start);
        d.setHours(0, 0, 0, 0);
        while (d.getTime() <= rangeEnd) {
          if (routineEnd && d.getTime() > routineEnd.getTime()) break;
          const dateKey = format(d, "yyyy-MM-dd");
          for (const timeStr of times) {
            const [h, m] = timeStr.split(":").map((x: string) => parseInt(x, 10) || 0);
            const start = setMinutes(setHours(new Date(d), h), m);
            const end = addMinutesToDate(start, estMin(r));
            list.push({
              id: `routine-${r.id}-${dateKey}-${timeStr}`,
              type: "routine",
              title: r.title ?? "Routine",
              start,
              end,
              entityId: r.id,
            });
          }
          d = addDays(d, 1);
        }
      }
    }

    return list;
  }, [
    goalsRaw,
    actionsRaw,
    intervalsRaw,
    routinesRaw,
    range.start,
    range.end,
    filters.goalsMilestones,
    filters.actions,
    filters.intervals,
    filters.routines,
  ]);

  return { items, loading: false };
}
