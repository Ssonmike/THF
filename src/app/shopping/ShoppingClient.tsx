"use client";

import { useState, useTransition } from "react";
import type { ShoppingItemData } from "@/types";
import { updateChecklistItem, clearCheckedItems } from "@/actions/shopping";
import { useRouter } from "next/navigation";
import styles from "./shopping.module.css";

type FilterMode = "all" | "pending" | "done";

interface Props {
  items: ShoppingItemData[];
  weeklyPlanId: string;
}

export default function ShoppingClient({ items, weeklyPlanId }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterMode>("all");
  const [optimisticItems, setOptimisticItems] = useState(items);
  const [isPending, startTransition] = useTransition();

  // Sync when server items change (e.g., on navigation)
  if (items !== optimisticItems && !isPending) {
    setOptimisticItems(items);
  }

  const checkedCount = optimisticItems.filter((i) => i.checked).length;
  const totalCount = optimisticItems.length;
  const progressPct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  const filtered = optimisticItems.filter((item) => {
    if (filter === "pending") return !item.checked;
    if (filter === "done") return item.checked;
    return true;
  });

  async function toggleItem(item: ShoppingItemData) {
    const newChecked = !item.checked;

    // Optimistic update
    setOptimisticItems((prev) =>
      prev.map((i) => (i.key === item.key ? { ...i, checked: newChecked } : i))
    );

    startTransition(async () => {
      await updateChecklistItem({
        weeklyPlanId,
        ingredientKey: item.key,
        checked: newChecked,
      });
      router.refresh();
    });
  }

  async function handleClearChecked() {
    setOptimisticItems((prev) => prev.map((i) => ({ ...i, checked: false })));
    startTransition(async () => {
      await clearCheckedItems(weeklyPlanId);
      router.refresh();
    });
  }

  // Copy to clipboard
  function handleCopy() {
    const pending = optimisticItems.filter((i) => !i.checked);
    const text = pending
      .map((i) => `• ${i.name} — ${i.displayQuantity}`)
      .join("\n");
    navigator.clipboard?.writeText(text);
  }

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon">◻</span>
        <p className="empty-state-title">Lista vacía</p>
        <p className="empty-state-desc">
          Planifica comidas en el planner para generar la lista de compra automáticamente.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Progress */}
      {totalCount > 0 && (
        <div style={{ marginBottom: "var(--space-6)" }}>
          <p className={styles.progressLabel}>
            {checkedCount} de {totalCount} — {progressPct}%
          </p>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.filterTabs}>
          {(["all", "pending", "done"] as FilterMode[]).map((f) => (
            <button
              key={f}
              className={`${styles.filterTab} ${filter === f ? styles.filterTabActive : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? `Todos (${totalCount})` : f === "pending" ? `Pendientes (${totalCount - checkedCount})` : `Comprados (${checkedCount})`}
            </button>
          ))}
        </div>

        <div className={styles.toolbarActions}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleCopy}
            title="Copiar pendientes al portapapeles"
          >
            Copiar
          </button>
          {checkedCount > 0 && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleClearChecked}
              title="Desmarcar todos los comprados"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Desmarcar
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="empty-state" style={{ padding: "var(--space-10)" }}>
          <p className="empty-state-title">
            {filter === "pending" ? "Todo comprado ✓" : "Nada comprado aún"}
          </p>
        </div>
      ) : (
        <div className={styles.shoppingList}>
          {filtered.map((item) => (
            <div
              key={item.key}
              className={`${styles.shoppingItem} ${item.checked ? styles.shoppingItemChecked : ""}`}
              onClick={() => toggleItem(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") toggleItem(item); }}
              aria-label={`${item.name} — ${item.displayQuantity}`}
            >
              <div
                className={`${styles.shoppingItemCheck} ${item.checked ? styles.shoppingItemCheckChecked : ""}`}
                aria-hidden="true"
              >
                {item.checked && "✓"}
              </div>

              <span
                className={`${styles.shoppingItemName} ${item.checked ? styles.shoppingItemNameChecked : ""}`}
              >
                {item.name}
              </span>

              <span className={styles.shoppingItemQty}>{item.displayQuantity}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
