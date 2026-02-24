import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Plus } from "lucide-react";
import InternalPageLayout from "~/layout/InternalPageLayout";
import GoalPreview, { type GoalPreviewProps, getGoalStatus } from "./GoalPreview";
import type { Action } from "../actions/ActionsListPage";
import { useApi } from "~/api/useApi";
import { GET_GOALS } from "~/api/queries";
import { parseDateOnly } from "~/utils/dateUtils";
import ListFilters from "~/components/ui/list-filters";



function getFirstTbdProject(projects: GoalPreviewProps["projects"]): GoalPreviewProps["firstTbdProject"] | undefined {
  return [...projects]
    .filter((p) => p.startDate && p.endDate && !p.done)
    .sort((a, b) => +a.startDate! - +b.startDate!)[0];
}

export default function GoalsListPage() {
  const [goals, setGoals] = useState<GoalPreviewProps[] | null>(null);
  const [showLinksFilters, setShowLinksFilters] = useState(false);
  const [showStatusFilters, setShowStatusFilters] = useState(false);
  const [linkFilters, setLinkFilters] = useState({
    groupGoal: true,
    individualGoal: true,
  });
  const [statusFilters, setStatusFilters] = useState({
    backlog: true,
    tbd: true,
    inProgress: true,
    ignored: true,
    done: true,
  });
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

  const allLinksSelected = linkFilters.groupGoal && linkFilters.individualGoal;
  const allStatusesSelected =
    statusFilters.backlog &&
    statusFilters.tbd &&
    statusFilters.inProgress &&
    statusFilters.ignored &&
    statusFilters.done;

  const linksLabel = allLinksSelected
    ? "All"
    : [
        linkFilters.groupGoal ? "Group Goal" : null,
        linkFilters.individualGoal ? "Individual Goal" : null,
      ]
        .filter(Boolean)
        .join(", ") || "None";

  const statusLabel = allStatusesSelected
    ? "All"
    : [
        statusFilters.backlog ? "Backlog" : null,
        statusFilters.tbd ? "TBD" : null,
        statusFilters.inProgress ? "In Progress" : null,
        statusFilters.ignored ? "Ignored" : null,
        statusFilters.done ? "Done" : null,
      ]
        .filter(Boolean)
        .join(", ") || "None";

  const matchesLinkFilter = (g: GoalPreviewProps) => {
    const isGroupGoal = g.isGoalGroup === true;
    const isIndividualGoal = g.isGoalGroup === false;
    const isNone = g.isGoalGroup == null;
    if (!linkFilters.groupGoal && !linkFilters.individualGoal) return isNone;
    if (linkFilters.groupGoal && linkFilters.individualGoal) return true;
    return (isGroupGoal && linkFilters.groupGoal) || (isIndividualGoal && linkFilters.individualGoal);
  };

  const matchesStatusFilter = (status: string) => {
    switch (status) {
      case "Backlog":
        return statusFilters.backlog;
      case "TBD":
        return statusFilters.tbd;
      case "In Progress":
        return statusFilters.inProgress;
      case "Ignored":
        return statusFilters.ignored;
      case "Done":
        return statusFilters.done;
      default:
        return false;
    }
  };

  const visibleGoals = goals.filter((g) => {
    const status = getGoalStatus(g);
    return matchesLinkFilter(g) && matchesStatusFilter(status);
  });

  const resetFilters = () => {
    setLinkFilters({ groupGoal: true, individualGoal: true });
    setStatusFilters({
      backlog: true,
      tbd: true,
      inProgress: true,
      ignored: true,
      done: true,
    });
    setShowLinksFilters(false);
    setShowStatusFilters(false);
  };

  const statusOptionDefs: [keyof typeof statusFilters, string][] = [
    ["backlog", "Backlog"],
    ["tbd", "TBD"],
    ["inProgress", "In Progress"],
    ["ignored", "Ignored"],
    ["done", "Done"],
  ];
  const linkOptions = [
    {
      id: "all",
      label: "All",
      active: allLinksSelected,
      onClick: () => setLinkFilters({ groupGoal: true, individualGoal: true }),
    },
    {
      id: "groupGoal",
      label: "Group Goal",
      active: linkFilters.groupGoal,
      onClick: () => setLinkFilters((prev) => ({ ...prev, groupGoal: !prev.groupGoal })),
    },
    {
      id: "individualGoal",
      label: "Individual Goal",
      active: linkFilters.individualGoal,
      onClick: () => setLinkFilters((prev) => ({ ...prev, individualGoal: !prev.individualGoal })),
    },
    {
      id: "none",
      label: "None",
      alwaysMuted: true,
      onClick: () => setLinkFilters({ groupGoal: false, individualGoal: false }),
    },
  ];
  const statusOptions = [
    {
      id: "all",
      label: "All",
      active: allStatusesSelected,
      onClick: () =>
        setStatusFilters({
          backlog: true,
          tbd: true,
          inProgress: true,
          ignored: true,
          done: true,
        }),
    },
    ...statusOptionDefs.map(([key, label]) => ({
      id: key,
      label,
      active: statusFilters[key],
      onClick: () =>
        setStatusFilters((prev) => {
          const selectedCount = Object.values(prev).filter(Boolean).length;
          return {
            ...prev,
            [key]: prev[key] && selectedCount === 1 ? true : !prev[key],
          };
        }),
    })),
  ];

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
        <ListFilters
          linksLabel={linksLabel}
          statusLabel={statusLabel}
          showLinksFilters={showLinksFilters}
          showStatusFilters={showStatusFilters}
          onToggleLinks={() => {
            setShowLinksFilters((v) => !v);
            setShowStatusFilters(false);
          }}
          onToggleStatus={() => {
            setShowStatusFilters((v) => !v);
            setShowLinksFilters(false);
          }}
          onReset={resetFilters}
          linkOptions={linkOptions}
          statusOptions={statusOptions}
        />

        <div className="space-y-4">
          {visibleGoals.length === 0 && (
            <p className="text-sm text-muted-foreground">No goals match current filters.</p>
          )}
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
