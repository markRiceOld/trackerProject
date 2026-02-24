import { Checkbox } from "~/components/ui/checkbox";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Pencil, Settings, Trash2, MoreVertical, Info } from "lucide-react";
import type { Action } from "./ActionsListPage";
import { isToday, isBefore, isAfter, format, isValid } from "date-fns";
import { parseDateOnly } from "~/utils/dateUtils";
import { Badge } from "../ui/badge";
import { useNavigate } from "react-router";
import { useEffect, useState, useRef } from "react";
import { useApi } from "~/api/useApi";
import {
  DELETE_ACTION,
  TOGGLE_ACTION,
  POSTPONE_ACTION,
  OUTSOURCE_ACTION,
  SET_ACTION_IGNORE,
  SET_ACTION_PASSED_ARCHIVED,
} from "~/api/queries";

/** Action with optional today-module fields (project, goal, milestone, estimatedTimeMinutes, startTimeOfDay). */
export type ActionWithTodayFields = Action & {
  project?: { id: string; title: string } | null;
  goal?: { id: string; title: string } | null;
  milestone?: { id: string; title: string } | null;
  isGathered?: boolean;
  sourceType?: string | null;
  startTimeOfDay?: string | null;
  estimatedTimeMinutes?: number | null;
};

export type ActionPreviewReturnState =
  | { from: "project"; projectId: string }
  | { from: "goal"; goalId: string; milestoneId?: string };

interface ActionPreviewProps {
  action: Action | ActionWithTodayFields;
  onToggle?: (id: string, done: boolean) => void;
  onReschedule?: () => void;
  onDelete?: (id: string) => void;
  /** When true, show postpone/outsource/ignore/pass options and hide Settings/Delete. */
  showTodayOptions?: boolean;
  onRefetch?: () => void;
  /** When opening action form (edit), pass this as location state so cancel/submit return here. */
  returnTo?: ActionPreviewReturnState;
}

function canIgnore(action: ActionWithTodayFields): boolean {
  return (
    !action.project &&
    (action.isGathered ? action.sourceType === "routine" : true)
  );
}

function canPass(action: ActionWithTodayFields): boolean {
  return Boolean(action.isGathered && action.sourceType === "interval");
}

