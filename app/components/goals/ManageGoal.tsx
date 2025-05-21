import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Progress } from "~/components/ui/progress";
import { Badge } from "~/components/ui/badge";
import ProjectPreview, { type ProjectPreviewProps } from "../projects/ProjectPreview";
import { getGoalStatus } from "./GoalPreview";
import { replacePlaceholders } from "~/api/utils";
import { useApi } from "~/api/useApi";
import { DELETE_PROJECT, GET_GOAL, UPDATE_GOAL } from "~/api/queries";

export default function ManageGoalPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [goal, setGoal] = useState<any>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDod, setEditingDod] = useState(false);
  const [tempTitle, setTempTitle] = useState("");
  const [tempDod, setTempDod] = useState("");
  const { call } = useApi();

  useEffect(() => {
    async function fetchGoal() {
      call({ query: GET_GOAL, variables: { id } }).then(res => {
        const data = res.goal;
  
        const parsed = {
          ...data,
          startDate: data.startDate ? new Date(data.startDate) : null,
          endDate: data.endDate ? new Date(data.endDate) : null,
          projects: data.projects.map((p: ProjectPreviewProps) => ({
            ...p,
            startDate: p.startDate ? new Date(p.startDate) : null,
            endDate: p.endDate ? new Date(p.endDate) : null,
            done: p.actions.every((a) => a.done),
          })),
        };
  
        setGoal(parsed);
        setTempTitle(parsed.title);
        setTempDod(parsed.dod || "");
      })
      // const res = await fetch("http://localhost:4000/graphql", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     query: GET_GOAL,
      //     variables: { id },
      //   }),
      // });

      // const json = await res.json();
    }

    fetchGoal();
  }, [id]);

  const updateGoalField = async (field: string, value: string) => {
    call({
      query: replacePlaceholders(UPDATE_GOAL, [field]),
      variables: { id, [field]: value },  
    }).then(() => {
      setGoal((prev: any) => ({ ...prev, [field]: value }));
    })
    // await fetch("http://localhost:4000/graphql", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({
    //   }),
    // });
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Delete this project?")) return;
    call({
      query: DELETE_PROJECT,
      variables: { id: projectId },
    }).then(() => {
      setGoal((prev: any) => ({
        ...prev,
        projects: prev.projects.filter((p: ProjectPreviewProps) => p.id !== projectId),
      }));
    })
    // await fetch("http://localhost:4000/graphql", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({
    //   }),
    // });
  };

  if (!goal) return <p className="p-6">Loading...</p>;

  const total = goal.projects.length;
  const done = goal.projects.filter((p: ProjectPreviewProps) => p.actions.every(a => a.done)).length;
  const status = getGoalStatus(goal);

  return (
    <main className="space-y-6 p-6">
      <Button variant="ghost" onClick={() => navigate("/activities/goals")}>⟵ Back to Goals</Button>

      <div className="space-y-2">
        <div className="flex items-center gap-4">
          {editingTitle ? (
            <Input
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={() => { setEditingTitle(false); updateGoalField("title", tempTitle); }}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              className="text-2xl font-bold"
            />
          ) : (
            <h1
              className="text-2xl font-bold cursor-pointer"
              onClick={() => setEditingTitle(true)}
            >
              {goal.title}
            </h1>
          )}

          <Badge variant="outline">{status}</Badge>
        </div>

        {editingDod ? (
          <Input
            value={tempDod}
            onChange={(e) => setTempDod(e.target.value)}
            onBlur={() => { setEditingDod(false); updateGoalField("dod", tempDod); }}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            placeholder="Definition of Done (optional)"
          />
        ) : (
          <p
            className="text-muted-foreground cursor-pointer"
            onClick={() => setEditingDod(true)}
          >
            {goal.dod || "Click to add definition of done"}
          </p>
        )}

        <p className="text-sm text-muted-foreground">
          {goal.startDate && goal.endDate ? (
            <>From {goal.startDate.toDateString()} to {goal.endDate.toDateString()}</>
          ) : (
            <>No scheduled timeline</>
          )}
        </p>

        <Progress value={(done / Math.max(total, 1)) * 100} />
      </div>

      <div className="flex justify-between items-center pt-4">
        <h2 className="text-lg font-semibold">Projects</h2>
        <Button size="sm" onClick={() => navigate(`/activities/project?goalId=${id}`)}>
          + Add Project
        </Button>
      </div>

      {goal.projects.length === 0 ? (
        <p className="text-muted-foreground">No projects yet. Add one to get started.</p>
      ) : (
        <div className="space-y-4">
          {goal.projects.map((project: any) => (
            <ProjectPreview
              key={project.id}
              {...project}
              showControls
              onDelete={() => handleDeleteProject(project.id)}
              onManage={() => navigate(`/activities/project/${project.id}?goalId=${id}`)}
            />
          ))}
        </div>
      )}
    </main>
  );
}
