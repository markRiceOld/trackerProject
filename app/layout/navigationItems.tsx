import {
  Calendar,
  FolderKanban,
  Settings,
  Sun,
  Wrench,
} from "lucide-react";

export const sidebarItems = [
  {
    id: "today",
    title: "Today",
    href: "/today",
    icon: <Sun className="h-4 w-4" />,
  },
  {
    id: "calendar",
    title: "Calendar",
    href: "/calendar",
    icon: <Calendar className="h-4 w-4" />,
  },
  {
    id: "tools",
    title: "Tools",
    href: "/tools",
    icon: <Wrench className="h-4 w-4" />,
  },
  {
    id: "activities",
    title: "Activities",
    href: "/activities",
    icon: <FolderKanban className="h-4 w-4" />,
  },
  {
    id: "settings",
    title: "Settings",
    href: "/settings",
    icon: <Settings className="h-4 w-4" />,
  },
];

export const bottomBarItems = [
  {
    id: "today",
    href: "/today",
    icon: <Sun className="h-5 w-5" />,
  },
  {
    id: "calendar",
    href: "/calendar",
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    id: "tools",
    href: "/tools",
    icon: <Wrench className="h-5 w-5" />,
  },
  {
    id: "activities",
    href: "/activities",
    icon: <FolderKanban className="h-5 w-5" />,
  },
  {
    id: "settings",
    href: "/settings",
    icon: <Settings className="h-5 w-5" />,
  },
];
