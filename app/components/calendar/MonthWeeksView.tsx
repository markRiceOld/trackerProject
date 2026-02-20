import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addWeeks, isSameMonth } from "date-fns";
import type { CalendarItem } from "./calendarTypes";
import CalendarEvent from "./CalendarEvent";
import { Button } from "~/components/ui/button";

interface MonthWeeksViewProps {
  currentDate: Date;
  items: CalendarItem[];
  onNavigate: (date: Date) => void;
}

/** Get week blocks that touch the given month (weeks start Sunday). */
function getWeekBlocksInMonth(month: Date): { start: Date; end: Date }[] {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const blocks: { start: Date; end: Date }[] = [];
  let weekStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  while (weekStart.getTime() <= monthEnd.getTime()) {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
    blocks.push({ start: weekStart, end: weekEnd });
    weekStart = addWeeks(weekStart, 1);
  }
  return blocks;
}

function toDateKey(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function eventsOnDay(items: CalendarItem[], day: Date): CalendarItem[] {
  const key = toDateKey(day);
  return items.filter((e) => {
    const startKey = toDateKey(e.start);
    const endKey = toDateKey(e.end);
    return key >= startKey && key <= endKey;
  });
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function MonthWeeksView({ currentDate, items, onNavigate }: MonthWeeksViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const weekBlocks = getWeekBlocksInMonth(currentDate);

  const handlePrev = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() - 1);
    onNavigate(d);
  };
  const handleNext = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + 1);
    onNavigate(d);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrev}>
            ← Prev
          </Button>
          <span className="font-semibold text-lg">
            {format(monthStart, "MMMM yyyy")}
          </span>
          <Button variant="outline" size="sm" onClick={handleNext}>
            Next →
          </Button>
        </div>
      </div>
      <div className="space-y-6 overflow-auto flex-1">
        {weekBlocks.map((block, bi) => {
          const days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(block.start);
            d.setDate(d.getDate() + i);
            return d;
          });
          const weekLabel = `Week of ${format(block.start, "MMM d")}`;
          return (
            <div key={bi} className="border rounded-lg overflow-hidden bg-card">
              <div className="bg-muted/60 px-3 py-2 text-sm font-medium">
                {weekLabel}
              </div>
              <div className="grid grid-cols-7 min-w-0">
                {days.map((day) => {
                  const dayEvents = eventsOnDay(items, day);
                  const inMonth = isSameMonth(day, currentDate);
                  return (
                    <div
                      key={day.toISOString()}
                      className={`border-r border-border last:border-r-0 p-2 min-w-0 flex flex-col ${
                        inMonth ? "bg-background" : "bg-muted/30"
                      }`}
                    >
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        {DAY_LABELS[day.getDay()]} {format(day, "d")}
                      </div>
                      <ul className="space-y-1 overflow-auto min-h-0">
                        {dayEvents.slice(0, 6).map((ev) => (
                          <li key={ev.id} className="min-w-0">
                            <CalendarEvent event={ev} className="!text-xs !py-0.5 !px-1" />
                          </li>
                        ))}
                        {dayEvents.length > 6 && (
                          <li className="text-muted-foreground text-xs">+{dayEvents.length - 6}</li>
                        )}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
