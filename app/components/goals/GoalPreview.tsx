import { useNavigate } from "react-router";
import { Progress } from "~/components/ui/progress";
import { Badge } from "~/components/ui/badge";
import { format, isBefore, isAfter } from "date-fns";
import { Button } from "~/components/ui/button";
import ProjectPreview from "../projects/ProjectPreview";

export interface Goal {
  title: string;
  dod?: string;
  startDate?: Date;
  endDate?: Date;
  projects: { id: string; title: string; startDate: Date; endDate?: Date; done: boolean; }[];
  id: string;
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

export function getGoalStatus(props: GoalPreviewProps): string {
  const { dod, startDate, endDate, projects } = props;
  const allChecked = projects.length > 0 && projects.every((a) => a.done);
  const now = new Date();

  if (allChecked) return "Done";
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

export default function GoalPreview(props: GoalPreviewProps) {
  const navigate = useNavigate();

  const {
    title,
    dod,
    startDate,
    endDate,
    projects,
    showControls,
    onManage,
    onDelete,
    firstTbdProject,
    id,
  } = props;

  const status = getGoalStatus(props);
  const doneCount = projects.filter((a) => a.done).length;
  const statusColor = getStatusColor(status);

  const handleManage = () => {
    if (onManage) return onManage(id);
    navigate(`/activities/goal/${id}`);
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Are you sure you want to delete this goal?");
    if (!confirmed) return;

    try {
      await fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            mutation DeleteGoal($id: ID!) {
              deleteGoal(id: $id) {
                id
              }
            }
          `,
          variables: { id },
        }),
      });

      if (onDelete) onDelete(id);
    } catch (err) {
      console.error("Failed to delete goal", err);
    }
  };

  return (
    <div className="border rounded-md p-4 shadow-sm space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm line-clamp-1">{title}</h2>
        <Badge className={statusColor}>{status}</Badge>
      </div>

      <div className="text-xs text-muted-foreground">{projects.length} projects</div>

      {status === "TBD" && startDate && (
        <div className="text-xs text-muted-foreground">
          Starts on {format(startDate, "MMM d, yyyy")}
        </div>
      )}

      {status === "In Progress" && endDate && (
        <div className="space-y-1">
          <Progress value={(doneCount / projects.length) * 100} />
          <div className="text-xs text-muted-foreground">
            Ends on {format(endDate, "MMM d, yyyy")}
          </div>
        </div>
      )}

      {status === "Ignored" && (
        <Progress value={(doneCount / projects.length) * 100} />
      )}

      {firstTbdProject && (
        <div className="pt-2">
          <ProjectPreview {...firstTbdProject} actions={[]} />
        </div>
      )}

      {showControls && (
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="ghost" size="sm" onClick={handleManage}>Manage</Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>Delete</Button>
        </div>
      )}
    </div>
  );
}
