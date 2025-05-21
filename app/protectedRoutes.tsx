import ActivitiesPage from "./components/activities/ActivitiesPage";
import CalendarPage from "./components/calendar/CalendarPage";
import InsightsPage from "./components/insights/InsightsPage";
import SettingsPage from "./components/settings/SettingsPage";
import TodayPage from "./components/today/TodayPage";
import ActionsListPage from "./components/actions/ActionsListPage";
import ActionForm from "./components/actions/ActionForm";
import ProjectsListPage from "./components/projects/ProjectsListPage";
import ProjectForm from "./components/projects/ProjectForm";
import GoalsListPage from "./components/goals/GoalsListPage";
import GoalForm from "./components/goals/GoalForm";
import ManageGoalPage from "./components/goals/ManageGoal";
import { Welcome } from "./welcome/welcome";

export default [
  {
    path: "/",
    element: <Welcome />,
  },
  {
    path: "/activities",
    element: <ActivitiesPage />,
  },
  {
    path: "/insights",
    element: <InsightsPage />,
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
]
