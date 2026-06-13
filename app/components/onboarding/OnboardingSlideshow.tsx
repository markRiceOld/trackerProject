import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { useApi } from "~/api/useApi";
import { GET_ONBOARDING_PROGRESS, MARK_SLIDE_VIEWED } from "~/api/queries";
import { Button } from "~/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const TOTAL_SLIDES = 6;

export default function OnboardingSlideshow() {
  const { t } = useTranslation();
  const { call } = useApi();
  const [loaded, setLoaded] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    call({ query: GET_ONBOARDING_PROGRESS }).then((res: any) => {
      const progress = res?.onboardingProgress;
      if (progress?.completedAt) {
        setCompleted(true);
      } else if (progress?.lastSlideViewed != null) {
        setCurrent(Math.min(progress.lastSlideViewed + 1, TOTAL_SLIDES - 1));
      }
      setLoaded(true);
    });
  }, []);

  if (!loaded || completed || dismissed) return null;

  const isFirst = current === 0;
  const isLast = current === TOTAL_SLIDES - 1;

  const handleNext = async () => {
    await call({ query: MARK_SLIDE_VIEWED, variables: { slideIndex: current } });
    if (isLast) {
      setCompleted(true);
    } else {
      setCurrent((c) => c + 1);
    }
  };

  const handlePrev = () => setCurrent((c) => Math.max(0, c - 1));
  const handleClose = () => setDismissed(true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border bg-background shadow-2xl mx-4 overflow-hidden">
        {/* Close (session-only) */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={t("onboarding.nav.closeForNow")}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Progress bar */}
        <div className="flex gap-1 px-6 pt-6">
          {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${
                i < current ? "bg-primary" : i === current ? "bg-primary/70" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Slide content */}
        <div className="px-6 pt-5 pb-2 min-h-64">
          <p className="text-xs font-medium text-muted-foreground mb-3">
            {t("onboarding.nav.slideOf", { current: current + 1, total: TOTAL_SLIDES })}
          </p>
          <SlideContent current={current} t={t} />
        </div>

        {/* Navigation */}
        {!isLast && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <Button variant="ghost" size="sm" onClick={handlePrev} disabled={isFirst}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t("onboarding.nav.previous")}
            </Button>
            <Button size="sm" onClick={handleNext}>
              {t("onboarding.nav.next")}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Last slide CTAs */}
        {isLast && (
          <div className="flex flex-col gap-2 px-6 py-4 border-t">
            <Link to="/goals/new" onClick={() => setCompleted(true)}>
              <Button className="w-full">{t("onboarding.slides.5.ctaGoal")}</Button>
            </Link>
            <Link to="/concepts" onClick={() => setCompleted(true)}>
              <Button variant="outline" className="w-full">
                {t("onboarding.slides.5.ctaGuide")}
              </Button>
            </Link>
            <button
              type="button"
              onClick={handleNext}
              className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline py-1"
            >
              {t("onboarding.slides.5.ctaToday")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SlideContent({ current, t }: { current: number; t: (key: string, opts?: any) => string }) {
  switch (current) {
    case 0:
      return (
        <>
          <h2 className="text-xl font-bold mb-3">{t("onboarding.slides.0.title")}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{t("onboarding.slides.0.body")}</p>
        </>
      );
    case 1:
      return (
        <>
          <h2 className="text-xl font-bold mb-3">{t("onboarding.slides.1.title")}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{t("onboarding.slides.1.body")}</p>
        </>
      );
    case 2:
      return (
        <>
          <h2 className="text-xl font-bold mb-3">{t("onboarding.slides.2.title")}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">{t("onboarding.slides.2.body")}</p>
          <pre className="font-mono text-xs bg-muted/40 rounded-md p-3 leading-relaxed select-none">
{`Goal
 └─ Milestone
     └─ Project
         └─ Action`}
          </pre>
        </>
      );
    case 3:
      return (
        <>
          <h2 className="text-xl font-bold mb-3">{t("onboarding.slides.3.title")}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{t("onboarding.slides.3.body")}</p>
        </>
      );
    case 4:
      return (
        <>
          <h2 className="text-xl font-bold mb-2">{t("onboarding.slides.4.title")}</h2>
          <p className="text-sm text-muted-foreground mb-3">{t("onboarding.slides.4.intro")}</p>
          <div className="space-y-2.5">
            {(["1", "2", "3"] as const).map((n) => (
              <div key={n} className="rounded-lg bg-muted/40 px-3 py-2">
                <p className="text-xs font-semibold mb-0.5">{t(`onboarding.slides.4.step${n}Title`)}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{t(`onboarding.slides.4.step${n}Body`)}</p>
              </div>
            ))}
          </div>
        </>
      );
    case 5:
      return (
        <>
          <h2 className="text-xl font-bold mb-3">{t("onboarding.slides.5.title")}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{t("onboarding.slides.5.body")}</p>
        </>
      );
    default:
      return null;
  }
}
