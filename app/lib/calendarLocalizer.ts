import { format, parse, startOfWeek, getDay } from "date-fns";
import { dateFnsLocalizer } from "react-big-calendar";
import enUS from "date-fns/locale/en-US";

const locales = {
  en: enUS,
};

export const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});
