import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/activities", "routes/activities/index.tsx"),
  route("/insights", "routes/insights/index.tsx"),
  route("/settings", "routes/settings/index.tsx"),
  route("/calendar", "routes/calendar.tsx"),
  route("/today", "routes/today.tsx"),
  route("/activities/actions", "routes/activities/actions/index.tsx"),
  route("/activities/action/:id?", "routes/activities/actions/form.tsx"),
  route("/activities/projects", "routes/activities/projects/index.tsx"),
  route("/activities/project/:id?", "routes/activities/projects/form.tsx"),
  route("/activities/goals", "routes/activities/goals/index.tsx"),
  route("/activities/goal", "routes/activities/goals/form.tsx"),
  route("/activities/goal/:id", "routes/activities/goals/manage.tsx"),
] satisfies RouteConfig;
