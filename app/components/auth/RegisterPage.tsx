import { useState } from "react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { useAuth } from "./AuthContext";
import { Link, useLocation, useNavigate } from "react-router";
import { useApi } from "~/api/useApi";
import { REGISTER_MUTATION } from "~/api/queries";



export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = location.state?.from?.pathname || "/today";
  const { call } = useApi(REGISTER_MUTATION)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      call({ variables: { email, password } }).then(res => {
        const { token } = res.register;
        login(token);
        navigate(fromPath, { replace: true });
        window.location.href = "/today";
      })
      // const res = await fetch("http://localhost:4000/graphql", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     query: REGISTER_MUTATION,
      //     variables: { email, password },
      //   }),
      // });

      // const json = await res.json();
    } catch (err: any) {
      setError("Registration failed.");
      console.error(err);
    }
  };

  return (
    <main className="p-6 max-w-sm mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Register</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {error && <div className="text-sm text-red-500">{error}</div>}
        <Button type="submit" className="w-full">
          Register
        </Button>
      </form>
      <Button variant="link" className="text-yellow-700">
        <Link to="/login">Log In</Link>
      </Button>
    </main>
  );
}
