import { useEffect, useState } from "react";
import { Checkbox } from "~/components/ui/checkbox";
import { Button } from "~/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { useNavigate } from "react-router";
import InternalPageLayout from "~/layout/InternalPageLayout";
import ActionPreview from "./ActionPreview";
import { useApi } from "~/api/useApi";
import { GET_ACTIONS, DELETE_ACTION } from "~/api/queries";
import { parseDateOnly } from "~/utils/dateUtils";
import { format } from "date-fns";

export interface Action {
  id?: string;
  title: string;
  tbd?: Date;
  done?: boolean;
}



export default function ActionsListPage() {
  const [actions, setActions] = useState<Action[] | null>(null);
  const { call } = useApi();

  useEffect(() => {
    async function fetchActions() {
      call({ query: GET_ACTIONS }).then((res) => {
        const list = (res?.actions ?? []).map((a: any) => ({
          ...a,
          tbd: a.tbd ? parseDateOnly(a.tbd) : undefined,
          goal: a.project?.goal ?? undefined,
          milestone: a.project?.milestone ?? undefined,
        }));
        setActions(list);
      });
      // const { gql } = await import("@apollo/client");
      // const query = gql(GET_ACTIONS);
      // const res = await fetch("http://localhost:4000/graphql", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ query: query.loc?.source.body }),
      // });
      // let json = null;
      // try {
      //   json = await res.json();
      // } catch (err) {
      // }
    }

    fetchActions();
  }, []);

  const [hideCompleted, setHideCompleted] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  function toggleDone(id: string) {
    setActions((prev) =>
      (prev as Action[]).map((a) => (a.id === id ? { ...a, done: !a.done } : a))
    );
  }

  function deleteAction(id: string) {
    setActions((prev) => (prev as Action[]).filter((a) => a.id !== id));
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function deleteSelected() {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    try {
      await Promise.all(
        ids.map((id) => call({ query: DELETE_ACTION, variables: { id } }))
      );
      setActions((prev) => (prev as Action[]).filter((a) => a.id && !selectedIds.has(a.id)));
      setSelectedIds(new Set());
      setSelectionMode(false);
    } catch (err) {
      console.error("Failed to delete selected:", err);
    }
  }

  const sorted = [...(actions ?? [])].sort((a, b) => {
    if (!a.tbd) return -1;
    if (!b.tbd) return 1;
    const aTbd = parseDateOnly(a.tbd);
    const bTbd = parseDateOnly(b.tbd);
    return aTbd.getTime() - bTbd.getTime();
  });

  const visible = hideCompleted ? sorted.filter((a) => !a.done) : sorted;

  if (!actions) return <p>Loading...</p>;

  return (
    <InternalPageLayout
      backLink={{ to: "/activities", label: "← Back to Activities" }}
      title="Actions"
      actions={
        <Button size="sm" onClick={() => navigate("/activities/action")}>
          <Plus className="h-4 w-4 mr-2" /> Add Action
        </Button>
      }
    >
      <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Label htmlFor="hide-done">Hide Done</Label>
          <Switch id="hide-done" checked={hideCompleted} onCheckedChange={setHideCompleted} />
        </div>
        {!selectionMode ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectionMode(true);
              setSelectedIds(new Set());
            }}
          >
            Select
          </Button>
        ) : (
          <>
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} selected
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={deleteSelected}
              disabled={selectedIds.size === 0}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectionMode(false);
                setSelectedIds(new Set());
              }}
            >
              Done
            </Button>
          </>
        )}
      </div>

      <div className="space-y-4">
        {selectionMode ? (
          visible.map((action) => {
            const id = action.id ?? "";
            const selected = selectedIds.has(id);
            return (
              <div
                key={id}
                className="flex items-center gap-3 rounded-md border px-4 py-2 shadow-sm cursor-pointer hover:bg-muted/50"
                onClick={() => toggleSelected(id)}
              >
                <Checkbox
                  checked={selected}
                  onCheckedChange={() => toggleSelected(id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm line-clamp-1">{action.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {action.tbd
                      ? format(parseDateOnly(action.tbd), "MMM d, yyyy")
                      : "No date"}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          visible.map((action) => (
            <ActionPreview
              key={action.id}
              action={action}
              onDelete={deleteAction}
              onToggle={toggleDone}
            />
          ))
        )}
      </div>
      </div>
    </InternalPageLayout>
  );
}
