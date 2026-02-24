import ActivitiesPage from "./components/activities/ActivitiesPage";
import CalendarPage from "./components/calendar/CalendarPage";
import ToolsPage from "./components/tools/ToolsPage";
import ToolsHomePage from "./components/tools/ToolsHomePage";
import SettingsPage from "./components/settings/SettingsPage";
import TodayPage from "./components/today/TodayPage";
import ActionsListPage from "./components/actions/ActionsListPage";
import ActionForm from "./components/actions/ActionForm";
import ProjectsListPage from "./components/projects/ProjectsListPage";
import ProjectForm from "./components/projects/ProjectForm";
import GoalsListPage from "./components/goals/GoalsListPage";
import GoalForm from "./components/goals/GoalForm";
import ManageGoalPage from "./components/goals/ManageGoal";
import MilestoneForm from "./components/milestones/MilestoneForm";
import IntervalsListPage from "./components/intervals/IntervalsListPage";
import IntervalForm from "./components/intervals/IntervalForm";
import { Navigate } from "react-router";

export default [
  {
    index: true,
    element: <Navigate to="/today" replace />,
  },
  {
    path: "/activities",
    element: <ActivitiesPage />,
  },
  {
    path: "/tools",
    element: <ToolsHomePage />,
  },
  {
    path: "/tools/time-map",
    element: <ToolsPage />,
  },
  {
    path: "/settings",
    element: <SettingsPage />,
  },
  {
    path: "/calendar",
    element: <CalendarPage />,
  },
  {
    path: "/today",
    element: <TodayPage />,
  },
  {
    path: "/activities/actions",
    element: <ActionsListPage />,
  },
  {
    path: "/activities/action/:id?",
    element: <ActionForm />,
  },
  {
    path: "/activities/projects",
    element: <ProjectsListPage />,
  },
  {
    path: "/activities/project/:id?",
    element: <ProjectForm />,
  },
  {
    path: "/activities/intervals",
    element: <IntervalsListPage />,
  },
  {
    path: "/activities/interval/:id?",
    element: <IntervalForm mode="interval" />,
  },
  {
    path: "/activities/routine/:id?",
    element: <IntervalForm mode="routine" />,
  },
  {
    path: "/activities/goals",
    element: <GoalsListPage />,
  },
  {
    path: "/activities/goal",
    element: <GoalForm />,
  },
  {
    path: "/activities/goal/:id",
    element: <ManageGoalPage />,
  },
  {
    path: "/activities/goal/:goalId/milestone/:milestoneId?",
    element: <MilestoneForm />,
  },
]
