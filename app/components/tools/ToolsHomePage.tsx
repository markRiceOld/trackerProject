import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";

export default function ToolsHomePage() {
  const navigate = useNavigate();

  return (
    <main className="space-y-8 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Tools</h1>

      <section className="rounded-lg border bg-card p-5">
        <div className="mb-4 space-y-1">
          <h2 className="text-lg font-semibold">Time Map</h2>
          <p className="text-sm text-muted-foreground">
            Plan selected actions into a chosen date range.
          </p>
        </div>
        <Button onClick={() => navigate("/tools/time-map")}>
          Open Time Map
        </Button>
      </section>
    </main>
  );
}
