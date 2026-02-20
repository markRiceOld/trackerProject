import { useState } from "react";
import { useNavigate } from "react-router";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { ConfirmDialog } from "~/components/ui/confirm-dialog";
import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { useApi } from "~/api/useApi";
import { DELETE_INTERVAL } from "~/api/queries";

export type RepeatUnit = "minute" | "hour" | "day" | "week" | "month" | "year";

export interface IntervalPreviewProps {
  id: string;
  title: string;
  status: "active" | "inactive";
  endTime?: string | null;
  repeatValue: number;
  repeatUnit?: RepeatUnit | null;
  customRepeatDates: string[];
  steps: { id: string; title: string; order: number }[];
  goal?: { id: string; title: string } | null;
  milestone?: { id: string; title: string } | null;
  project?: { id: string; title: string } | null;
  showControls?: boolean;
  onManage?: (id: string) => void;
  onDelete?: (id: string) => void;
}

function formatRepeats(props: {
  repeatValue: number;
  repeatUnit?: RepeatUnit | null;
  customRepeatDates: string[];
}): string {
  const { repeatValue, repeatUnit, customRepeatDates } = props;
  if (repeatUnit) {
    const unit = repeatValue === 1 ? repeatUnit : `${repeatUnit}s`;
    return `Every ${repeatValue} ${unit}`;
  }
  if (customRepeatDates?.length) {
    return `Custom (${customRepeatDates.length} date${customRepeatDates.length === 1 ? "" : "s"})`;
  }
  return "—";
}

function getNextEvent(props: {
  customRepeatDates: string[];
  endTime?: string | null;
}): string | null {
  const { customRepeatDates, endTime } = props;
  if (!customRepeatDates?.length) return null;
  const now = Date.now();
  const end = endTime ? new Date(endTime).getTime() : null;
  const future = customRepeatDates
    .map((s) => new Date(s).getTime())
    .filter((t) => t >= now && (end == null || t <= end))
    .sort((a, b) => a - b);
  if (future.length === 0) return null;
  return format(new Date(future[0]), "MMM d, yyyy 'at' HH:mm");
}

export default function IntervalPreview(props: IntervalPreviewProps) {
  const navigate = useNavigate();
  const {
    id,
    title,
    status,
    repeatValue,
    repeatUnit,
    customRepeatDates,
    steps,
    goal,
    milestone,
    project,
    showControls,
    onManage,
    onDelete,
  } = props;

  const repeatsLabel = formatRepeats({ repeatValue, repeatUnit, customRepeatDates });
  const nextEvent = getNextEvent({
    customRepeatDates: customRepeatDates ?? [],
    endTime: props.endTime,
  });
  const stepCount = steps?.length ?? 0;
  const linkLabel = goal?.title ?? milestone?.title ?? project?.title;
  const { call } = useApi(DELETE_INTERVAL);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handleManage = () => {
    navigate(`/activities/interval/${id}`);
    onManage?.(id);
  };

  const handleDeleteConfirm = async () => {
    try {
      const res = await call({ variables: { id } });
      if (res?.deleteInterval) onDelete?.(id);
    } catch (err) {
      console.error("Failed to delete interval", err);
    }
  };

  return (
    <div className="border rounded-md p-4 shadow-sm space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="font-semibold text-sm line-clamp-1 flex-1 min-w-0">{title}</h2>
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary">Interval</Badge>
          <Badge variant={status === "active" ? "default" : "secondary"}>
            {status === "active" ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      <div className="flex items-start justify-between gap-2">
        <div className="text-xs text-muted-foreground space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0">
            <span>Repeats: {repeatsLabel}</span>
            {nextEvent && <span>Next: {nextEvent}</span>}
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0">
            <span>{stepCount} step{stepCount !== 1 ? "s" : ""}</span>
            {linkLabel && (
              <span className="text-muted-foreground/80">
                Linked: <span className="font-medium text-foreground/90">{linkLabel}</span>
              </span>
            )}
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
        title="Delete this interval?"
        description="Are you sure you want to delete this interval? This cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
