import { useNavigate } from "react-router";
import UnderConstruction from "../UnderConstruction";
import { Button } from "../ui/button";
import { useAuth } from "../auth/AuthContext";

export default function SettingsPage() {
  const navigate = useNavigate();
  const auth = useAuth();

  const handleLogout = () => {
    // Clear whatever you use for auth
    // localStorage.removeItem("token"); // or sessionStorage, etc.
    // optionally: clear any global auth context
    // redirect to login
    auth.logout();
    navigate("/login");
  };
  return (
    <main className="space-y-8 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      {/* Section 5: Focus Mode Button Skeleton */}
      <section className="space-y-4">
        {/* <Skeleton className="h-12 w-full rounded-full" /> */}
        <UnderConstruction title="Settings" />
      <Button variant="default" onClick={handleLogout}>
        Log out
      </Button>
      </section>
    </main>
  );
}
