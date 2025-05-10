import { Skeleton } from "~/components/ui/skeleton";
import { Button } from "~/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "react-router";
import type { ReactNode } from "react";

interface ActivityPanelProps {
  type: "habit" | "goal" | "project" | "action";
  title: string;
  preview1?: ReactNode;
  preview2?: ReactNode;
}

export default function ActivityPanel({
  type,
  title,
  preview1,
  preview2,
}: ActivityPanelProps) {
  const noPreview = !preview1 && !preview2;

  return (
    <section className="space-y-4 rounded-xl border p-4 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight text-muted-foreground">
        {title}
      </h2>

      {preview1 && <div>{preview1}</div>}
      {preview2 && <div>{preview2}</div>}

      {noPreview && (
        <div className="text-sm text-muted-foreground border rounded-md p-4 text-center">
          There's no active {type}.
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <Link to={`/activities/${type}`}>
          <Button variant="outline" size="icon">
            <Plus className="h-4 w-4" />
            <span className="sr-only">Add {title}</span>
          </Button>
        </Link>

        <Link to={`/activities/${type}s`} className="text-sm text-primary hover:underline">
          View All
        </Link>
      </div>
    </section>
  );
}
