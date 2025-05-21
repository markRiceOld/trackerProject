import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { Plus } from "lucide-react";
import ProjectPreview, { type ProjectPreviewProps, getProjectStatus } from "./ProjectPreview";
import { useApi } from "../../api/useApi";
import { GET_PROJECTS } from "~/api/queries";

function getFirstTbdAction(actions: ProjectPreviewProps["actions"]): ProjectPreviewProps["firstTbdAction"] | undefined {
  return [...actions]
    .filter((a) => a.tbd && !a.done)
    .sort((a, b) => +a.tbd! - +b.tbd!)[0];
}

export default function ProjectsListPage() {
  const [projects, setProjects] = useState<ProjectPreviewProps[] | null>(null);
  const [hideDone, setHideDone] = useState(false);
  const navigate = useNavigate();
  const { call } = useApi(GET_PROJECTS);

  useEffect(() => {
    async function fetchProjects() {
      call({ variables: { id: "projectId123" } }).then((res) => {
        const data = res?.projects ?? [];
        const parsed = data.map((project: any) => ({
          ...project,
          actions: project.actions.map((a: any) => ({
            ...a,
            tbd: a.tbd ? new Date(+a.tbd) : undefined,
          })),
          goalTitle: project.goal?.title ?? undefined,
        }));
        setProjects(parsed)
      });
    }

    fetchProjects();
  }, []);

  if (!projects) return <p className="p-6">Loading...</p>;

  const visibleProjects = hideDone
    ? projects.filter((p) => getProjectStatus(p) !== "Done")
    : projects;

  return (
    <main className="space-y-6 p-6">
      <div className="flex items-center justify-between flex-wrap">
        <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
        <Button size="sm" onClick={() => navigate("/activities/project")}>
          <Plus className="h-4 w-4 mr-2" /> Add Project
        </Button>
        <Button
          size='sm'
          variant="link"
          onClick={() => navigate("/activities")}
          className="!p-0 font-light"
        >
          ← Back to Activities
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Label htmlFor="hide-done">Hide Done</Label>
        <Switch id="hide-done" checked={hideDone} onCheckedChange={setHideDone} />
      </div>

      <div className="space-y-4">
        {visibleProjects.map((project, i) => (
          <ProjectPreview
            key={project.id ?? i}
            {...project}
            showControls
            onDelete={(id) => { setProjects(prev => prev?.filter(i => i.id !== id) ?? []) }}
            firstTbdAction={getFirstTbdAction(project.actions)}
            goalTitle={project.goalTitle}
          />
        ))}
      </div>
    </main>
  );
}

export const mockProjects: ProjectPreviewProps[] = [
  {
    title: "Redesign landing page",
    id: "some-id34-5555-uyti-1123",
    dod: "All sections implemented and reviewed",
    startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    actions: [
      { id: "a1", done: true, title: "a1", tbd: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { id: "a2", done: false, title: "a2", tbd: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) },
      { id: "a3", done: false, title: "a3", tbd: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) },
    ],
  },
  {
    title: "Write blog series",
    id: "some-id34-5555-uyti-1125",
    dod: "3-part post complete",
    startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    actions: [
      { id: "b1", done: false, title: "b1", tbd: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) },
      { id: "b2", done: false, title: "b2", tbd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
    ],
  },
  {
    title: "Refactor authentication flow",
    id: "some-id34-5555-uyti-1127",
    actions: [
      { id: "c1", done: false, title: "c1" },
    ],
  },
  {
    title: "Launch MVP",
    id: "some-id34-5555-uyti-1129",
    dod: "All core features launched",
    startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    actions: [
      { id: "d1", done: true, title: "d1", tbd: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
      { id: "d2", done: false, title: "d2", tbd: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { id: "d3", done: false, title: "d3", tbd: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    ],
  },
  {
    title: "Clean out email inbox",
    id: "some-id34-5555-uyti-1128",
    dod: "Inbox zero achieved",
    startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    actions: [
      { id: "e1", done: true, title: "e1", tbd: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
      { id: "e2", done: true, title: "e2", tbd: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    ],
  },
];
