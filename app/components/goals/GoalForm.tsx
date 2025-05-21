import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { useApi } from "~/api/useApi";
import { ADD_GOAL } from "~/api/queries";

export default function GoalForm() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [dod, setDod] = useState("");
  const { call } = useApi(ADD_GOAL)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    

    const variables = { title, dod };

    try {
      call({ variables }).then(() => {
        navigate("/activities/goals");
      })
      // await fetch("http://localhost:4000/graphql", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ ADD_GOAL, variables }),
      // });

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
