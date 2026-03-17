"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatQuantity } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import styles from "@/components/shopping/ShoppingChecklist.module.css";

type ShoppingChecklistItem = {
  aggregateKey: string;
  itemName: string;
  quantity: number;
  unit: string;
  checked: boolean;
};

type ShoppingChecklistProps = {
  weeklyPlanId: string;
  items: ShoppingChecklistItem[];
};

type FilterMode = "pending" | "all" | "checked";

function buildPlainText(items: ShoppingChecklistItem[]) {
  return items.map((item) => `- ${item.itemName}: ${formatQuantity(item.quantity)} ${item.unit}`).join("\n");
}

function buildCsv(items: ShoppingChecklistItem[]) {
  const header = "item,quantity,unit,checked";
  const rows = items.map(
    (item) =>
      `"${item.itemName.replace(/"/g, '""')}",${item.quantity},${item.unit},${item.checked ? "yes" : "no"}`
  );

  return [header, ...rows].join("\n");
}

export function ShoppingChecklist({ weeklyPlanId, items }: ShoppingChecklistProps) {
  const [list, setList] = useState(items);
  const [filter, setFilter] = useState<FilterMode>("pending");
  const [status, setStatus] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"default" | "error">("default");
  const [isPending, startTransition] = useTransition();

  const filteredItems = list.filter((item) => {
    if (filter === "pending") {
      return !item.checked;
    }

    if (filter === "checked") {
      return item.checked;
    }

    return true;
  });

  const checkedCount = list.filter((item) => item.checked).length;

  async function persist(payload: unknown) {
    const response = await fetch("/api/shopping-list/state", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = (await response.json()) as { ok: boolean; message?: string };

    if (!response.ok || !data.ok) {
      throw new Error(data.message || "Unable to update the shopping list state.");
    }
  }

  function updateSingle(item: ShoppingChecklistItem, checked: boolean) {
    const previous = list;
    setList((current) =>
      current.map((entry) =>
        entry.aggregateKey === item.aggregateKey ? { ...entry, checked } : entry
      )
    );
    setStatus(null);
    setStatusTone("default");

    startTransition(async () => {
      try {
        await persist({
          action: "toggle",
          weeklyPlanId,
          item: {
            aggregateKey: item.aggregateKey,
            itemName: item.itemName,
            unit: item.unit
          },
          checked
        });
      } catch (error) {
        setList(previous);
        setStatus(
          error instanceof Error ? error.message : "No se pudo actualizar la lista de compra."
        );
        setStatusTone("error");
      }
    });
  }

  function updateAll(checked: boolean) {
    const previous = list;
    setList((current) => current.map((entry) => ({ ...entry, checked })));
    setStatus(null);
    setStatusTone("default");

    startTransition(async () => {
      try {
        await persist({
          action: checked ? "mark-all" : "clear-all",
          weeklyPlanId,
          items: previous.map((item) => ({
            aggregateKey: item.aggregateKey,
            itemName: item.itemName,
            unit: item.unit
          }))
        });
      } catch (error) {
        setList(previous);
        setStatus(
          error instanceof Error ? error.message : "No se pudo actualizar la lista de compra."
        );
        setStatusTone("error");
      }
    });
  }

  async function copyPendingItems() {
    const pendingItems = list.filter((item) => !item.checked);
    await navigator.clipboard.writeText(buildPlainText(pendingItems));
    setStatus("Pendientes copiados al portapapeles.");
    setStatusTone("default");
  }

  function downloadCsv() {
    const csv = buildCsv(list);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "nutri-week-shopping-list.csv";
    link.click();
    URL.revokeObjectURL(url);
    setStatus("CSV exportado.");
    setStatusTone("default");
  }

  return (
    <div className={styles.panel}>
      <Card>
        <div className={styles.toolbar}>
          <div className={styles.toolbarGroup}>
            <div className={styles.filters}>
              {[
                { id: "pending", label: "Pendientes" },
                { id: "all", label: "Todos" },
                { id: "checked", label: "Comprados" }
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={cn(
                    styles.filterButton,
                    filter === option.id && styles.filterActive
                  )}
                  onClick={() => setFilter(option.id as FilterMode)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <span className={styles.status}>
              {checkedCount} / {list.length} comprados
            </span>
          </div>

          <div className={styles.toolbarGroup}>
            <Button type="button" variant="secondary" size="small" onClick={() => updateAll(true)} disabled={isPending}>
              Marcar todo
            </Button>
            <Button type="button" variant="secondary" size="small" onClick={() => updateAll(false)} disabled={isPending}>
              Limpiar todo
            </Button>
            <Button type="button" variant="ghost" size="small" onClick={copyPendingItems}>
              Copiar pendientes
            </Button>
            <Button type="button" variant="ghost" size="small" onClick={downloadCsv}>
              Exportar CSV
            </Button>
          </div>
        </div>
        {status ? <p className={cn(styles.status, statusTone === "error" && styles.error)}>{status}</p> : null}
      </Card>

      <Card>
        <div className={styles.list}>
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <label key={item.aggregateKey} className={styles.row}>
                <div className={styles.left}>
                  <input
                    type="checkbox"
                    checked={item.checked}
                    disabled={isPending}
                    onChange={(event) => updateSingle(item, event.target.checked)}
                  />
                  <span className={cn(item.checked && styles.checked)}>{item.itemName}</span>
                </div>
                <strong className={cn(styles.quantity, item.checked && styles.checked)}>
                  {formatQuantity(item.quantity)} {item.unit}
                </strong>
              </label>
            ))
          ) : (
            <p className={styles.status}>No hay items para el filtro actual.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
