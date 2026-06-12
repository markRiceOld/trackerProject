import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "~/components/ui/button";
import { Plus } from "lucide-react";
import InternalPageLayout from "~/layout/InternalPageLayout";
import IntervalPreview, { type IntervalPreviewProps } from "./IntervalPreview";
import RoutinePreview, { type RoutinePreviewProps } from "./RoutinePreview";
import { useApi } from "~/api/useApi";
import { GET_INTERVALS, GET_ROUTINES } from "~/api/queries";

type ScheduleItem =
  | { kind: "interval"; data: IntervalPreviewProps }
  | { kind: "routine"; data: RoutinePreviewProps };

export default function IntervalsListPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<ScheduleItem[] | null>(null);
  const navigate = useNavigate();
  const { call } = useApi();

  useEffect(() => {
    Promise.all([
      call({ query: GET_INTERVALS }).then((res) => res?.intervals ?? []),
      call({ query: GET_ROUTINES }).then((res) => res?.routines ?? []),
    ]).then(([intervals, routines]) => {
      const list: ScheduleItem[] = [
        ...(intervals as IntervalPreviewProps[]).map((iv) => ({ kind: "interval" as const, data: iv })),
        ...(routines as RoutinePreviewProps[]).map((r) => ({ kind: "routine" as const, data: r })),
      ];
      setItems(list);
    });
  }, []);

  const removeItem = (kind: "interval" | "routine", id: string) => {
    setItems((prev) => prev?.filter((x) => x.kind !== kind || x.data.id !== id) ?? []);
  };

  if (!items) return <p className="p-6">{t("common.loading")}</p>;

  return (
    <InternalPageLayout
      backLink={{ to: "/activities", label: `← ${t("activities.backToActivities")}` }}
      title={t("intervalsList.title")}
      actions={
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => navigate("/activities/interval")}>
            <Plus className="h-4 w-4 mr-2" /> {t("intervalsList.addInterval")}
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate("/activities/routine")}>
            <Plus className="h-4 w-4 mr-2" /> {t("intervalsList.addRoutine")}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {t("intervalsList.noIntervals")}
          </p>
        ) : (
          items.map((item, i) =>
            item.kind === "interval" ? (
              <IntervalPreview
                key={`interval-${item.data.id ?? i}`}
                {...item.data}
                showControls
                onDelete={(id) => removeItem("interval", id)}
              />
            ) : (
              <RoutinePreview
                key={`routine-${item.data.id ?? i}`}
                {...item.data}
                showControls
                onDelete={(id) => removeItem("routine", id)}
              />
            )
          )
        )}
      </div>
    </InternalPageLayout>
  );
}
