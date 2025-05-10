import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import ResponsiveNavigation from "~/layout/ResponsiveNavigation";
import { Calendar, NotebookText, Clock, BarChart2, FolderKanban, Settings } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}



export default function Home() {
  return (<>
  <Welcome />
  </>);
}
