import { addWeeks, subWeeks } from "date-fns";
import { PageHeader } from "@/components/layout/PageHeader";
import { ShoppingChecklist } from "@/components/shopping/ShoppingChecklist";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  formatWeekLabel,
  parseWeekStartParam,
  toDateInputValue
} from "@/lib/utils/date";
import { getShoppingListForWeek } from "@/lib/services/shopping";

type ShoppingPageProps = {
  searchParams: Promise<{
    weekStart?: string;
  }>;
};

export default async function ShoppingListPage({ searchParams }: ShoppingPageProps) {
  const params = await searchParams;
  const weekStartDate = parseWeekStartParam(params.weekStart);
  const weekStart = toDateInputValue(weekStartDate);
  const shoppingData = await getShoppingListForWeek(weekStartDate);

  return (
    <div className="pageStack">
      <PageHeader
        title="Lista de la compra"
        description="Lista agregada, persistente por semana y pensada para usarse de verdad en casa sin perder el estado al recargar."
        actions={
          <>
            <ButtonLink
              href={`/shopping-list?weekStart=${toDateInputValue(subWeeks(weekStartDate, 1))}`}
              variant="secondary"
            >
              Semana anterior
            </ButtonLink>
            <ButtonLink
              href={`/shopping-list?weekStart=${toDateInputValue(addWeeks(weekStartDate, 1))}`}
              variant="secondary"
            >
              Semana siguiente
            </ButtonLink>
          </>
        }
      />

      <Card>
        <div className="splitRow">
          <div>
            <h2 className="sectionHeading">{formatWeekLabel(weekStartDate)}</h2>
            <p className="mutedText">
              Normalizacion explicita: nombres limpios, agrupacion consistente y conversion segura de{" "}
              <code>kg -&gt; g</code> y <code>l -&gt; ml</code>.
            </p>
          </div>
          <ButtonLink href={`/planner?weekStart=${weekStart}`} variant="ghost">
            Revisar planner
          </ButtonLink>
        </div>
      </Card>

      {shoppingData.items.length > 0 && shoppingData.weeklyPlan ? (
        <>
          <div className="statsGrid">
            <Card>
              <h2 className="sectionHeading">Items totales</h2>
              <p className="pageDescription">{shoppingData.stats.total}</p>
            </Card>
            <Card>
              <h2 className="sectionHeading">Comprados</h2>
              <p className="pageDescription">{shoppingData.stats.checked}</p>
            </Card>
            <Card>
              <h2 className="sectionHeading">Pendientes</h2>
              <p className="pageDescription">{shoppingData.stats.pending}</p>
            </Card>
          </div>
          <ShoppingChecklist
            weeklyPlanId={shoppingData.weeklyPlan.id}
            items={shoppingData.items}
          />
        </>
      ) : (
        <EmptyState
          title="No hay nada que comprar todavia"
          description="La lista se recalcula a partir del planner. Cuando asignes comidas a esta semana aparecera aqui una lista persistente y lista para llevar al supermercado."
          action={<ButtonLink href={`/planner?weekStart=${weekStart}`}>Ir al planner</ButtonLink>}
        />
      )}
    </div>
  );
}
