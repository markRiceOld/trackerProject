import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { format, isToday, isBefore, isAfter } from "date-fns";
import { Calendar } from "~/components/ui/calendar";
import { Badge } from "~/components/ui/badge";
import InternalPageLayout from "~/layout/InternalPageLayout";
import { ADD_ACTION, UPDATE_ACTION, GET_ACTION, DELETE_ACTION, GET_PROJECTS } from "~/api/queries";
import { ConfirmDialog } from "~/components/ui/confirm-dialog";
import { InlineEdit } from "~/components/ui/inline-edit";
import { Pencil, Trash2 } from "lucide-react";
import { useApi } from "~/api/useApi";
import { parseDateOnly, toLocalDateString } from "~/utils/dateUtils";

const MAX_ESTIMATED_MINUTES = 24 * 60; // 24 hours

/** HH:mm */
function isValidTime(s: string): boolean {
  return /^\d{2}:\d{2}$/.test(String(s).trim());
}

type ActionFormReturnState =
  | { from: "project"; projectId: string }
  | { from: "goal"; goalId: string; milestoneId?: string };

type ProjectOption = {
  id: string;
  title: string;
  goal?: { id: string; title: string } | null;
  milestone?: { id: string; title: string } | null;
};

function getActionFormReturnPath(state: unknown): string {
  if (state && typeof state === "object" && "from" in state) {
    const s = state as ActionFormReturnState;
    if (s.from === "project" && "projectId" in s && s.projectId) return `/activities/project/${s.projectId}`;
    if (s.from === "goal" && "goalId" in s && s.goalId)
      return s.milestoneId ? `/activities/goal/${s.goalId}/milestone/${s.milestoneId}` : `/activities/goal/${s.goalId}`;
  }
  return "/activities/actions";
}

function getActionFormBackLabel(state: unknown): string {
  if (state && typeof state === "object" && "from" in state) {
    const s = state as ActionFormReturnState;
    if (s.from === "project") return "← Back to Project";
    if (s.from === "goal") return "← Back to Goal";
  }
  return "← Back to Actions";
}

