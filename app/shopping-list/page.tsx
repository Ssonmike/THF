import { PageHeader } from "@/components/layout/PageHeader";
import { ShoppingChecklist } from "@/components/shopping/ShoppingChecklist";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { parseWeekStartParam, formatWeekLabel, toDateInputValue } from "@/lib/utils/date";
import { getShoppingListForWeek } from "@/lib/services/shopping";
import { addWeeks, subWeeks } from "date-fns";

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
        description="Agregación automática a partir de todos los servings planificados de la semana seleccionada."
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
        <h2 className="sectionHeading">{formatWeekLabel(weekStartDate)}</h2>
        <p className="mutedText">
          Normalización simple activada: `kg` se agrega como `g` y `l` como `ml`.
        </p>
      </Card>

      {shoppingData.items.length > 0 ? (
        <>
          <Card>
            <div className="splitRow">
              <div>
                <h2 className="sectionHeading">Resumen</h2>
                <p className="mutedText">
                  {shoppingData.items.length} ingredientes agregados para esta semana.
                </p>
              </div>
              <ButtonLink href={`/planner?weekStart=${weekStart}`} variant="ghost">
                Revisar planner
              </ButtonLink>
            </div>
          </Card>
          <ShoppingChecklist items={shoppingData.items} />
        </>
      ) : (
        <EmptyState
          title="No hay nada que comprar todavía"
          description="La lista se construye a partir de las comidas del planner. Añade recetas a la semana y volverá a calcularse automáticamente."
          action={<ButtonLink href={`/planner?weekStart=${weekStart}`}>Ir al planner</ButtonLink>}
        />
      )}
    </div>
  );
}
