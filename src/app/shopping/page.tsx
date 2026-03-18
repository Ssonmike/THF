import Link from "next/link";
import { getOrCreateWeeklyPlan } from "@/actions/planner";
import { getShoppingList } from "@/actions/shopping";
import { getTodayUTC, getWeekStart, toDateString, formatWeekRange, prevWeek, nextWeek } from "@/lib/dates";
import ShoppingClient from "./ShoppingClient";
import styles from "./shopping.module.css";

export const metadata = {
  title: "Lista de compra",
};

interface Props {
  searchParams: Promise<{ week?: string }>;
}

export default async function ShoppingPage({ searchParams }: Props) {
  const { week } = await searchParams;

  let weekStartStr: string;
  if (week && /^\d{4}-\d{2}-\d{2}$/.test(week)) {
    weekStartStr = week;
  } else {
    weekStartStr = toDateString(getWeekStart(getTodayUTC()));
  }

  const plan = await getOrCreateWeeklyPlan(weekStartStr);
  const items = await getShoppingList(plan.id);

  const weekStart = new Date(weekStartStr + "T00:00:00Z");
  const prevStr = toDateString(prevWeek(weekStart));
  const nextStr = toDateString(nextWeek(weekStart));

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Lista de compra</h1>
          <p className="page-subtitle">Generada a partir del planner semanal</p>
        </div>
        <Link href={`/planner?week=${weekStartStr}`} className="btn btn-secondary btn-sm">
          Ver planner
        </Link>
      </div>

      {/* Week selector */}
      <div className={styles.weekSelector}>
        <Link href={`/shopping?week=${prevStr}`} className="btn btn-secondary btn-sm">←</Link>
        <span className={styles.weekSelectorLabel}>
          {formatWeekRange(weekStart)}
        </span>
        <Link href={`/shopping?week=${nextStr}`} className="btn btn-secondary btn-sm">→</Link>
      </div>

      <ShoppingClient items={items} weeklyPlanId={plan.id} />
    </div>
  );
}
