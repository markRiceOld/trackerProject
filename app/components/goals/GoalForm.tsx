import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";

export default function GoalForm() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [dod, setDod] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const query = 
      `
        mutation AddGoal($title: String!, $dod: String) {
          addGoal(title: $title, dod: $dod) {
            id
          }
        }
      `;

    const variables = { title, dod };

    try {
      await fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables }),
      });

      navigate("/activities/goals");
    } catch (err) {
      console.error("Failed to submit goal", err);
    }
  };

  return (
    <main className="space-y-6 p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight">
        New Goal
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder="Goal Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Input
          placeholder="Definition of Done (optional)"
          value={dod}
          onChange={(e) => setDod(e.target.value)}
        />

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
