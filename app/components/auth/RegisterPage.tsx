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
  const { call, getLastError, loading } = useApi(REGISTER_MUTATION);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const res = await call({ variables: { email, password } });

      if (!res?.register) {
        setError(getLastError() || "Registration failed. Please try again.");
        return;
      }

      const { token } = res.register;
      login(token);
      navigate(fromPath, { replace: true });
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please try again.");
      console.error(err);
    }
  };

  return (
    <main className="p-6 max-w-sm mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Register</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={1}
          autoComplete="new-password"
        />
        <Input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={1}
          autoComplete="new-password"
        />
        {error && <div className="text-sm text-red-500">{error}</div>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Registering…" : "Register"}
        </Button>
      </form>
      <Button variant="link" className="text-yellow-700">
        <Link to="/login">Log In</Link>
      </Button>
    </main>
  );
}
