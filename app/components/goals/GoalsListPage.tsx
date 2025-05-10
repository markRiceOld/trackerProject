import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { Plus } from "lucide-react";
import GoalPreview, { type GoalPreviewProps, getGoalStatus } from "./GoalPreview";
import type { Action } from "../actions/ActionsListPage";

export const GET_GOALS = `
  query GetGoals {
    goals {
      id
      title
      dod
      startDate
      endDate
      projects {
        id
        title
        startDate
        endDate
      }
    }
  }
`

function getFirstTbdProject(projects: GoalPreviewProps["projects"]): GoalPreviewProps["firstTbdProject"] | undefined {
  return [...projects]
    .filter((p) => p.startDate && p.endDate && !p.done)
    .sort((a, b) => +a.startDate! - +b.startDate!)[0];
}

export default function GoalsListPage() {
  const [goals, setGoals] = useState<GoalPreviewProps[] | null>(null);
  const [hideDone, setHideDone] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchGoals() {
      const res = await fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: GET_GOALS,
        }),
      });

      const json = await res.json();
      const data = json?.data?.goals ?? [];

      const parsed = data.map((goal: any) => ({
        ...goal,
        startDate: goal.startDate ? new Date(goal.startDate) : undefined,
        endDate: goal.endDate ? new Date(goal.endDate) : undefined,
        projects: goal.projects.map((p: any) => ({
          id: p.id,
          title: p.title,
          startDate: p.startDate ? new Date(p.startDate) : undefined,
          endDate: p.endDate ? new Date(p.endDate) : undefined,
          done: p.actions.every((a: Action) => a.done),
        })),
      }));

      setGoals(parsed);
    }

    fetchGoals();
  }, []);

  if (!goals) return <p className="p-6">Loading...</p>;

  const visibleGoals = hideDone
    ? goals.filter((g) => getGoalStatus(g) !== "Done")
    : goals;

  return (
    <main className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Goals</h1>
        <Button size="sm" onClick={() => navigate("/activities/goal")}>
          <Plus className="h-4 w-4 mr-2" /> Add Goal
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Label htmlFor="hide-done">Hide Done</Label>
        <Switch id="hide-done" checked={hideDone} onCheckedChange={setHideDone} />
      </div>

      <div className="space-y-4">
        {visibleGoals.map((goal, i) => (
          <GoalPreview
            key={goal.id ?? i}
            {...goal}
            showControls
            onDelete={(id) => setGoals((prev) => prev?.filter((g) => g.id !== id) ?? [])}
            firstTbdProject={getFirstTbdProject(goal.projects)}
          />
        ))}
      </div>
    </main>
  );
}
