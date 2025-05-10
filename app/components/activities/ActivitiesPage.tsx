import ActivityPanel from "~/components/activities/ActivityPanel";
import ActionPreview from "../actions/ActionPreview";
import { useEffect, useState, type ReactNode, useCallback } from "react";
import { GET_PROJECTS } from "../projects/ProjectsListPage";
import ProjectPreview, { type Project } from "../projects/ProjectPreview";
import { GET_ACTIONS, type Action } from "../actions/ActionsListPage";
import { GET_GOALS } from "../goals/GoalsListPage";
import type { Goal } from "../goals/GoalPreview";
import GoalPreview from "../goals/GoalPreview";

export default function ActivitiesPage() {
  const [actions, setActions] = useState<Action[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    async function fetchActions() {
      const { gql } = await import("@apollo/client");
      const query = gql(GET_ACTIONS);
      const res = await fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.loc?.source.body }),
      });
      const json = await res.json();
      setActions(json?.data?.actions ?? []);
    }
    async function fetchProjects() {
      const { gql } = await import("@apollo/client");
      const query = gql(GET_PROJECTS);
      const res = await fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.loc?.source.body }),
      });
      const json = await res.json();
      setProjects(json?.data?.projects ?? []);
    }
    async function fetchGoals() {
      const { gql } = await import("@apollo/client");
      const query = gql(GET_GOALS);
      const res = await fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.loc?.source.body }),
      });
      const json = await res.json();
      setGoals(json?.data?.goals ?? []);
    }

    fetchActions();
    fetchProjects();
    fetchGoals();
  }, []);

  const updateActions = (next: Action[]) => {
    setActions(next.filter((a) => !a.done));
  };

  const handleDeleteAction = async (id: string) => {
    updateActions(actions.filter((a) => a.id !== id));
  };

  const handleToggleDone = async (id: string, done: boolean) => {
    setActions(prev => prev.map((a) =>
    a.id === id ? { ...a, done } : a
  )); // <-- keep all actions, even done ones
  };
  

  const renderActionPreviews = useCallback(() => {
    const visible = actions.filter((a) => !a.done);
    console.log(actions)
    console.log(visible)
    const result: { preview1?: ReactNode; preview2?: ReactNode } = {};
    if (visible[0]) {
      console.log(visible[0].done)
      result.preview1 = (
        <ActionPreview
          action={visible[0]}
          onDelete={() => handleDeleteAction(visible[0].id ?? '')}
          onToggle={() => handleToggleDone(visible[0].id ?? '', true)}
        />
      );
    }
    if (visible[1]) {
      console.log(visible[1].done)
      result.preview2 = (
        <ActionPreview
          action={visible[1]}
          onDelete={() => handleDeleteAction(visible[1].id ?? '')}
          onToggle={() => handleToggleDone(visible[1].id ?? '', true)}
        />
      );
    }
    return result;
  }, [actions])

  const renderProjectPreviews = () => {
    if (!projects?.[0]) return {};
    const result: { preview1?: ReactNode; preview2?: ReactNode } = {};
    result.preview1 = <ProjectPreview showControls {...projects[0]} />;
    if (projects[1]) result.preview2 = <ProjectPreview showControls {...projects[1]} />;
    return result;
  };

  const renderGoalPreviews = () => {
    if (!goals?.[0]) return {};
    const result: { preview1?: ReactNode; preview2?: ReactNode } = {};
    result.preview1 = <GoalPreview showControls {...goals[0]} />;
    if (goals[1]) result.preview2 = <GoalPreview showControls {...goals[1]} />;
    return result;
  };

  return (
    <main className="space-y-6 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Activities</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <ActivityPanel type="habit" title="Habits" />
        <ActivityPanel type="goal" title="Goals" {...renderGoalPreviews()} />
        <ActivityPanel type="project" title="Projects" {...renderProjectPreviews()} />
        <ActivityPanel type="action" title="Actions" {...renderActionPreviews()} />
      </div>

      <div className="pt-6">
        <a
          href="/activities/all"
          className="text-sm font-medium text-primary hover:underline"
        >
          View All Activities
        </a>
      </div>
    </main>
  );
}
