import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
    ? { to: returnGoalId ? `/activities/goal/${returnGoalId}` : `/activities/goal/${parentGoalId}`, label: `← ${t("goalManage.backToGoal")}` }
    : { to: "/activities/goals", label: `← ${t("goalManage.backToGoals")}` };

  return (
    <InternalPageLayout
      backLink={backTo}
      title={t("goalsList.newGoal")}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="goal-title" className="flex items-center gap-2">
            {t("goalsList.goalTitle")} <Pencil className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden />
          </Label>
          <Input
            id="goal-title"
            placeholder={t("goalsList.goalTitle")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="goal-dod" className="flex items-center gap-2">
            {t("goalsList.dodOptional")} <Pencil className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden />
          </Label>
          <Input
            id="goal-dod"
            placeholder={t("goalsList.dodOptional")}
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
            {t("goalsList.goalGroupLabel")}
          </Label>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit">{t("common.submit")}</Button>
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            {t("common.cancel")}
          </Button>
        </div>
      </form>
    </InternalPageLayout>
  );
}