export default function ActionPreview({
  onToggle,
  onReschedule,
  onDelete,
  action,
  showTodayOptions = false,
  onRefetch,
  returnTo,
}: ActionPreviewProps) {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(action.done ?? false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [postponeModalOpen, setPostponeModalOpen] = useState(false);
  const [outsourceModalOpen, setOutsourceModalOpen] = useState(false);
  const [postponeDate, setPostponeDate] = useState("");
  const [outsourceForm, setOutsourceForm] = useState({
    doTitle: "",
    doDate: "",
    ensureTitle: "",
    ensureDate: "",
  });
  const [infoBalloonOpen, setInfoBalloonOpen] = useState(false);
  const [infoHover, setInfoHover] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const { call } = useApi();
  const minDate = format(new Date(), "yyyy-MM-dd");
  const todayAction = action as ActionWithTodayFields;
  const showInfoBalloon = infoBalloonOpen || infoHover;
  function getStatus(actionArg: Action): string {
    if (actionArg.done) return "Done";
    if (!actionArg.tbd) return "Backlog";
    const tbd = parseDateOnly(actionArg.tbd);
    if (!isValid(tbd)) return "Backlog";
    if (isToday(tbd)) return "In Progress";
    if (isBefore(tbd, new Date())) return "Ignored";
    if (isAfter(tbd, new Date())) return "TBD";
    return "";
  }

  function formatTbd(value: Action["tbd"] | any): string {
    if (value == null || value === "") return "No Date";
    const d = parseDateOnly(value);
    return isValid(d) ? format(d, "MMM d, yyyy") : "No Date";
  }

  useEffect(() => {
    setChecked(action.done ?? false);
  }, [action.id, action.done]);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  useEffect(() => {
    if (!infoBalloonOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (infoRef.current && !infoRef.current.contains(e.target as Node)) {
        setInfoBalloonOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [infoBalloonOpen]);

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
    navigate(`/activities/action/${action.id}`, { state: returnTo ?? undefined });
  };

  const handleToggle = async () => {
    const nextDone = !checked;
    setChecked(nextDone);
    onToggle?.(action.id ?? "", nextDone);
    try {
      await call({ query: TOGGLE_ACTION, variables: { id: action.id } });
      onRefetch?.();
    } catch (err) {
      setChecked(!nextDone);
      onToggle?.(action.id ?? "", !nextDone);
      console.error("Toggle failed", err);
    }
  };

  const handlePostpone = async () => {
    if (!postponeDate) return;
    try {
      await call({
        query: POSTPONE_ACTION,
        variables: { id: action.id, newDate: postponeDate },
      });
      setPostponeDate("");
      setPostponeModalOpen(false);
      setDropdownOpen(false);
      onRefetch?.();
    } catch (e) {
      console.error(e);
    }
  };

  const handleOutsource = async () => {
    if (!outsourceForm.doDate || !outsourceForm.ensureDate) return;
    try {
      await call({
        query: OUTSOURCE_ACTION,
        variables: {
          id: action.id,
          doOutsourcingTitle: outsourceForm.doTitle || "Do outsourcing",
          doOutsourcingDate: outsourceForm.doDate,
          ensureDoneTitle: outsourceForm.ensureTitle || "Ensure done",
          ensureDoneDate: outsourceForm.ensureDate,
        },
      });
      setOutsourceForm({ doTitle: "", doDate: "", ensureTitle: "", ensureDate: "" });
      setOutsourceModalOpen(false);
      setDropdownOpen(false);
      onRefetch?.();
    } catch (e) {
      console.error(e);
    }
  };

  const handleIgnore = async () => {
    try {
      await call({ query: SET_ACTION_IGNORE, variables: { id: action.id } });
      setDropdownOpen(false);
      onRefetch?.();
    } catch (e) {
      console.error(e);
    }
  };

  const handlePass = async () => {
    try {
      await call({
        query: SET_ACTION_PASSED_ARCHIVED,
        variables: { id: action.id },
      });
      setDropdownOpen(false);
      onRefetch?.();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    try {
      await call({
        query: DELETE_ACTION,
        variables: { id: action.id },
      });
      onDelete?.(action.id ?? '');
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
  

  if (showTodayOptions) {
    const parentLabel =
      todayAction.milestone?.title
        ? `Milestone: ${todayAction.milestone.title}`
        : todayAction.goal?.title
          ? `Goal: ${todayAction.goal.title}`
          : todayAction.project?.title
            ? `Project: ${todayAction.project.title}`
            : null;

    return (
      <li className="rounded-lg border bg-card relative">
        <div className="flex items-center gap-3 px-3 py-2">
          <Checkbox checked={checked} onCheckedChange={handleToggle} />
          <div ref={infoRef} className="min-w-0 flex-1 flex items-center gap-1.5">
            <button
              type="button"
              className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
              onClick={() => setInfoBalloonOpen((o) => !o)}
              onMouseEnter={() => setInfoHover(true)}
              onMouseLeave={() => setInfoHover(false)}
              aria-label="Action details"
            >
              <Info className="h-3.5 w-3.5" />
            </button>
            {showInfoBalloon && (
              <div
                className="absolute left-8 top-10 z-50 min-w-[180px] max-w-[320px] rounded-md border bg-popover px-3 py-2 text-sm shadow-md"
                role="tooltip"
              >
                <div className="space-y-1.5">
                  <div className="font-medium break-words">{action.title}</div>
                  {todayAction.estimatedTimeMinutes != null && todayAction.estimatedTimeMinutes > 0 && (
                    <div>Estimated: {todayAction.estimatedTimeMinutes} min</div>
                  )}
                  {parentLabel && <div className="text-muted-foreground">{parentLabel}</div>}
                  {!todayAction.estimatedTimeMinutes && !todayAction.startTimeOfDay && !parentLabel && (
                    <div className="text-muted-foreground">No other details</div>
                  )}
                </div>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="font-medium text-sm truncate">{action.title}</div>
              <div className="text-xs text-muted-foreground">
                {todayAction.project?.title && (
                  <span>from {todayAction.project.title}</span>
                )}
                {todayAction.startTimeOfDay && (
                  <span className="ml-1">{todayAction.startTimeOfDay}</span>
                )}
                {!todayAction.project?.title && !todayAction.startTimeOfDay && (
                  <span>{formatTbd(action.tbd)}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" onClick={handleManage} className="h-8 w-8" aria-label="Manage">
              <Settings className="h-4 w-4" />
            </Button>
            <div ref={dropdownRef} className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDropdownOpen((o) => !o)}
                className="h-8 w-8"
                aria-label="Options"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-md border bg-popover py-1 shadow-md">
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => {
                    setOutsourceModalOpen(true);
                    setDropdownOpen(false);
                  }}
                >
                  Outsource…
                </button>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => {
                    setPostponeModalOpen(true);
                    setDropdownOpen(false);
                  }}
                >
                  Postpone
                </button>
                {canIgnore(todayAction) && (
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => handleIgnore()}
                  >
                    Ignore (bucket list)
                  </button>
                )}
                {canPass(todayAction) && (
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => handlePass()}
                  >
                    Pass
                  </button>
                )}
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Postpone modal */}
        {postponeModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setPostponeModalOpen(false)}
          >
            <div
              className="rounded-lg border bg-card p-4 shadow-lg w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <Label htmlFor="action-preview-postpone-date" className="font-medium mb-3 flex items-center gap-2">
                Postpone to date <Pencil className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden />
              </Label>
              <div className="flex gap-2">
                <Input
                  id="action-preview-postpone-date"
                  type="date"
                  min={minDate}
                  value={postponeDate}
                  onChange={(e) => setPostponeDate(e.target.value)}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={handlePostpone}
                  disabled={!postponeDate}
                >
                  Set date
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => setPostponeModalOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Outsource modal */}
        {outsourceModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-auto"
            onClick={() => {
              setOutsourceModalOpen(false);
              setOutsourceForm({ doTitle: "", doDate: "", ensureTitle: "", ensureDate: "" });
            }}
          >
            <div
              className="rounded-lg border bg-card p-4 shadow-lg w-full max-w-md my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-medium mb-3">Outsource: set dates for follow-up tasks</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <Label htmlFor="action-preview-outsource-do-title" className="text-xs flex items-center gap-2">
                    Do outsourcing (title) <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  </Label>
                  <Input
                    id="action-preview-outsource-do-title"
                    placeholder="e.g. Delegate to X"
                    value={outsourceForm.doTitle}
                    onChange={(e) =>
                      setOutsourceForm((p) => ({ ...p, doTitle: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="action-preview-outsource-do-date" className="text-xs flex items-center gap-2">
                    Date <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  </Label>
                  <Input
                    id="action-preview-outsource-do-date"
                    type="date"
                    min={minDate}
                    value={outsourceForm.doDate}
                    onChange={(e) =>
                      setOutsourceForm((p) => ({ ...p, doDate: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="action-preview-outsource-ensure-title" className="text-xs flex items-center gap-2">
                    Ensure done (title) <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  </Label>
                  <Input
                    id="action-preview-outsource-ensure-title"
                    placeholder="e.g. Confirm with X"
                    value={outsourceForm.ensureTitle}
                    onChange={(e) =>
                      setOutsourceForm((p) => ({ ...p, ensureTitle: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="action-preview-outsource-ensure-date" className="text-xs flex items-center gap-2">
                    Date <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  </Label>
                  <Input
                    id="action-preview-outsource-ensure-date"
                    type="date"
                    min={minDate}
                    value={outsourceForm.ensureDate}
                    onChange={(e) =>
                      setOutsourceForm((p) => ({ ...p, ensureDate: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={handleOutsource}
                  disabled={!outsourceForm.doDate || !outsourceForm.ensureDate}
                >
                  Confirm outsource
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setOutsourceModalOpen(false);
                    setOutsourceForm({ doTitle: "", doDate: "", ensureTitle: "", ensureDate: "" });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </li>
    );
  }

  const otherAction = action as ActionWithTodayFields;
  const parentLabelOther =
    otherAction.milestone?.title
      ? `Milestone: ${otherAction.milestone.title}`
      : otherAction.goal?.title
        ? `Goal: ${otherAction.goal.title}`
        : otherAction.project?.title
          ? `Project: ${otherAction.project.title}`
          : null;

  return (
    <div
      key={action.id}
      className="flex items-center justify-between gap-4 rounded-md border px-4 py-2 shadow-sm relative"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Checkbox checked={checked} onCheckedChange={handleToggle} />
        <div ref={infoRef} className="min-w-0 flex-1 flex items-center gap-1.5">
          <button
            type="button"
            className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
            onClick={() => setInfoBalloonOpen((o) => !o)}
            onMouseEnter={() => setInfoHover(true)}
            onMouseLeave={() => setInfoHover(false)}
            aria-label="Action details"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
          {(infoBalloonOpen || infoHover) && (
            <div
              className="absolute left-10 top-12 z-50 min-w-[180px] max-w-[320px] rounded-md border bg-popover px-3 py-2 text-sm shadow-md"
              role="tooltip"
            >
              <div className="space-y-1.5">
                <div className="font-medium break-words">{action.title}</div>
                {otherAction.estimatedTimeMinutes != null && otherAction.estimatedTimeMinutes > 0 && (
                  <div>Estimated: {otherAction.estimatedTimeMinutes} min</div>
                )}
                {otherAction.startTimeOfDay && (
                  <div>Do time: {otherAction.startTimeOfDay}</div>
                )}
                {parentLabelOther && (
                  <div className="text-muted-foreground">{parentLabelOther}</div>
                )}
                {!otherAction.estimatedTimeMinutes && !otherAction.startTimeOfDay && !parentLabelOther && (
                  <div className="text-muted-foreground">No other details</div>
                )}
              </div>
            </div>
          )}
          <div className="min-w-0">
            <div className="font-medium text-sm line-clamp-1">{action.title}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              {formatTbd(action.tbd)}
              <Badge className={statusColor}>{status}</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
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
