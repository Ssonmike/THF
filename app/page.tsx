import { dayOfWeekLabels } from "@/lib/constants/meal";
import { getDashboardData } from "@/lib/services/dashboard";
import { formatLongDate, formatWeekLabel, toDateInputValue } from "@/lib/utils/date";
import { formatQuantity } from "@/lib/utils/format";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const weekStart = toDateInputValue(data.weekStartDate);

  return (
    <div className="pageStack">
      <PageHeader
        title="Dashboard"
        description="Vista diaria clara para saber que toca hoy, como va la semana y acceder rapido al planner y a la compra."
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
          <h2 className="sectionHeading">Accesos rapidos</h2>
          <div className="cluster">
            <ButtonLink href={`/planner?weekStart=${weekStart}`} variant="secondary" size="small">
              Planner
            </ButtonLink>
            <ButtonLink href="/recipes" variant="secondary" size="small">
              Recetas
            </ButtonLink>
            <ButtonLink href={`/shopping-list?weekStart=${weekStart}`} variant="secondary" size="small">
              Compra
            </ButtonLink>
          </div>
        </Card>
      </div>

      <div className="statsGrid">
        <Card>
          <h2 className="sectionHeading">Comidas esta semana</h2>
          <p className="pageDescription">{data.weekSummary.plannedMeals}</p>
        </Card>
        <Card>
          <h2 className="sectionHeading">Recetas distintas</h2>
          <p className="pageDescription">{data.weekSummary.distinctRecipes}</p>
        </Card>
        <Card>
          <h2 className="sectionHeading">Proximas comidas</h2>
          {data.nextMeals.length > 0 ? (
            <ul className="cleanList">
              {data.nextMeals.map((meal) => (
                <li key={meal.id} className="miniListRow">
                  {dayOfWeekLabels[meal.dayOfWeek]} · {meal.mealSlotLabel} · {meal.recipeName}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mutedText">No hay mas comidas planificadas esta semana.</p>
          )}
        </Card>
      </div>

      {data.meals.length > 0 ? (
        <>
          <Card>
            <div className="splitRow">
              <div>
                <h2 className="sectionHeading">Comidas de hoy</h2>
                <p className="mutedText">
                  Resumen rapido por slot con servings reales por persona.
                </p>
              </div>
              <ButtonLink href={`/planner?weekStart=${weekStart}`} variant="ghost" size="small">
                Ajustar planner
              </ButtonLink>
            </div>
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
                    <dt>Calorias</dt>
                    <dd>{formatQuantity(person.totals.calories)} kcal</dd>
                  </div>
                  <div>
                    <dt>Proteina</dt>
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
          description="El dashboard se alimenta del planner semanal. Anade algunas comidas y aqui aparecera un resumen limpio para Miguel y Ana."
          action={<ButtonLink href={`/planner?weekStart=${weekStart}`}>Ir al planner</ButtonLink>}
        />
      )}
    </div>
  );
}
