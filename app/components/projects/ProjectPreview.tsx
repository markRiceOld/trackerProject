import { useNavigate } from "react-router";
import { Progress } from "~/components/ui/progress";
import { Badge } from "~/components/ui/badge";
import { format, isBefore, isAfter } from "date-fns";
import { Button } from "~/components/ui/button";
import ActionPreview from "../actions/ActionPreview";

export interface Project {
  title: string;
  dod?: string;
  startDate?: Date;
  endDate?: Date;
  actions: { id: string; title: string; done: boolean; tbd?: Date }[];
  id: string;
}

export interface ProjectPreviewProps extends Project {
  showControls?: boolean;
  onManage?: (id: string) => void;
  onDelete?: (id: string) => void;
  firstTbdAction?: {
    id: string;
    title: string;
    done?: boolean;
    tbd?: Date;
  };
}

export function getProjectStatus(props: ProjectPreviewProps): string {
  const { dod, startDate, endDate, actions } = props;
  const allChecked = actions.length > 0 && actions.every((a) => a.done);
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

export default function ProjectPreview(props: ProjectPreviewProps) {
  const navigate = useNavigate();

  const {
    title,
    startDate,
    endDate,
    actions,
    showControls,
    onManage,
    onDelete,
    firstTbdAction,
    id,
  } = props;

  const status = getProjectStatus(props);
  const doneCount = actions.filter((a) => a.done).length;
  const statusColor = getStatusColor(status);

  const handleManage = () => {
    navigate(`/activities/project/${id}`);
    if (onManage) onManage(id);
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Are you sure you want to delete this project?");
    if (!confirmed) return;

    try {
      await fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            mutation DeleteProject($id: ID!) {
              deleteProject(id: $id) {
                id
              }
            }
          `,
          variables: { id },
        }),
      });

      if (onDelete) onDelete(id);
    } catch (err) {
      console.error("Failed to delete project", err);
    }
  };

  return (
    <div className="border rounded-md p-4 shadow-sm space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm line-clamp-1">{title}</h2>
        <Badge className={statusColor}>{status}</Badge>
      </div>

      <div className="text-xs text-muted-foreground">{actions.length} actions</div>

      {status === "TBD" && startDate && (
        <div className="text-xs text-muted-foreground">
          Starts on {format(startDate, "MMM d, yyyy")}
        </div>
      )}

      {status === "In Progress" && endDate && (
        <div className="space-y-1">
          <Progress value={(doneCount / actions.length) * 100} />
          <div className="text-xs text-muted-foreground">
            Ends on {format(endDate, "MMM d, yyyy")}
          </div>
        </div>
      )}

      {status === "Ignored" && (
        <Progress value={(doneCount / actions.length) * 100} />
      )}

      {firstTbdAction && (
        <div className="pt-2">
          <ActionPreview action={firstTbdAction} />
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
