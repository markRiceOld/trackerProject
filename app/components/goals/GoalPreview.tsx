import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Badge } from "~/components/ui/badge";
import { isBefore, isAfter } from "date-fns";
import { Settings } from "lucide-react";
import { Button } from "~/components/ui/button";

export interface Goal {
  id: string;
  title: string;
  dod?: string;
  isGoalGroup?: boolean;
  startDate?: Date;
  endDate?: Date;
  projects: { id: string; title: string; startDate?: Date; endDate?: Date; done: boolean }[];
  milestones?: { id: string; title: string }[];
}

export interface GoalPreviewProps extends Goal {
  showControls?: boolean;
  onManage?: (id: string) => void;
  onDelete?: (id: string) => void;
  firstTbdProject?: {
    id: string;
    title: string;
    done?: boolean;
    tbd?: Date;
  };
}

/** A project counts as "done" for goal/milestone status only when it has dates and all actions done (i.e. not Backlog). */
export function isProjectDoneForGoal(project: { done?: boolean; startDate?: Date | null; endDate?: Date | null }): boolean {
  return Boolean(project.done && project.startDate && project.endDate);
}

export function getGoalStatus(props: GoalPreviewProps): string {
  const { dod, startDate, endDate, projects } = props;
  const allDone = projects.length > 0 && projects.every((p) => isProjectDoneForGoal(p));
  const now = new Date();

  if (allDone) return "Done";
  if (!dod || !startDate || !endDate) return "Backlog";
  if (isBefore(endDate, now)) return "Ignored";
  if (isAfter(startDate, now)) return "TBD";
  return "In Progress";
}

function getStatusColor(status: string): string {
  switch (status) {
    case "Backlog":
      return "bg-gray-100 text-gray-800";
    case "TBD":
      return "bg-purple-100 text-purple-800";
    case "In Progress":
      return "bg-blue-100 text-blue-800";
    case "Ignored":
      return "bg-yellow-100 text-yellow-800";
    case "Done":
      return "bg-green-100 text-green-800";
    default:
      return "";
  }
}

/** Project that is currently in progress (startDate <= now <= endDate, not done). */
function getCurrentProject(
  projects: GoalPreviewProps["projects"]
): { id: string; title: string } | undefined {
  const now = new Date();
  return projects.find(
    (p) =>
      p.startDate &&
      p.endDate &&
      !isProjectDoneForGoal(p) &&
      !isBefore(now, p.startDate) &&
      !isAfter(now, p.endDate)
  );
}

export default function GoalPreview(props: GoalPreviewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    title,
    projects,
    milestones,
    showControls,
    onManage,
    firstTbdProject,
    id,
    isGoalGroup,
  } = props;

  const statusRaw = getGoalStatus(props);
  const statusColor = getStatusColor(statusRaw);
  const statusKey = statusRaw === "Done" ? "statusDone" : statusRaw === "In Progress" ? "statusInProgress" : statusRaw === "Backlog" ? "statusBacklog" : statusRaw === "TBD" ? "statusTbd" : "statusIgnored";
  const status = t(`goalManage.${statusKey}`);
  const currentProject = getCurrentProject(projects);
  const nextProject = firstTbdProject;
  const nextMilestone = milestones?.length ? milestones[0] : undefined;

  const handleManage = () => {
    if (onManage) return onManage(id);
    navigate(`/activities/goal/${id}`);
  };

  const currentOrNextLine =
    currentProject
      ? t("goalsList.current", { title: currentProject.title })
      : nextProject
        ? t("goalsList.next", { title: nextProject.title })
        : nextMilestone
          ? t("goalsList.nextMilestone", { title: nextMilestone.title })
          : null;

  return (
    <div className="border rounded-md p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="font-semibold text-sm line-clamp-1">{title}</h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {isGoalGroup && (
              <Badge variant="secondary" className="text-xs">{t("goalsList.goalGroup")}</Badge>
            )}
            {!isGoalGroup && <Badge className={statusColor}>{status}</Badge>}
            {!isGoalGroup && currentOrNextLine && (
              <span className="truncate">{currentOrNextLine}</span>
            )}
          </div>
        </div>
        {showControls && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleManage}
            aria-label={t("goalManage.manage")}
            className="shrink-0"
          >
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
