"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { WeeklyPlanData, PlannedMealData } from "@/types";
import {
  getWeekDays,
  toDateString,
  formatDayShort,
  formatWeekRange,
  SLOT_ORDER,
  SLOT_LABELS,
  isSameDay,
  getTodayUTC,
} from "@/lib/dates";
import { upsertPlannedMeal, deletePlannedMeal, duplicateWeek } from "@/actions/planner";
import styles from "./planner.module.css";

interface RecipeOption {
  id: string;
  name: string;
  mealType: string;
}

interface Person {
  id: string;
  name: string;
}

interface Props {
  plan: WeeklyPlanData;
  weekStartStr: string;
  recipes: RecipeOption[];
  persons: Person[];
}

interface ModalState {
  mode: "add" | "edit";
  date: string;
  slot: string;
  meal?: PlannedMealData;
}

export default function PlannerClient({ plan, weekStartStr, recipes, persons }: Props) {
  const router = useRouter();
  const today = getTodayUTC();
  const weekDays = getWeekDays(new Date(weekStartStr + "T00:00:00Z"));

  const [modal, setModal] = useState<ModalState | null>(null);
  const [duplicating, setDuplicating] = useState(false);
  const [dupError, setDupError] = useState<string | null>(null);

  const prevWeekStr = toDateString(
    new Date(new Date(weekStartStr + "T00:00:00Z").getTime() - 7 * 86400000)
  );
  const nextWeekStr = toDateString(
    new Date(new Date(weekStartStr + "T00:00:00Z").getTime() + 7 * 86400000)
  );

  const getMealForSlot = useCallback(
    (date: Date, slot: string): PlannedMealData | undefined => {
      return plan.meals.find(
        (m) => toDateString(new Date(m.date)) === toDateString(date) && m.slot === slot
      );
    },
    [plan.meals]
  );

  async function handleDelete(mealId: string) {
    await deletePlannedMeal(mealId);
    router.refresh();
  }

  async function handleDuplicate() {
    setDuplicating(true);
    setDupError(null);
    const result = await duplicateWeek(plan.id);
    if (result.success) {
      router.push(`/planner?week=${nextWeekStr}`);
    } else {
      setDupError(result.error ?? "Error al duplicar");
    }
    setDuplicating(false);
  }

  return (
    <>
      {/* Week navigation */}
      <div className={styles.weekNav}>
        <Link href={`/planner?week=${prevWeekStr}`} className="btn btn-secondary btn-sm">
          ←
        </Link>
        <span className={styles.weekNavLabel}>
          {formatWeekRange(new Date(weekStartStr + "T00:00:00Z"))}
        </span>
        <Link href={`/planner?week=${nextWeekStr}`} className="btn btn-secondary btn-sm">
          →
        </Link>
      </div>

      {/* Duplicate bar */}
      <div className={styles.duplicateBar}>
        <p className={styles.duplicateBarText}>
          {plan.meals.length > 0 ? (
            <>
              <strong>{plan.meals.length}</strong> comidas esta semana
            </>
          ) : (
            "Semana vacía — añade comidas en el grid"
          )}
        </p>
        <div className={styles.duplicateBarActions}>
          {dupError && (
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-error)" }}>
              {dupError}
            </span>
          )}
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleDuplicate}
            disabled={duplicating || plan.meals.length === 0}
            title="Copiar esta semana a la siguiente"
          >
            {duplicating ? "Duplicando…" : "Duplicar →"}
          </button>
        </div>
      </div>

      {/* Week grid */}
      <div className={styles.weekGrid}>
        {weekDays.map((day) => {
          const isToday = isSameDay(day, today);
          const dateStr = toDateString(day);

          return (
            <div key={dateStr} className={styles.dayColumn}>
              <div className={`${styles.dayHeader} ${isToday ? styles.dayHeaderToday : ""}`}>
                <p className={styles.dayName}>{formatDayShort(day).split(" ")[0]}</p>
                <p className={styles.dayDate}>{day.getUTCDate()}</p>
              </div>

              {SLOT_ORDER.map((slot) => {
                const meal = getMealForSlot(day, slot);

                return (
                  <div
                    key={slot}
                    className={`${styles.slotCard} ${meal ? styles.slotCardFilled : ""}`}
                  >
                    <div className={styles.slotLabel}>
                      <span>{SLOT_LABELS[slot]}</span>
                      {meal && (
                        <span className={styles.slotLabelActions}>
                          <button
                            className={styles.slotActionBtn}
                            onClick={() =>
                              setModal({ mode: "edit", date: dateStr, slot, meal })
                            }
                            title="Editar"
                          >
                            ✎
                          </button>
                          <button
                            className={`${styles.slotActionBtn} ${styles.slotActionBtnDelete}`}
                            onClick={() => handleDelete(meal.id)}
                            title="Eliminar"
                          >
                            ×
                          </button>
                        </span>
                      )}
                    </div>

                    {meal ? (
                      <>
                        <p className={styles.slotRecipeName}>{meal.recipeName}</p>
                        <div className={styles.slotPortions}>
                          {meal.portions.map((p) => (
                            <div key={p.personId} className={styles.slotPortion}>
                              <span>{p.personName}</span>
                              <span>{p.servings}×</span>
                            </div>
                          ))}
                          {meal.portions.length === 0 && (
                            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>
                              Sin porciones
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className={styles.slotEmpty}>
                        <button
                          className={styles.slotAddBtn}
                          onClick={() => setModal({ mode: "add", date: dateStr, slot })}
                        >
                          + Añadir
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modal && (
        <MealModal
          modal={modal}
          weeklyPlanId={plan.id}
          recipes={recipes}
          persons={persons}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

// ─── Meal Modal ───────────────────────────────────────────────────────────────

interface MealModalProps {
  modal: ModalState;
  weeklyPlanId: string;
  recipes: RecipeOption[];
  persons: Person[];
  onClose: () => void;
  onSaved: () => void;
}

function MealModal({ modal, weeklyPlanId, recipes, persons, onClose, onSaved }: MealModalProps) {
  const [recipeId, setRecipeId] = useState(modal.meal?.recipeId ?? "");
  const [portions, setPortions] = useState<Record<string, string>>(
    Object.fromEntries(
      persons.map((p) => [
        p.id,
        String(modal.meal?.portions.find((mp) => mp.personId === p.id)?.servings ?? "1"),
      ])
    )
  );
  const [notes, setNotes] = useState(modal.meal?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    if (!recipeId) { setError("Selecciona una receta"); return; }

    const parsedPortions = persons.map((p) => {
      const raw = portions[p.id] ?? "1";
      const val = parseFloat(raw.replace(",", "."));
      return { personId: p.id, servings: isNaN(val) ? 1 : Math.max(0.1, val) };
    });

    setSaving(true);
    const result = await upsertPlannedMeal(weeklyPlanId, {
      recipeId,
      date: modal.date,
      slot: modal.slot,
      notes: notes.trim() || null,
      portions: parsedPortions,
    });

    if (result.success) {
      onSaved();
    } else {
      setError(result.error ?? "Error al guardar");
      setSaving(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h2 className={styles.modalTitle} id="modal-title">
          {modal.mode === "add" ? "Añadir comida" : "Editar comida"}{" "}
          <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-tertiary)", fontWeight: "var(--weight-normal)" }}>
            {SLOT_LABELS[modal.slot]} · {modal.date}
          </span>
        </h2>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: "var(--space-4)" }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div className="form-group">
            <label htmlFor="modal-recipe">Receta *</label>
            <select
              id="modal-recipe"
              value={recipeId}
              onChange={(e) => setRecipeId(e.target.value)}
              autoFocus
            >
              <option value="">Seleccionar receta…</option>
              {recipes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--color-text-secondary)", marginBottom: "var(--space-2)" }}>
              Porciones por persona
            </label>
            <div className={styles.portionsGrid}>
              {persons.map((p) => (
                <div className="form-group" key={p.id}>
                  <label htmlFor={`portion-${p.id}`}>{p.name}</label>
                  <input
                    id={`portion-${p.id}`}
                    type="number"
                    min="0.1"
                    max="20"
                    step="0.5"
                    value={portions[p.id] ?? "1"}
                    onChange={(e) => setPortions((prev) => ({ ...prev, [p.id]: e.target.value }))}
                    placeholder="1"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="modal-notes">Notas (opcional)</label>
            <input
              id="modal-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Sin gluten, más picante…"
              maxLength={500}
            />
          </div>
        </div>

        <div className={styles.modalActions}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando…" : "Guardar"}
          </button>
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
