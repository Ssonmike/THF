import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getDashboardData } from "@/lib/services/dashboard";
import { formatLongDate, formatWeekLabel } from "@/lib/utils/date";
import { formatQuantity } from "@/lib/utils/format";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="pageStack">
      <PageHeader
        title="Dashboard"
        description="Vista rápida del día actual con comidas planificadas, porciones reales y resumen nutricional para Miguel y Ana."
      />

      <div className="statsGrid">
        <Card>
          <h2 className="sectionHeading">Hoy</h2>
          <p className="pageDescription">{formatLongDate(data.today)}</p>
        </Card>
        <Card>
          <h2 className="sectionHeading">Semana activa</h2>
          <p className="pageDescription">{formatWeekLabel(data.weekStartDate)}</p>
        </Card>
        <Card>
          <h2 className="sectionHeading">Accesos rápidos</h2>
          <div className="cluster">
            <ButtonLink href="/planner" variant="secondary" size="small">
              Planner
            </ButtonLink>
            <ButtonLink href="/recipes" variant="secondary" size="small">
              Recetas
            </ButtonLink>
            <ButtonLink href="/shopping-list" variant="secondary" size="small">
              Compra
            </ButtonLink>
          </div>
        </Card>
      </div>

      {data.meals.length > 0 ? (
        <>
          <Card>
            <h2 className="sectionHeading">Comidas de hoy</h2>
            <ul className="cleanList">
              {data.meals.map((meal) => (
                <li key={meal.id} className="listRow">
                  <div>
                    <strong>
                      {meal.mealSlotLabel} · {meal.recipeName}
                    </strong>
                    <p className="mutedText">
                      {meal.portions
                        .map(
                          (portion) =>
                            `${portion.personName}: ${formatQuantity(portion.servings)} servings`
                        )
                        .join(" · ")}
                    </p>
                  </div>
                  <ButtonLink href="/planner" variant="ghost" size="small">
                    Ajustar
                  </ButtonLink>
                </li>
              ))}
            </ul>
          </Card>

          <div className="statsGrid">
            {data.nutritionByPerson.map((person) => (
              <Card key={person.personId}>
                <h2 className="sectionHeading">{person.personName}</h2>
                <dl className="metricList">
                  <div>
                    <dt>Calorías</dt>
                    <dd>{formatQuantity(person.totals.calories)} kcal</dd>
                  </div>
                  <div>
                    <dt>Proteína</dt>
                    <dd>{formatQuantity(person.totals.protein)} g</dd>
                  </div>
                  <div>
                    <dt>Carbohidratos</dt>
                    <dd>{formatQuantity(person.totals.carbs)} g</dd>
                  </div>
                  <div>
                    <dt>Grasas</dt>
                    <dd>{formatQuantity(person.totals.fats)} g</dd>
                  </div>
                </dl>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          title="Hoy no hay comidas planificadas"
          description="El dashboard se alimenta del planner semanal. Añade algunas comidas para ver aquí porciones y nutrición real por persona."
          action={<ButtonLink href="/planner">Ir al planner</ButtonLink>}
        />
      )}
    </div>
  );
}
