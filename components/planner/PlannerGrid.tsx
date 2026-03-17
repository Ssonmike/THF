import { DayOfWeek, MealType } from "@prisma/client";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { isTodayInWeek } from "@/lib/utils/date";
import { formatQuantity } from "@/lib/utils/format";
import styles from "@/components/planner/PlannerGrid.module.css";

type PlannerGridProps = {
  grid: Array<{
    dayOfWeek: DayOfWeek;
    label: string;
    slots: Array<{
      mealSlot: MealType;
      mealSlotLabel: string;
      meal: {
        id: string;
        recipe: { name: string };
        portions: Array<{
          id: string;
          servings: number;
          person: { name: string };
        }>;
      } | null;
    }>;
  }>;
  weekStart: string;
  weekStartDate: Date;
};

export function PlannerGrid({ grid, weekStart, weekStartDate }: PlannerGridProps) {
  return (
    <div className={styles.grid}>
      {grid.map((day) => (
        <Card key={day.dayOfWeek} className={styles.dayCard}>
          <div className={styles.dayHeader}>
            <h2 className="sectionHeading">{day.label}</h2>
            {isTodayInWeek(day.dayOfWeek, weekStartDate) ? <span className="pill">Hoy</span> : null}
          </div>
          <div className={styles.slots}>
            {day.slots.map((slot) => (
              <div key={`${day.dayOfWeek}-${slot.mealSlot}`} className={styles.slotCard}>
                <div className={styles.slotHeader}>
                  <h3 className={styles.slotTitle}>{slot.mealSlotLabel}</h3>
                  <ButtonLink
                    href={`/planner?weekStart=${weekStart}&day=${day.dayOfWeek}&slot=${slot.mealSlot}`}
                    variant="ghost"
                    size="small"
                  >
                    {slot.meal ? "Editar" : "Planificar"}
                  </ButtonLink>
                </div>
                {slot.meal ? (
                  <>
                    <p className={styles.recipeName}>{slot.meal.recipe.name}</p>
                    <div className={styles.portionList}>
                      {slot.meal.portions.map((portion) => (
                        <div key={portion.id} className={styles.portionRow}>
                          <span>{portion.person.name}</span>
                          <strong>{formatQuantity(portion.servings)} servings</strong>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className={styles.placeholder}>Sin receta asignada todavía.</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
