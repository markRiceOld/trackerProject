import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import { Pencil } from "lucide-react";
import InternalPageLayout from "~/layout/InternalPageLayout";
import { useApi } from "~/api/useApi";
import { ADD_GOAL } from "~/api/queries";

export default function GoalForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const parentGoalId = searchParams.get("parentGoalId") ?? undefined;
  const parentMilestoneId = searchParams.get("parentMilestoneId") ?? undefined;
  const returnGoalId = searchParams.get("returnGoalId") ?? undefined;

  const [title, setTitle] = useState("");
  const [dod, setDod] = useState("");
  const [isGoalGroup, setIsGoalGroup] = useState(false);
  const { call } = useApi(ADD_GOAL);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const variables = {
      title,
      dod,
      isGoalGroup,
      ...(parentGoalId && { parentGoalId }),
      ...(parentMilestoneId && { parentMilestoneId }),
    };
    try {
      const res = await call({ variables });
      if (res?.addGoal) {
        if (returnGoalId) navigate(`/activities/goal/${returnGoalId}`);
        else if (parentGoalId) navigate(`/activities/goal/${parentGoalId}`);
        else navigate("/activities/goals");
      }
    } catch (err) {
      console.error("Failed to submit goal", err);
    }
  };

  const backTo = returnGoalId || parentGoalId
    ? { to: returnGoalId ? `/activities/goal/${returnGoalId}` : `/activities/goal/${parentGoalId}`, label: "← Back to Goal" }
    : { to: "/activities/goals", label: "← Back to Goals" };

  return (
    <InternalPageLayout
      backLink={backTo}
      title="New Goal"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="goal-title" className="flex items-center gap-2">
            Goal title <Pencil className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden />
          </Label>
          <Input
            id="goal-title"
            placeholder="Goal Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="goal-dod" className="flex items-center gap-2">
            Definition of Done (optional) <Pencil className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden />
          </Label>
          <Input
            id="goal-dod"
            placeholder="Definition of Done (optional)"
            value={dod}
            onChange={(e) => setDod(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isGoalGroup"
            checked={isGoalGroup}
            onCheckedChange={(v) => setIsGoalGroup(v === true)}
          />
          <Label htmlFor="isGoalGroup" className="text-sm font-normal cursor-pointer">
            Goal group (contains child goals and milestones with child goals; no projects directly)
          </Label>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit">Submit</Button>
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </InternalPageLayout>
  );
}
