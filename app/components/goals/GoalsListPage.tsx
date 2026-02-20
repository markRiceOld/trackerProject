import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { Plus } from "lucide-react";
import InternalPageLayout from "~/layout/InternalPageLayout";
import GoalPreview, { type GoalPreviewProps, getGoalStatus } from "./GoalPreview";
import type { Action } from "../actions/ActionsListPage";
import { useApi } from "~/api/useApi";
import { GET_GOALS } from "~/api/queries";
import { parseDateOnly } from "~/utils/dateUtils";



function getFirstTbdProject(projects: GoalPreviewProps["projects"]): GoalPreviewProps["firstTbdProject"] | undefined {
  return [...projects]
    .filter((p) => p.startDate && p.endDate && !p.done)
    .sort((a, b) => +a.startDate! - +b.startDate!)[0];
}

export default function GoalsListPage() {
  const [goals, setGoals] = useState<GoalPreviewProps[] | null>(null);
  const [hideDone, setHideDone] = useState(false);
  const navigate = useNavigate();
  const { call } = useApi(GET_GOALS);

  useEffect(() => {
    async function fetchGoals() {
      call().then(res => {
        const data = res?.goals ?? [];
  
        const parsed = data.map((goal: any) => ({
          ...goal,
          startDate: goal.startDate ? parseDateOnly(goal.startDate) : undefined,
          endDate: goal.endDate ? parseDateOnly(goal.endDate) : undefined,
          milestones: (goal.milestones ?? []).map((m: any) => ({ id: m.id, title: m.title })),
          projects: (goal.projects ?? []).map((p: any) => ({
            id: p.id,
            title: p.title,
            startDate: p.startDate ? parseDateOnly(p.startDate) : undefined,
            endDate: p.endDate ? parseDateOnly(p.endDate) : undefined,
            done: !p.actions ? false : p.actions.every((a: Action) => a.done),
          })),
        }));
  
        setGoals(parsed);
      })
    }

    fetchGoals();
  }, []);

  if (!goals) return <p className="p-6">Loading...</p>;

  const visibleGoals = hideDone
    ? goals.filter((g) => getGoalStatus(g) !== "Done")
    : goals;

  return (
    <InternalPageLayout
      backLink={{ to: "/activities", label: "← Back to Activities" }}
      title="Goals"
      actions={
        <Button size="sm" onClick={() => navigate("/activities/goal")}>
          <Plus className="h-4 w-4 mr-2" /> Add Goal
        </Button>
      }
    >
      <div className="space-y-6">
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
      </div>
    </InternalPageLayout>
  );
}
