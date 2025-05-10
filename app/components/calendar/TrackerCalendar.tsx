import { Calendar, Views } from "react-big-calendar";
import { localizer } from "~/lib/calendarLocalizer";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useMemo } from "react";

const now = new Date();

const events = [
  {
    title: "Morning Habit",
    start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6),
    end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9),
  },
  {
    title: "Afternoon Action",
    start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13),
    end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15),
  },
];

const TrackerCalendar = () => {
  const defaultDate = useMemo(() => new Date(), []);

  return (
    <div className="h-[calc(100vh-6rem)] p-4">
      <Calendar
        localizer={localizer}
        defaultView={Views.MONTH}
        views={[Views.MONTH]}
        events={events}
        defaultDate={defaultDate}
        style={{ height: "100%" }}
        popup
      />
    </div>
  );
}

export default TrackerCalendar;
