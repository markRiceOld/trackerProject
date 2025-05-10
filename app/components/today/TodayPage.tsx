import { Skeleton } from "~/components/ui/skeleton";
import TodayActionWidget from "./TodayActionWidget";
import UnderConstruction from "../UnderConstruction";
import { useState, useEffect } from "react";

export default function TodayPage() {
  const [linkedActions, setLinkedActions] = useState<any[] | null>(null);
  const [standaloneActions, setStandaloneActions] = useState<any[] | null>(null);
  const [laLoading, setLaLoading] = useState(true);
  const [saLoading, setSaLoading] = useState(true);

  useEffect(() => {
    const todayISO = new Date().toISOString().split("T")[0]; // e.g. "2025-05-09"

    async function fetchLinkedActions() {
      const res = await fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            query GetLinkedActions($date: String!) {
              linkedActions(date: $date) {
                id
                title
                tbd
                done
                project {
                  id
                  title
                }
              }
            }
          `,
          variables: { date: todayISO },
        }),
      });

      const json = await res.json();
      setLinkedActions(json.data?.linkedActions ?? []);
      setLaLoading(false);
    }

    async function fetchStandaloneActions() {
      const res = await fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            query GetStandaloneActions($date: String!) {
              standaloneActions(date: $date) {
                id
                title
                tbd
                done
              }
            }
          `,
          variables: { date: todayISO },
        }),
      });

      const json = await res.json();
      setStandaloneActions(json.data?.standaloneActions ?? []);
      setSaLoading(false);
    }

    fetchLinkedActions();
  }, []);

  const renderLinkedActions = () => {
    if (laLoading)
      return (
        <>
          <Skeleton className="h-16 w-full rounded-md" />
          <Skeleton className="h-16 w-full rounded-md" />
        </>
      );
    if (!linkedActions?.length)
      return (
        <p className="text-muted-foreground">No linked actions for today.</p>
      )
    return(
      <ul className="space-y-2">
        {linkedActions.map((action) => (
          <li key={action.id} className="border p-3 rounded-md">
            <div className="flex justify-between items-center">
              <span>{action.title}</span>
              <span className="text-sm text-muted-foreground">
                from {action.project.title}
              </span>
            </div>
          </li>
        ))}
      </ul>
    )
  }

  const renderStandaloneActions = () => {
    if (laLoading)
      return (
        <>
          <Skeleton className="h-16 w-full rounded-md" />
        </>
      );
    if (!standaloneActions?.length)
      return (
        <p className="text-muted-foreground">No standalone actions for today.</p>
      )
    return(
      <ul className="space-y-2">
        {standaloneActions.map((action) => (
          <li key={action.id} className="border p-3 rounded-md">
            <div className="flex justify-between items-center">
              <span>{action.title}</span>
            </div>
          </li>
        ))}
      </ul>
    )
  }


  return (
    <main className="space-y-8 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Today</h1>

      {/* Section 1: Linked Actions Skeleton */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-muted-foreground">Linked Actions</h2>
        {renderLinkedActions()}
      </section>

      {/* Section 2: Standalone Actions Skeleton */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-muted-foreground">Standalone Actions</h2>
        <TodayActionWidget />
      </section>

      {/* Section 3: Mood Tracker Widget Skeleton */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-muted-foreground">Mood Tracker</h2>
        {/* <Skeleton className="h-24 w-full rounded-md" /> */}
        <UnderConstruction title="Mood tracker" />
      </section>

      {/* Section 4: Journal/Log Widget Skeleton */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-muted-foreground">Journal</h2>
        {/* <Skeleton className="h-24 w-full rounded-md" /> */}
        <UnderConstruction title="Journal" />
      </section>

      {/* Section 5: Focus Mode Button Skeleton */}
      <section className="space-y-4">
        {/* <Skeleton className="h-12 w-full rounded-full" /> */}
        <UnderConstruction title="Focus mode" />
      </section>
    </main>
  );
}
