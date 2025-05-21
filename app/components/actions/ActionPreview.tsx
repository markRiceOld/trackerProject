import { Checkbox } from "~/components/ui/checkbox";
import { Button } from "~/components/ui/button";
import { CalendarClock, Settings, Trash2 } from "lucide-react";
import type { Action } from "./ActionsListPage";
import { isToday, isBefore, isAfter, format } from "date-fns";
import { Badge } from "../ui/badge";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { useApi } from "~/api/useApi";
import { DELETE_ACTION, TOGGLE_ACTION } from "~/api/queries";

interface ActionPreviewProps {
  action: Action;
  onToggle?: (id: string, done: boolean) => void;
  onReschedule?: () => void;
  onDelete?: (id: string) => void;
}

export default function ActionPreview({
  onToggle,
  onReschedule,
  onDelete,
  action,
}: ActionPreviewProps) {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(action.done ?? false)
  const { call } = useApi();
  function getStatus(actionArg: Action): string {
    if (actionArg.done) return "Done";
    if (!actionArg.tbd) return "Backlog";
    if (isToday(+actionArg.tbd)) return "In Progress";
    if (isBefore(+actionArg.tbd, new Date())) return "Ignored";
    if (isAfter(+actionArg.tbd, new Date())) return "TBD";
    return "";
  }

  useEffect(() => {
    setChecked(action.done ?? false);
  }, [action.id]);

  function getStatusColor(statusArg: string): string {
    switch (statusArg) {
      case "Done":
        return "bg-green-100 text-green-800";
      case "Backlog":
        return "bg-gray-100 text-gray-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Ignored":
        return "bg-yellow-100 text-yellow-800";
      case "TBD":
        return "bg-purple-100 text-purple-800";
      default:
        return "";
    }
  }
  const status = getStatus(action);
  const statusColor = getStatusColor(status);

  const handleManage = () => {
    navigate(`/activities/action/${action.id}`);
  };

  const handleToggle = async () => {
    try {
      call({ query: TOGGLE_ACTION, variables: {
        id: action.id
      } }).then(() => {
        setChecked(prev => !prev)
    
        // Optional: trigger parent refetch
        onToggle?.(action.id ?? '', !!action.done);
      })
      // await fetch("http://localhost:4000/graphql", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     query: ,
      //     variables: {  },
      //   }),
      // });
    } catch (err) {
      console.error("Toggle failed", err);
    }
  };

  const handleDelete = async () => {
    try {
      call({
        query: DELETE_ACTION,
        variables: { id: action.id },
      }).then(() => {
        onDelete?.(action.id ?? '');
      })
      // await fetch("http://localhost:4000/graphql", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     query: `
      //       mutation DeleteAction($id: ID!) {
      //         deleteAction(id: $id) {
      //           id
      //         }
      //       }
      //     `,
      //   }),
      // });
  
    } catch (err) {
      console.error("Delete failed", err);
    }
  };
  

  return (
    <div
      key={action.id}
      className="flex items-center justify-between gap-4 rounded-md border px-4 py-2 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <Checkbox checked={checked} onCheckedChange={handleToggle} />
        <div>
          <div className="font-medium text-sm line-clamp-1">{action.title}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            {action.tbd ? format(+action.tbd, "MMM d, yyyy") : "No Date"}
            <Badge className={statusColor}>{status}</Badge>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={handleManage}>
          <Settings className="h-4 w-4" />
          <span className="sr-only">Manage</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={handleDelete}>
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    </div>
  );
}