export default function ActionForm() {
  const { id } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const returnTo = getActionFormReturnPath(location.state);
  const backLabel = getActionFormBackLabel(location.state);
  const stateProjectId =
    location.state &&
    typeof location.state === "object" &&
    "from" in location.state &&
    (location.state as { from?: string; projectId?: string }).from === "project"
      ? (location.state as { projectId?: string }).projectId
      : undefined;
  const projectIdParam = searchParams.get("projectId") ?? undefined;
  const initialProjectId = projectIdParam ?? stateProjectId ?? "";
  const [title, setTitle] = useState("");
  const [tbd, setTbd] = useState<Date | undefined>(undefined);
  const [startTimeOfDay, setStartTimeOfDay] = useState("");
  const [estimatedTimeMinutes, setEstimatedTimeMinutes] = useState("");
  const [estimatedTimeError, setEstimatedTimeError] = useState<string | null>(null);
  const [timeOfDayError, setTimeOfDayError] = useState<string | null>(null);
  const [editingTbd, setEditingTbd] = useState(false);
  const [tempTbd, setTempTbd] = useState<Date | undefined>(undefined);
  const [projectId, setProjectId] = useState<string>(initialProjectId);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const navigate = useNavigate();
  const { call } = useApi();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const startOfToday = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  const isEdit = Boolean(id);
  const tbdIsToday = tbd != null && isToday(tbd);

  useEffect(() => {
    call({ query: GET_PROJECTS }).then((res) => {
      setProjects((res?.projects ?? []) as ProjectOption[]);
    });
  }, [call]);

  useEffect(() => {
    if (!isEdit || !id) return;
    let cancelled = false;
    call({ query: GET_ACTION, variables: { id } })
      .then((res: any) => {
        const action = res?.action;
        if (cancelled || !action) return;
        setTitle(action.title ?? "");
        setTbd(action.tbd ? parseDateOnly(action.tbd) : undefined);
        setTempTbd(action.tbd ? parseDateOnly(action.tbd) : undefined);
        setEstimatedTimeMinutes(
          action.estimatedTimeMinutes != null ? String(action.estimatedTimeMinutes) : ""
        );
        setStartTimeOfDay(action.startTimeOfDay ?? "");
        setProjectId(action.project?.id ?? initialProjectId);
      })
      .catch((err) => {
        if (!cancelled) console.error("Failed to fetch action:", err);
      });
    return () => {
      cancelled = true;
    };
  }, [isEdit, id, call, initialProjectId]);

  function getStatus(): string {
    if (!tbd) return "Backlog";
    if (isToday(tbd)) return "In Progress";
    if (isBefore(tbd, new Date())) return "Ignored";
    if (isAfter(tbd, new Date())) return "TBD";
    return "";
  }

  function getStatusColor(status: string): string {
    switch (status) {
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

  const updateActionField = async (field: string, value: string | null) => {
    if (!id) return;
    try {
      await call({
        query: UPDATE_ACTION,
        variables: {
          id,
          [field]: value,
        },
      });
      if (field === "title") {
        setTitle(String(value ?? ""));
      }
      if (field === "tbd") {
        setTbd(value ? new Date(value) : undefined);
        setTempTbd(value ? new Date(value) : undefined);
      }
    } catch (err) {
      console.error("Failed to update action:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEstimatedTimeError(null);
    setTimeOfDayError(null);

    const hasDueDate = Boolean(tbd);
    const estStr = estimatedTimeMinutes.trim();
    const estNum = estStr === "" ? null : parseInt(estStr, 10);

    if (hasDueDate) {
      if (estStr === "" || !Number.isFinite(estNum)) {
        setEstimatedTimeError("Estimated time is required when a due date is set.");
        return;
      }
      if (estNum! < 0 || estNum! > MAX_ESTIMATED_MINUTES) {
        setEstimatedTimeError(`Estimated time must be between 0 and ${MAX_ESTIMATED_MINUTES} minutes (24 hours).`);
        return;
      }
    } else if (estStr !== "" && (estNum === null || !Number.isFinite(estNum) || estNum < 0 || estNum > MAX_ESTIMATED_MINUTES)) {
      setEstimatedTimeError(`Estimated time must be between 0 and ${MAX_ESTIMATED_MINUTES} minutes (24 hours).`);
      return;
    }

    if (tbdIsToday) {
      const timeStr = startTimeOfDay.trim();
      if (!timeStr || !isValidTime(timeStr)) {
        setTimeOfDayError("Time is required when the date is today (use HH:mm).");
        return;
      }
    }

    try {
      const isEditing = isEdit && id;
      const mutation = isEditing ? UPDATE_ACTION : ADD_ACTION;
      const tbdStr = tbd ? toLocalDateString(tbd) : null;
      const startTime = tbdIsToday && startTimeOfDay.trim() && isValidTime(startTimeOfDay.trim())
        ? startTimeOfDay.trim().slice(0, 5)
        : undefined;

      const variables = isEditing
        ? {
            id,
            title,
            tbd: tbdStr,
            done: false,
            estimatedTimeMinutes: estNum ?? undefined,
            startTimeOfDay: startTime ?? undefined,
            projectId: projectId || null,
          }
        : {
            title,
            tbd: tbdStr,
            estimatedTimeMinutes: estNum ?? undefined,
            startTimeOfDay: startTime,
            projectId: projectId || undefined,
          };

      const res = await call({ query: mutation, variables });
      if (res?.updateAction ?? res?.addAction) navigate(returnTo);
    } catch (error) {
      console.error("Failed to submit action:", error);
    }
  };

  function handleCancel() {
    navigate(returnTo);
  }

  const status = getStatus();
  const statusColor = getStatusColor(status);

  const selectedProject = projects.find((p) => p.id === projectId);

  const handleDeleteConfirm = async () => {
    if (!id) return;
    await call({ query: DELETE_ACTION, variables: { id } });
    setDeleteConfirmOpen(false);
    navigate(returnTo);
  };

  if (isEdit) {
    return (
      <InternalPageLayout
        backLink={{ to: returnTo, label: backLabel }}
        title="Edit Action"
        actions={
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive hover:text-destructive ml-2"
            onClick={() => setDeleteConfirmOpen(true)}
            title="Delete action"
            aria-label="Delete action"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <InlineEdit
                id="action-title-edit"
                value={title}
                onSave={(v) => updateActionField("title", v.trim() || title)}
                displayAs="h2"
                displayClassName="text-lg font-medium flex-1 min-w-0 truncate"
                inputClassName="text-lg font-medium flex-1"
                placeholder="Action title"
                emptyDisplay="Click to add title"
              />
              <Badge className={statusColor}>{status}</Badge>
            </div>
          </div>

          <div className="space-y-1">
            {editingTbd ? (
              <div className="flex items-center gap-2 flex-wrap">
                <Calendar
                  mode="single"
                  selected={tempTbd}
                  onSelect={(d) => {
                    setTempTbd(d);
                    setTbd(d);
                    setEditingTbd(false);
                    updateActionField("tbd", d ? toLocalDateString(d) : null);
                  }}
                  disabled={{ before: startOfToday }}
                  className="border rounded-md"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingTbd(false)}
                >
                  Done
                </Button>
              </div>
            ) : (
              <p
                className="text-muted-foreground cursor-pointer text-sm"
                onClick={() => {
                  setEditingTbd(true);
                  setTempTbd(tbd);
                }}
              >
                {tbd ? format(tbd, "MMM d, yyyy") : "Click to set TBD date"}
              </p>
            )}
          </div>

          {tbdIsToday && (
            <div className="space-y-2">
              <Label htmlFor="startTimeOfDay" className="flex items-center gap-2">
                Time to do <span className="text-destructive">*</span>
                <Pencil className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden />
              </Label>
              <Input
                id="startTimeOfDay"
                type="time"
                value={startTimeOfDay}
                onChange={(e) => {
                  setStartTimeOfDay(e.target.value);
                  setTimeOfDayError(null);
                }}
                aria-invalid={Boolean(timeOfDayError)}
                className={timeOfDayError ? "border-red-500" : undefined}
              />
              {timeOfDayError && (
                <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
                  {timeOfDayError}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="estimatedTimeMinutes" className="flex items-center gap-2">
              Estimated time (minutes) {tbd ? <span className="text-destructive">*</span> : "(optional)"}
              <Pencil className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden />
            </Label>
            <Input
              id="estimatedTimeMinutes"
              type="number"
              min={0}
              max={MAX_ESTIMATED_MINUTES}
              placeholder="e.g. 30"
              value={estimatedTimeMinutes}
              onChange={(e) => {
                setEstimatedTimeMinutes(e.target.value);
                if (estimatedTimeError) setEstimatedTimeError(null);
              }}
              aria-invalid={Boolean(estimatedTimeError)}
              className={estimatedTimeError ? "border-red-500 focus-visible:ring-red-500/30" : undefined}
            />
            <p className="text-xs text-muted-foreground">
              Max 24 hours (1440 min). Required when a due date is set.
            </p>
            {estimatedTimeError && (
              <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
                {estimatedTimeError}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectId" className="flex items-center gap-2">
              Linked project (optional) <Pencil className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden />
            </Label>
            <select
              id="projectId"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2 py-1 text-sm"
            >
              <option value="">— No project —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {selectedProject && (
            <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
              <Badge variant="secondary">Project: {selectedProject.title}</Badge>
              {selectedProject.goal?.title && (
                <Badge variant="outline">Goal: {selectedProject.goal.title}</Badge>
              )}
              {selectedProject.milestone?.title && (
                <Badge variant="outline">Milestone: {selectedProject.milestone.title}</Badge>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="submit">Update Action</Button>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </form>

        <ConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={(open) => !open && setDeleteConfirmOpen(false)}
          title="Delete this action?"
          description="This cannot be undone."
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={handleDeleteConfirm}
        />
      </InternalPageLayout>
    );
  }

  return (
    <InternalPageLayout
      backLink={{ to: returnTo, label: backLabel }}
      title="Add Action"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title" className="flex items-center gap-2">
            Title <Pencil className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden />
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Action title"
          />
        </div>

        <div className="space-y-2">
          <Label>TBD Date</Label>
          <Calendar
            mode="single"
            selected={tbd}
            onSelect={setTbd}
            disabled={{ before: startOfToday }}
            className="border rounded-md w-fit min-w-fit"
          />
        </div>

        {tbdIsToday && (
          <div className="space-y-2">
            <Label htmlFor="startTimeOfDay" className="flex items-center gap-2">
              Time to do <span className="text-destructive">*</span>
              <Pencil className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden />
            </Label>
            <Input
              id="startTimeOfDay"
              type="time"
              value={startTimeOfDay}
              onChange={(e) => {
                setStartTimeOfDay(e.target.value);
                setTimeOfDayError(null);
              }}
              aria-invalid={Boolean(timeOfDayError)}
              className={timeOfDayError ? "border-red-500" : undefined}
            />
            {timeOfDayError && (
              <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
                {timeOfDayError}
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="estimatedTimeMinutes" className="flex items-center gap-2">
            Estimated time (minutes) {tbd ? <span className="text-destructive">*</span> : "(optional)"}
            <Pencil className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden />
          </Label>
          <Input
            id="estimatedTimeMinutes"
            type="number"
            min={0}
            max={MAX_ESTIMATED_MINUTES}
            placeholder="e.g. 30"
            value={estimatedTimeMinutes}
            onChange={(e) => {
              setEstimatedTimeMinutes(e.target.value);
              if (estimatedTimeError) setEstimatedTimeError(null);
            }}
            aria-invalid={Boolean(estimatedTimeError)}
            className={estimatedTimeError ? "border-red-500 focus-visible:ring-red-500/30" : undefined}
          />
          <p className="text-xs text-muted-foreground">
            Max 24 hours (1440 min). Required when a due date is set.
          </p>
          {estimatedTimeError && (
            <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
              {estimatedTimeError}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="projectId" className="flex items-center gap-2">
            Linked project (optional) <Pencil className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden />
          </Label>
          <select
            id="projectId"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2 py-1 text-sm"
          >
            <option value="">— No project —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label>Status</Label>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            {tbd ? format(tbd, "MMM d, yyyy") : "No Date"}
            <Badge className={statusColor}>{status}</Badge>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit">Create Action</Button>
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </InternalPageLayout>
  );
}
