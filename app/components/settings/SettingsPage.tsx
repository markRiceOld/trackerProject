import { useNavigate } from "react-router";
import UnderConstruction from "../UnderConstruction";
import { Button } from "../ui/button";
import { useAuth } from "../auth/AuthContext";
import { useTranslation } from "react-i18next";
import { setLanguage, type AppLanguage } from "~/i18n/config";

export default function SettingsPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const { t, i18n } = useTranslation();

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
      <h1 className="text-2xl font-bold tracking-tight">{t("settings.title")}</h1>
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">{t("language.switcherLabel")}</h2>
        <div className="flex items-center gap-2">
          <Button
            variant={i18n.language === "en" ? "default" : "outline"}
            size="sm"
            onClick={() => void setLanguage("en" as AppLanguage)}
          >
            {t("language.english")}
          </Button>
          <Button
            variant={i18n.language === "fa" ? "default" : "outline"}
            size="sm"
            onClick={() => void setLanguage("fa" as AppLanguage)}
          >
            {t("language.persian")}
          </Button>
        </div>
      </section>
      <section className="space-y-4">
        <UnderConstruction title={t("settings.underConstruction")} />
      <Button variant="default" onClick={handleLogout}>
        {t("settings.logout")}
      </Button>
      </section>
    </main>
  );
}
