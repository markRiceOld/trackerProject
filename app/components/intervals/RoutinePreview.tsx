import { useState } from "react";
import { useNavigate } from "react-router";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { ConfirmDialog } from "~/components/ui/confirm-dialog";
import { Pencil, Trash2 } from "lucide-react";
import { useApi } from "~/api/useApi";
import { DELETE_ROUTINE } from "~/api/queries";

export interface RoutinePreviewProps {
  id: string;
  title: string;
  status: "active" | "inactive";
  endTime?: string | null;
  timeOfDayBlocks?: string[];
  steps: { id: string; title: string; order: number }[];
  showControls?: boolean;
  onManage?: (id: string) => void;
  onDelete?: (id: string) => void;
}

/** Format time block (e.g. "09:30") for display */
function formatTime(s: string | null | undefined): string {
  if (!s) return "—";
  const part = String(s).slice(0, 5);
  if (/^\d{2}:\d{2}$/.test(part)) return part;
  return s;
}

function formatTimeOfDayBlocks(blocks: string[] | null | undefined): string {
  if (Array.isArray(blocks) && blocks.length > 0) {
    return blocks.map(formatTime).join(", ");
  }
  return "—";
}

export default function RoutinePreview(props: RoutinePreviewProps) {
  const navigate = useNavigate();
  const { id, title, status, timeOfDayBlocks, steps, showControls, onManage, onDelete } = props;
  const stepCount = steps?.length ?? 0;
  const timeLabel = formatTimeOfDayBlocks(timeOfDayBlocks);
  const { call } = useApi(DELETE_ROUTINE);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handleManage = () => {
    navigate(`/activities/routine/${id}`);
    onManage?.(id);
  };

  const handleDeleteConfirm = async () => {
    try {
      const res = await call({ variables: { id } });
      if (res?.deleteRoutine) onDelete?.(id);
    } catch (err) {
      console.error("Failed to delete routine", err);
    }
  };

  return (
    <div className="border rounded-md p-4 shadow-sm space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="font-semibold text-sm line-clamp-1 flex-1 min-w-0">{title}</h2>
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary">Routine</Badge>
          <Badge variant={status === "active" ? "default" : "secondary"}>
            {status === "active" ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      <div className="flex items-start justify-between gap-2">
        <div className="text-xs text-muted-foreground space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0">
            <span>Time of day: {timeLabel}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0">
            <span>{stepCount} step{stepCount !== 1 ? "s" : ""}</span>
          </div>
        </div>
        {showControls && (
          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={handleManage}
              title="Manage"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            {onDelete && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => setDeleteConfirmOpen(true)}
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={(open) => !open && setDeleteConfirmOpen(false)}
        title="Delete this routine?"
        description="Are you sure you want to delete this routine? This cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
