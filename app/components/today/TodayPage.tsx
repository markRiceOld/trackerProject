import { Skeleton } from "~/components/ui/skeleton";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import ActionPreview from "~/components/actions/ActionPreview";
import AfterDayWizard from "./AfterDayWizard";
import PreDayWizard from "./PreDayWizard";
import UnderConstruction from "../UnderConstruction";
import { useState, useEffect, useCallback } from "react";
import { useApi } from "~/api/useApi";
import {
  GET_TODAY_ACTIONS,
  GET_DAY_STATE,
  GET_PRE_DAY_STATUS,
  ADD_ACTION,
} from "~/api/queries";
import { toLocalDateString } from "~/utils/dateUtils";
import { Moon, Pencil, Sun, Plus } from "lucide-react";

export default function TodayPage() {
  const todayKey = toLocalDateString(new Date());
  const [dayState, setDayState] = useState<{ preDayCompletedAt?: string | null } | null>(null);
  const [preDayStatus, setPreDayStatus] = useState<{ afterDayRequired?: boolean } | null>(null);
  const [dayStateLoading, setDayStateLoading] = useState(true);
  const [showAfterDay, setShowAfterDay] = useState(false);
  const [showPreDay, setShowPreDay] = useState(false);
  const [todayActions, setTodayActions] = useState<any[] | null>(null);
  const [addInput, setAddInput] = useState("");
  const [addDate, setAddDate] = useState(todayKey);
  const [addEstimatedMin, setAddEstimatedMin] = useState<string>("");
  const [addTimeOfDay, setAddTimeOfDay] = useState<string>("");
  const { call } = useApi();
  const showAddFields = addInput.trim().length > 0;
  const addDateIsToday = addDate === todayKey;
  const addEstimatedNum = addEstimatedMin.trim() ? parseInt(addEstimatedMin, 10) : NaN;
  const canSubmitAdd =
    addInput.trim().length > 0 &&
    addDate.length > 0 &&
    !Number.isNaN(addEstimatedNum) &&
    addEstimatedNum >= 0 &&
    (!addDateIsToday || addTimeOfDay.length > 0);

  const refetchDayState = useCallback(() => {
    call({ query: GET_DAY_STATE, variables: { date: todayKey } }).then((res: any) => {
      setDayState(res?.dayState ?? null);
    });
    call({ query: GET_PRE_DAY_STATUS, variables: { date: todayKey } }).then((res: any) => {
      setPreDayStatus(res?.preDayStatus ?? null);
    });
  }, [call, todayKey]);

  // Initial load: only re-run when date changes to avoid loop from unstable `call` reference
  useEffect(() => {
    let cancelled = false;
    setDayStateLoading(true);
    call({ query: GET_DAY_STATE, variables: { date: todayKey } })
      .then((res: any) => {
        if (!cancelled) setDayState(res?.dayState ?? null);
      })
      .finally(() => {
        if (!cancelled) setDayStateLoading(false);
      });
    call({ query: GET_PRE_DAY_STATUS, variables: { date: todayKey } }).then((res: any) => {
      if (!cancelled) setPreDayStatus(res?.preDayStatus ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [todayKey]);

  const refetchTodayActions = useCallback(() => {
    call({ query: GET_TODAY_ACTIONS, variables: { date: todayKey } }).then((res: any) =>
      setTodayActions(res?.todayActions ?? [])
    );
  }, [call, todayKey]);

  // Initial load of today actions: only when date changes
  useEffect(() => {
    call({ query: GET_TODAY_ACTIONS, variables: { date: todayKey } }).then((res: any) =>
      setTodayActions(res?.todayActions ?? [])
    );
  }, [todayKey]);

  const preDayDone = Boolean(dayState?.preDayCompletedAt);
  const afterDayRequired = preDayStatus?.afterDayRequired === true;

  if (showAfterDay) {
    return (
      <AfterDayWizard
        dateKeyToClose={todayKey}
        onClose={() => {
          setShowAfterDay(false);
          refetchDayState();
        }}
      />
    );
  }

  if (showPreDay) {
    return (
      <PreDayWizard
        todayKey={todayKey}
        afterDayRequired={afterDayRequired}
        onClose={() => setShowPreDay(false)}
        onComplete={() => {
          refetchDayState();
          setShowPreDay(false);
        }}
      />
    );
  }

  if (!dayStateLoading && !preDayDone) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Good morning</h1>
        <Button onClick={() => setShowPreDay(true)} className="gap-2">
          <Sun className="h-4 w-4" />
          Start
        </Button>
      </main>
    );
  }

  const linkedActions = (todayActions ?? []).filter(
    (a: any) => a.project || a.isGathered
  );
  const standaloneActions = (todayActions ?? []).filter(
    (a: any) => !a.project && !a.isGathered
  );

  const handleAddStandalone = () => {
    if (!canSubmitAdd) return;
    const title = addInput.trim();
    call({
      query: ADD_ACTION,
      variables: {
        title,
        tbd: addDate,
        estimatedTimeMinutes: addEstimatedNum,
        startTimeOfDay: addDateIsToday ? addTimeOfDay : undefined,
      },
    }).then(() => {
      setAddInput("");
      setAddDate(todayKey);
      setAddEstimatedMin("");
      setAddTimeOfDay("");
      refetchTodayActions();
    });
  };

  return (
    <main className="space-y-8 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Today</h1>
        <Button
          variant="outline"
          onClick={() => setShowAfterDay(true)}
          className="gap-2"
        >
          <Moon className="h-4 w-4" />
          After day
        </Button>
      </div>

      {/* Section 1: Linked Actions */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-muted-foreground">Linked Actions</h2>
        {todayActions === null ? (
          <>
            <Skeleton className="h-16 w-full rounded-md" />
            <Skeleton className="h-16 w-full rounded-md" />
          </>
        ) : !linkedActions.length ? (
          <p className="text-muted-foreground">No linked actions for today.</p>
        ) : (
          <ul className="space-y-2">
            {linkedActions.map((action: any) => (
              <ActionPreview
                key={action.id}
                action={action}
                showTodayOptions
                onRefetch={refetchTodayActions}
              />
            ))}
          </ul>
        )}
      </section>

      {/* Section 2: Standalone Actions */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-muted-foreground">Standalone Actions</h2>
        <div className="space-y-3">
          <div className="flex gap-2 items-center">
            <label htmlFor="today-add-action-title" className="flex items-center gap-2 shrink-0 text-muted-foreground">
              <Pencil className="h-4 w-4" aria-hidden />
            </label>
            <Input
              id="today-add-action-title"
              placeholder="Add a new action (title)"
              value={addInput}
              onChange={(e) => setAddInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (showAddFields ? canSubmitAdd && handleAddStandalone() : false)}
            />
            <Button onClick={handleAddStandalone} size="icon" variant="default" disabled={showAddFields && !canSubmitAdd}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {showAddFields && (
            <div className="grid gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="today-add-date" className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  Date <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden />
                </label>
                <Input
                  id="today-add-date"
                  type="date"
                  min={todayKey}
                  value={addDate}
                  onChange={(e) => setAddDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="today-add-estimated" className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  Estimated time (min) <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden />
                </label>
                <Input
                  id="today-add-estimated"
                  type="number"
                  min={0}
                  placeholder="e.g. 30"
                  value={addEstimatedMin}
                  onChange={(e) => setAddEstimatedMin(e.target.value)}
                  required
                />
              </div>
              {addDateIsToday && (
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="today-add-time" className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    Time to do <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  </label>
                  <Input
                    id="today-add-time"
                    type="time"
                    value={addTimeOfDay}
                    onChange={(e) => setAddTimeOfDay(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
        {todayActions === null ? (
          <Skeleton className="h-16 w-full rounded-md" />
        ) : !standaloneActions.length ? (
          <p className="text-muted-foreground">No standalone actions for today.</p>
        ) : (
          <ul className="space-y-2">
            {standaloneActions.map((action: any) => (
              <ActionPreview
                key={action.id}
                action={action}
                showTodayOptions
                onRefetch={refetchTodayActions}
              />
            ))}
          </ul>
        )}
      </section>

      {/* Focus Mode Button Skeleton */}
      {/* <section className="space-y-4"> */}
        {/* <Skeleton className="h-12 w-full rounded-full" /> */}
        {/* <UnderConstruction title="Focus mode" /> */}
      {/* </section> */}
    </main>
  );
}
