import { useEffect, useState } from "react";
import { format, isToday, isBefore, isAfter } from "date-fns";
import { Checkbox } from "~/components/ui/checkbox";
import { Button } from "~/components/ui/button";
import { Trash2, CalendarClock, Plus } from "lucide-react";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { useNavigate } from "react-router";
import ActionPreview from "./ActionPreview";

export interface Action {
  id?: string;
  title: string;
  tbd?: Date;
  done?: boolean;
}

export const GET_ACTIONS = `
  query GetActions {
    actions {
      id
      title
      tbd
      done
    }
  }
`;

export default function ActionsListPage() {
  const [actions, setActions] = useState<Action[] | null>(null);

  useEffect(() => {
    async function fetchActions() {
      const { gql } = await import("@apollo/client");
      const query = gql(GET_ACTIONS);
      const res = await fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.loc?.source.body }),
      });
      let json = null;
      try {
        json = await res.json();
      } catch (err) {
        console.log('error');
        console.log(err);
      }
      setActions(json?.data?.actions ?? []);
    }

    fetchActions();
  }, []);

  const [hideCompleted, setHideCompleted] = useState(false);
  const navigate = useNavigate();

  function toggleDone(id: string) {
    setActions((prev) =>
      (prev as Action[]).map((a) => (a.id === id ? { ...a, done: !a.done } : a))
    );
  }

  function deleteAction(id: string) {
    setActions((prev) => (prev as Action[]).filter((a) => a.id !== id));
  }

  const sorted = [...(actions ?? [])].sort((a, b) => {
    if (!a.tbd) return -1;
    if (!b.tbd) return 1;
    const aTbd = new Date(+a.tbd);
    const bTbd = new Date(+b.tbd)
    return aTbd.getTime() - bTbd.getTime();
  });

  const visible = hideCompleted ? sorted.filter((a) => !a.done) : sorted;

  if (!actions) return <p>Loading...</p>;

  return (
    <main className="space-y-6 p-6">
      {/* <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Actions</h1>
        <Button size="sm" onClick={() => navigate("/activities/action")}> 
          <Plus className="h-4 w-4 mr-2" /> Add Action
        </Button>
      </div> */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Actions</h1>
          <Button size="sm" onClick={() => navigate("/activities/action")}>
            <Plus className="h-4 w-4 mr-2" /> Add Action
          </Button>
        </div>
        <button
          onClick={() => navigate("/activities")}
          className="text-sm text-primary hover:underline"
        >
          ← Back to Activities
        </button>
      </div>


      <div className="flex items-center gap-2">
        <Label htmlFor="hide-done">Hide Done</Label>
        <Switch id="hide-done" checked={hideCompleted} onCheckedChange={setHideCompleted} />
      </div>

      <div className="space-y-4">
        {visible.map((action) => (
          <ActionPreview key={action.id} action={action} onDelete={deleteAction} onToggle={toggleDone} />
        ))}
      </div>
    </main>
  );
}
