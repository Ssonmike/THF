import { getOrCreateWeeklyPlan } from "@/actions/planner";
import { getRecipes } from "@/actions/recipes";
import { prisma } from "@/lib/prisma";
import { getTodayUTC, getWeekStart, toDateString } from "@/lib/dates";
import PlannerClient from "./PlannerClient";

export const metadata = {
  title: "Planner",
};

interface Props {
  searchParams: Promise<{ week?: string }>;
}

export default async function PlannerPage({ searchParams }: Props) {
  const { week } = await searchParams;

  // Resolve week start
  let weekStartStr: string;
  if (week && /^\d{4}-\d{2}-\d{2}$/.test(week)) {
    weekStartStr = week;
  } else {
    const today = getTodayUTC();
    weekStartStr = toDateString(getWeekStart(today));
  }

  const [plan, recipes, persons] = await Promise.all([
    getOrCreateWeeklyPlan(weekStartStr),
    getRecipes(),
    prisma.person.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Planner</h1>
          <p className="page-subtitle">Planificación semanal — Lunes a Domingo</p>
        </div>
      </div>

      <PlannerClient
        plan={plan}
        weekStartStr={weekStartStr}
        recipes={recipes.map((r) => ({ id: r.id, name: r.name, mealType: r.mealType }))}
        persons={persons}
      />
    </div>
  );
}
