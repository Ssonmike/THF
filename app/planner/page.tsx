import { DayOfWeek, MealType } from "@prisma/client";
import { duplicatePreviousWeekAction } from "@/app/planner/actions";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlannerForm } from "@/components/planner/PlannerForm";
import { PlannerGrid } from "@/components/planner/PlannerGrid";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmSubmitButton";
import { FlashMessage } from "@/components/ui/FlashMessage";
import { parseWeekStartParam, toDateInputValue } from "@/lib/utils/date";
import { getPlannerData, getPlannedMealByCoordinates } from "@/lib/services/planner";

type PlannerPageProps = {
  searchParams: Promise<{
    weekStart?: string;
    day?: DayOfWeek;
    slot?: MealType;
    notice?: string;
    tone?: "success" | "error" | "warning";
    confirmOverwrite?: string;
  }>;
};

export default async function PlannerPage({ searchParams }: PlannerPageProps) {
  const params = await searchParams;
  const weekStartDate = parseWeekStartParam(params.weekStart);
  const weekStart = toDateInputValue(weekStartDate);
  const plannerData = await getPlannerData(weekStartDate);

  const selectedDay =
    params.day && Object.values(DayOfWeek).includes(params.day) ? params.day : undefined;
  const selectedSlot =
    params.slot && Object.values(MealType).includes(params.slot) ? params.slot : undefined;

  const existingMeal =
    selectedDay && selectedSlot
      ? await getPlannedMealByCoordinates(plannerData.weeklyPlan.id, selectedDay, selectedSlot)
      : null;

  const destinationHasMeals = plannerData.meta.plannedMealCount > 0;
  const overwriteConfirmed = params.confirmOverwrite === "true";

  return (
    <div className="pageStack">
      <PageHeader
        title="Planner semanal"
        description="Edición robusta por slot, servings por persona y duplicado seguro de semanas sin romper la receta base."
        actions={
          <>
            <ButtonLink
              href={`/planner?weekStart=${toDateInputValue(plannerData.navigation.previousWeek)}`}
              variant="secondary"
            >
              Semana anterior
            </ButtonLink>
            <ButtonLink
              href={`/planner?weekStart=${toDateInputValue(plannerData.navigation.nextWeek)}`}
              variant="secondary"
            >
              Semana siguiente
            </ButtonLink>
          </>
        }
      />
      <FlashMessage message={params.notice} tone={params.tone} />

      <div className="statsGrid">
        <Card>
          <h2 className="sectionHeading">{plannerData.navigation.label}</h2>
          <p className="mutedText">Semana activa con inicio en Monday.</p>
        </Card>
        <Card>
          <h2 className="sectionHeading">Slots planificados</h2>
          <p className="pageDescription">{plannerData.meta.plannedMealCount}</p>
        </Card>
        <Card>
          <h2 className="sectionHeading">Acción rápida</h2>
          <form action={duplicatePreviousWeekAction} className="cluster">
            <input type="hidden" name="weekStart" value={weekStart} />
            <input
              type="hidden"
              name="overwrite"
              value={destinationHasMeals && overwriteConfirmed ? "true" : "false"}
            />
            {destinationHasMeals ? (
              <ConfirmSubmitButton
                type="submit"
                variant={overwriteConfirmed ? "danger" : "secondary"}
                message={`This week already has ${plannerData.meta.plannedMealCount} meals. Overwrite it with the previous week?`}
              >
                {overwriteConfirmed ? "Confirmar duplicado" : "Duplicar semana previa"}
              </ConfirmSubmitButton>
            ) : (
              <Button type="submit" variant="secondary">
                Duplicar semana previa
              </Button>
            )}
          </form>
        </Card>
      </div>

      <div className="plannerLayout">
        <PlannerGrid
          grid={plannerData.grid}
          weekStart={weekStart}
          weekStartDate={weekStartDate}
        />
        <PlannerForm
          weekStart={weekStart}
          weeklyPlanId={plannerData.weeklyPlan.id}
          persons={plannerData.persons}
          recipes={plannerData.recipes}
          selectedDay={selectedDay}
          selectedSlot={selectedSlot}
          existingMeal={existingMeal}
        />
      </div>
    </div>
  );
}
