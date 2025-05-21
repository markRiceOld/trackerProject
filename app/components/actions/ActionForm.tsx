import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { format, isToday, isBefore, isAfter } from "date-fns";
import { Calendar } from "~/components/ui/calendar";
import { Badge } from "~/components/ui/badge";
import { ADD_ACTION, UPDATE_ACTION } from "~/api/queries";
import { useApi } from "~/api/useApi";

export default function ActionForm() {
  const { id } = useParams();
  const [title, setTitle] = useState("");
  const [tbd, setTbd] = useState<Date | undefined>(undefined);
  const navigate = useNavigate();
  const { call } = useApi();

  const isEdit = Boolean(id);

  useEffect(() => {
    if (isEdit) {
      // Simulate API call to fetch existing action
      const mock = { title: "Mock action title", tbd: new Date() };
      setTitle(mock.title);
      setTbd(mock.tbd);
    }
  }, [isEdit]);

  function getStatus(): string {
    if (!tbd) return "Backlog";
    if (isToday(tbd)) return "In Progress";
    if (isBefore(tbd, new Date())) return "Ignored";
    if (isAfter(tbd, new Date())) return "TBD";
    return "";
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case "Backlog":
        return "bg-gray-100 text-gray-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Ignored":
        return "bg-yellow-100 text-yellow-800";
      case "TBD":
        return "bg-purple-100 text-purple-800";
      default:
        return "";
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    try {
      const isEditing = isEdit && id;
  
      const mutation = isEditing
        ? UPDATE_ACTION
        : ADD_ACTION;
  
      const variables = isEditing
        ? {
            id,
            title,
            tbd: tbd ? tbd.toISOString() : null,
            done: false,
          }
        : {
            title,
            tbd: tbd ? tbd.toISOString() : null,
          };
  
      call({ query: mutation, variables }).catch(err => {
        throw new Error(err);
      }).then(() => {
        navigate("/activities/actions");
      })

  
    } catch (error) {
      console.error("Failed to submit action:", error);
    }
  };
  

  function handleCancel() {
    navigate("/activities/actions");
  }

  const status = getStatus();
  const statusColor = getStatusColor(status);

  return (
    <main className="space-y-6 p-6">
      <h1 className="text-2xl font-bold tracking-tight">
        {isEdit ? "Edit Action" : "Add Action"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Action title"
          />
        </div>

        <div className="space-y-2">
          <Label>TBD Date</Label>
          <Calendar mode="single" selected={tbd} onSelect={setTbd} className="border rounded-md w-fit min-w-fit" />
        </div>

        <div className="space-y-1">
          <Label>Status</Label>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            {tbd ? format(tbd, "MMM d, yyyy") : "No Date"}
            <Badge className={statusColor}>{status}</Badge>
          </div>
          <Button type="submit" className="w-full mt-3">
            {isEdit ? "Update Action" : "Create Action"}
          </Button>
          <Button type="button" variant="outline" className="w-full mt-3" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </main>
  );
}
