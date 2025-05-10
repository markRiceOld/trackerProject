// components/UnderConstruction.tsx
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Info } from "lucide-react";

export default function UnderConstruction({ title = "Feature" }: { title?: string }) {
  return (
    <Alert className="border-l-4 border-yellow-400 bg-yellow-50">
      <Info className="h-4 w-4" />
      <AlertTitle>{title} Under Construction</AlertTitle>
      <AlertDescription>
        This part of the app is not ready yet. Please check back later.
      </AlertDescription>
    </Alert>
  );
}
