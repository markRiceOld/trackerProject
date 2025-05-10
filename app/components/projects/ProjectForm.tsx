import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Calendar } from "~/components/ui/calendar";
import ActionPreview from "../actions/ActionPreview";

export default function ProjectForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [title, setTitle] = useState("");
  const [dod, setDod] = useState("");
  const [actions, setActions] = useState<any[]>([]);
  const [addingAction, setAddingAction] = useState(false);
  const [newActionTitle, setNewActionTitle] = useState("");
  const [newActionDate, setNewActionDate] = useState<Date | undefined>();

  const [newActions, setNewActions] = useState<any[]>([]);
  const [deletedActionIds, setDeletedActionIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isEdit) return;

    async function fetchProject() {
      const res = await fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            query GetProject($id: ID!) {
              project(id: $id) {
                id
                title
                dod
                actions {
                  id
                  title
                  done
                  tbd
                }
              }
            }
          `,
          variables: { id },
        }),
      });

      const json = await res.json();
      const data = json.data.project;
      setTitle(data.title);
      setDod(data.dod ?? "");
      setActions(
        data.actions.map((a: any) => ({
          ...a,
          tbd: a.tbd ? new Date(+a.tbd) : undefined,
        }))
      );
    }

    fetchProject();
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // 1. Create or update the project
      const query = isEdit
        ? `
          mutation UpdateProject($id: ID!, $title: String, $dod: String) {
            updateProject(id: $id, title: $title, dod: $dod) {
              id
            }
          }
        `
        : `
          mutation AddProject($title: String!, $dod: String, $actions: [ActionInput!]) {
            addProject(title: $title, dod: $dod, actions: $actions) {
              id
            }
          }
        `;

      const variables: any = isEdit
        ? { id, title, dod }
        : {
            title,
            dod,
            actions: [...actions, ...newActions].map((a) => ({
              title: a.title,
              tbd: a.tbd ? a.tbd.toISOString() : null,
            })),
          };

      const response = await fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) throw new Error("Failed to save project");

      // 2. If edit, handle actions
      if (isEdit) {
        await Promise.all([
          ...newActions.map((a) =>
            fetch("http://localhost:4000/graphql", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                query: `
                  mutation AddAction($title: String!, $tbd: String, $projectId: String) {
                    addAction(title: $title, tbd: $tbd, projectId: $projectId) {
                      id
                    }
                  }
                `,
                variables: {
                  title: a.title,
                  tbd: a.tbd ? a.tbd.toISOString() : null,
                  projectId: id,
                },
              }),
            })
          ),
          ...deletedActionIds.map((actionId) =>
            fetch("http://localhost:4000/graphql", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                query: `
                  mutation DeleteAction($id: ID!) {
                    deleteAction(id: $id) {
                      id
                    }
                  }
                `,
                variables: { id: actionId },
              }),
            })
          ),
        ]);
      }

      navigate("/activities/projects");
    } catch (err) {
      console.error("Failed to submit project", err);
    }
  };

  const handleAddAction = () => {
    if (!newActionTitle) return;
    const newAction = { title: newActionTitle, tbd: newActionDate, done: false };
    setActions((prev) => [...prev, newAction]);
    setNewActions((prev) => [...prev, newAction]);
    setNewActionTitle("");
    setNewActionDate(undefined);
    setAddingAction(false);
  };

  const handleDeleteAction = (index: number) => {
    const toDelete = actions[index];
    if (toDelete?.id) setDeletedActionIds((prev) => [...prev, toDelete.id]);
    setActions((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <main className="space-y-6 p-6">
      <h1 className="text-2xl font-bold tracking-tight">
        {isEdit ? "Edit Project" : "New Project"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder="Project Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Input
          placeholder="Definition of Done (optional)"
          value={dod}
          onChange={(e) => setDod(e.target.value)}
        />

        {actions.map((a, i) => (
          <div key={i} className="relative">
            <ActionPreview action={a} onDelete={() => { handleDeleteAction(i) }} />
          </div>
        ))}

        {addingAction ? (
          <div className="space-y-2">
            <Input
              placeholder="Action Title"
              value={newActionTitle}
              onChange={(e) => setNewActionTitle(e.target.value)}
            />
            <Calendar
              mode="single"
              selected={newActionDate}
              onSelect={setNewActionDate}
              className="border rounded-md w-full max-w-xs text-sm"
            />
            <div className="flex gap-2">
              <Button type="button" onClick={handleAddAction}>Submit</Button>
              <Button type="button" variant="ghost" onClick={() => setAddingAction(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button type="button" variant="outline" onClick={() => setAddingAction(true)}>
            Add Action
          </Button>
        )}

        <div className="space-y-1 pt-4 text-sm text-muted-foreground">
          <div>Status: {actions.length === 0 ? "Backlog" : "Depends on actions"}</div>
          <div>Type: Individual</div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit">Submit</Button>
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </main>
  );
}
