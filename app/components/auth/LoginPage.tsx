import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { useAuth } from "./AuthContext";
import { useApi } from "~/api/useApi";
import { LOGIN_MUTATION } from "~/api/queries";



export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { call } = useApi(LOGIN_MUTATION);

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      call({ variables: {
        email,
        password,
      } }).catch(err => {
        setError(err || "Login failed")
      }).then(res => {
        const token = res.login.token;
        login(token);
        navigate(from, { replace: true });
      })
      // const res = await fetch("http://localhost:4000/graphql", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     query: LOGIN_MUTATION,
      //     variables: { email, password },
      //   }),
      // });

      // const json = await res.json();

      // if (json.errors) {
      //   setError(json.errors[0].message || "Login failed");
      //   return;
      // }

    } catch (err) {
      console.error(err);
      setError("Something went wrong. Try again.");
    }
  };

  return (
    <main className="p-6 max-w-sm mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Login</h1>
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
        {error && <div className="text-sm text-red-500">{error}</div>}
        <Button type="submit" className="w-full">
          Login
        </Button>
      </form>
      <Button variant="link" className="text-yellow-600">
        <Link to="/register">Register</Link>
      </Button>
    </main>
  );
}
