import { useState } from "react";
import TrackerCalendar from "./TrackerCalendar";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import type { CalendarFilters } from "./calendarTypes";
import { DEFAULT_CALENDAR_FILTERS } from "./calendarTypes";

export default function CalendarPage() {
  const [filters, setFilters] = useState<CalendarFilters>(DEFAULT_CALENDAR_FILTERS);

  const toggle = (key: keyof CalendarFilters) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <main className="flex flex-col h-full">
      <h1 className="text-2xl font-bold px-4 py-2 shrink-0">Calendar</h1>

      {/* Top: type filters — any combination of Goals/milestones, Actions, Intervals, Routines */}
      <div className="sticky top-0 z-10 px-4 py-2 flex flex-wrap items-center gap-4 shrink-0 border-b border-border/60 bg-background">
        <span className="text-sm font-medium text-muted-foreground">Show:</span>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={filters.goalsMilestones}
            onCheckedChange={() => toggle("goalsMilestones")}
            aria-label="Goals and milestones"
          />
          <Label className="text-sm cursor-pointer">Goals / Milestones</Label>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={filters.actions}
            onCheckedChange={() => toggle("actions")}
            aria-label="Actions"
          />
          <Label className="text-sm cursor-pointer">Actions</Label>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={filters.intervals}
            onCheckedChange={() => toggle("intervals")}
            aria-label="Intervals"
          />
          <Label className="text-sm cursor-pointer">Intervals</Label>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={filters.routines}
            onCheckedChange={() => toggle("routines")}
            aria-label="Routines"
          />
          <Label className="text-sm cursor-pointer">Routines</Label>
        </label>
      </div>

      <TrackerCalendar filters={filters} />
    </main>
  );
}
