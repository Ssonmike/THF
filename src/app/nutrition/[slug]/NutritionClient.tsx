"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { NutritionProfileData } from "@/actions/nutrition";
import { saveNutritionProfile, saveNutritionPlan } from "@/actions/nutrition";
import { applyNutritionPlanToPlanner } from "@/actions/nutrition-apply";
import styles from "./nutrition-detail.module.css";

interface StoredProfile {
  id: string;
  age?: number | null;
  sex?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  goalWeight?: string | null;
  timeline?: string | null;
  jobType?: string | null;
  exercisePerWeek?: number | null;
  exerciseType?: string | null;
  sleepHours?: number | null;
  stressLevel?: string | null;
  alcohol?: string | null;
  favoriteMeals?: string | null;
  hatedFoods?: string | null;
  dietaryRestrictions?: string | null;
  cookingStyle?: string | null;
  foodAdventurousness?: number | null;
  currentSnacks?: string | null;
  snackReason?: string | null;
  snackPreference?: string | null;
  lateNightSnacking?: boolean;
}

const ALLOWED_SEX = new Set<NonNullable<NutritionProfileData["sex"]>>(["MALE", "FEMALE"]);
const ALLOWED_STRESS = new Set<NonNullable<NutritionProfileData["stressLevel"]>>(["low", "moderate", "high"]);
const ALLOWED_COOKING = new Set<NonNullable<NutritionProfileData["cookingStyle"]>>(["scratch", "quick", "batch"]);
const ALLOWED_SNACK_REASON = new Set<NonNullable<NutritionProfileData["snackReason"]>>(["hunger", "boredom", "habit", "multiple"]);
const ALLOWED_SNACK_PREFERENCE = new Set<NonNullable<NutritionProfileData["snackPreference"]>>(["sweet", "savory", "both"]);

function asAllowedValue<T extends string>(value: string | null | undefined, allowed: Set<T>): T | undefined {
  return value && allowed.has(value as T) ? (value as T) : undefined;
}

interface Props {
  personSlug: string;
  personName: string;
  initialProfile: StoredProfile | null;
  initialPlan: string | null;
}

function profileToFormData(p: StoredProfile | null): NutritionProfileData {
  if (!p) return {};
  return {
    age: p.age ?? undefined,
    sex: asAllowedValue(p.sex, ALLOWED_SEX),
    heightCm: p.heightCm ?? undefined,
    weightKg: p.weightKg ?? undefined,
    goalWeight: p.goalWeight ?? undefined,
    timeline: p.timeline ?? undefined,
    jobType: p.jobType ?? undefined,
    exercisePerWeek: p.exercisePerWeek ?? undefined,
    exerciseType: p.exerciseType ?? undefined,
    sleepHours: p.sleepHours ?? undefined,
    stressLevel: asAllowedValue(p.stressLevel, ALLOWED_STRESS),
    alcohol: p.alcohol ?? undefined,
    favoriteMeals: p.favoriteMeals ?? undefined,
    hatedFoods: p.hatedFoods ?? undefined,
    dietaryRestrictions: p.dietaryRestrictions ?? undefined,
    cookingStyle: asAllowedValue(p.cookingStyle, ALLOWED_COOKING),
    foodAdventurousness: p.foodAdventurousness ?? undefined,
    currentSnacks: p.currentSnacks ?? undefined,
    snackReason: asAllowedValue(p.snackReason, ALLOWED_SNACK_REASON),
    snackPreference: asAllowedValue(p.snackPreference, ALLOWED_SNACK_PREFERENCE),
    lateNightSnacking: p.lateNightSnacking ?? false,
  };
}

const TOTAL_STEPS = 4;


const MEAL_ROW_LABELS = [
  { key: "breakfast", label: "Desayuno" },
  { key: "lunch", label: "Comida" },
  { key: "dinner", label: "Cena" },
  { key: "snack", label: "Snack/Postre" },
];

type WeeklyDay = {
  day: string;
  breakfast?: string;
  lunch?: string;
  dinner?: string;
  snack?: string;
};

function parseWeeklyPlan(lines: string[]): WeeklyDay[] | null {
  const days: WeeklyDay[] = [];
  let current: WeeklyDay | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const dayMatch = line.match(/^(lunes|martes|miércoles|jueves|viernes|sábado|domingo)/i);
    if (dayMatch) {
      if (current) days.push(current);
      current = { day: capitalize(dayMatch[1].toLowerCase()) };
      continue;
    }

    if (!current) continue;

    if (/^desayuno/i.test(line)) {
      current.breakfast = cleanMealLine(line);
      continue;
    }
    if (/^(comida|almuerzo)/i.test(line)) {
      current.lunch = cleanMealLine(line);
      continue;
    }
    if (/^cena/i.test(line)) {
      current.dinner = cleanMealLine(line);
      continue;
    }
    if (/^(postre|snack|merienda)/i.test(line)) {
      current.snack = cleanMealLine(line);
      continue;
    }
  }

  if (current) days.push(current);
  return days.length >= 3 ? days : null;
}

function cleanMealLine(line: string) {
  return line.replace(/^(desayuno|comida|almuerzo|cena|postre|snack|merienda)\s*[:\-–]?\s*/i, '').trim();
}

function capitalize(v: string) {
  return v.charAt(0).toUpperCase() + v.slice(1);
}

const STEP_LABELS = [
  "Mis datos",
  "Estilo de vida",
  "Alimentación",
  "Snacks",
];

export default function NutritionClient({ personSlug, personName, initialProfile, initialPlan }: Props) {
  const router = useRouter();
  const [view, setView] = useState<"plan" | "wizard">(
    initialPlan ? "plan" : "wizard"
  );
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<NutritionProfileData>(
    profileToFormData(initialProfile)
  );
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [streamedPlan, setStreamedPlan] = useState(initialPlan ?? "");
  const [error, setError] = useState<string | null>(null);
  const [applyingPlan, setApplyingPlan] = useState(false);
  const [applyMessage, setApplyMessage] = useState<string | null>(null);
  const planRef = useRef<HTMLDivElement>(null);

  function update(field: keyof NutritionProfileData, value: string | number | boolean | undefined) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleApplyToPlanner() {
    setApplyingPlan(true);
    setApplyMessage(null);
    const result = await applyNutritionPlanToPlanner(personSlug);
    if (result.success) {
      setApplyMessage(`Plan aplicado al planner semanal (${result.data?.week ?? "semana actual"}) · ${result.data?.createdRecipes ?? 0} recetas nuevas · ${result.data?.upgradedRecipes ?? 0} recetas mejoradas · ${result.data?.appliedMeals ?? 0} comidas aplicadas`);
      router.refresh();
    } else {
      setError(result.error ?? "No se pudo aplicar al planner");
    }
    setApplyingPlan(false);
  }

  async function handleGenerate() {
    setError(null);
    setSaving(true);

    // 1. Save profile
    const saveResult = await saveNutritionProfile(personSlug, formData);
    if (!saveResult.success || !saveResult.profileId) {
      setError(saveResult.error ?? "Error al guardar el perfil");
      setSaving(false);
      return;
    }
    const profileId = saveResult.profileId;
    setSaving(false);

    // 2. Stream plan from Claude
    setGenerating(true);
    setStreamedPlan("");
    setView("plan");
    setTimeout(() => planRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

    try {
      const res = await fetch("/api/nutrition/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: formData, personName }),
      });

      if (!res.ok || !res.body) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error((errJson as { error?: string }).error ?? "Error en la API");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setStreamedPlan(fullText);
      }

      // 3. Save completed plan
      const savePlanResult = await saveNutritionPlan(profileId, fullText);
      if (!savePlanResult.success) {
        throw new Error(savePlanResult.error ?? "No se pudo guardar el plan generado");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setGenerating(false);
    }
  }

  if (view === "plan") {
    return (
      <main className="container">
        <div className={styles.planHeader}>
          <Link href="/nutrition" className={styles.backLink}>← Nutrición</Link>
          <h1 className={styles.planTitle}>Plan de {personName}</h1>
          <div className={styles.planHeaderActions}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { setView("wizard"); setStep(1); }}
            >
              Editar perfil
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? "Generando…" : "Regenerar plan"}
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleApplyToPlanner}
              disabled={applyingPlan || generating || !streamedPlan}
            >
              {applyingPlan ? "Aplicando…" : "Aplicar al planner semanal"}
            </button>
          </div>
        </div>

        {applyMessage && (
          <div className="alert alert-success" style={{ marginBottom: "var(--space-4)" }}>
            {applyMessage}
          </div>
        )}

        {error && (
          <div className="alert alert-error" style={{ marginBottom: "var(--space-4)" }}>
            {error}
            {error.includes("ANTHROPIC_API_KEY") && (
              <p style={{ marginTop: "var(--space-2)", fontSize: "var(--text-sm)" }}>
                Añade tu clave de API en el archivo <code>.env</code>: <code>ANTHROPIC_API_KEY=&quot;sk-...&quot;</code>
              </p>
            )}
          </div>
        )}

        {generating && !streamedPlan && (
          <div className={styles.generatingIndicator}>
            <span className={styles.generatingDot} />
            <span className={styles.generatingDot} />
            <span className={styles.generatingDot} />
            <span style={{ marginLeft: "var(--space-3)", color: "var(--color-text-secondary)" }}>
              Claude está analizando tu perfil…
            </span>
          </div>
        )}

        <div ref={planRef} className={styles.planContent}>
          {streamedPlan ? (
            <PlanRenderer text={streamedPlan} streaming={generating} />
          ) : !generating ? (
            <p style={{ color: "var(--color-text-tertiary)" }}>Sin plan todavía.</p>
          ) : null}
        </div>
      </main>
    );
  }

  // ── Wizard view ──────────────────────────────────────────────────────────────
  return (
    <main className="container">
      <div className={styles.wizardHeader}>
        <Link href="/nutrition" className={styles.backLink}>← Nutrición</Link>
        <h1 className={styles.wizardTitle}>Perfil de {personName}</h1>
      </div>

      {/* Progress */}
      <div className={styles.progressBar}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div key={i} className={styles.progressStep}>
            <div
              className={`${styles.progressDot} ${
                i + 1 < step
                  ? styles.progressDotDone
                  : i + 1 === step
                  ? styles.progressDotActive
                  : ""
              }`}
            >
              {i + 1 < step ? "✓" : i + 1}
            </div>
            <span
              className={`${styles.progressLabel} ${
                i + 1 === step ? styles.progressLabelActive : ""
              }`}
            >
              {STEP_LABELS[i]}
            </span>
            {i < TOTAL_STEPS - 1 && <div className={`${styles.progressLine} ${i + 1 < step ? styles.progressLineDone : ""}`} />}
          </div>
        ))}
      </div>

      {applyMessage && (
          <div className="alert alert-success" style={{ marginBottom: "var(--space-4)" }}>
            {applyMessage}
          </div>
        )}

        {error && (
        <div className="alert alert-error" style={{ marginBottom: "var(--space-4)" }}>
          {error}
        </div>
      )}

      <div className={styles.wizardCard}>
        {step === 1 && (
          <Section1
            data={formData}
            onChange={update}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <Section2
            data={formData}
            onChange={update}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <Section3
            data={formData}
            onChange={update}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        )}
        {step === 4 && (
          <Section4
            data={formData}
            onChange={update}
            onBack={() => setStep(3)}
            onGenerate={handleGenerate}
            saving={saving}
          />
        )}
      </div>
    </main>
  );
}

// ─── Section 1: Stats ──────────────────────────────────────────────────────────

function Section1({
  data,
  onChange,
  onNext,
}: {
  data: NutritionProfileData;
  onChange: (f: keyof NutritionProfileData, v: string | number | boolean | undefined) => void;
  onNext: () => void;
}) {
  return (
    <div>
      <h2 className={styles.sectionTitle}>Sección 1 — Mis datos</h2>
      <p className={styles.sectionDesc}>Tu punto de partida para el cálculo calórico personalizado.</p>

      <div className={styles.formGrid}>
        <div className="form-group">
          <label htmlFor="age">Edad</label>
          <input
            id="age"
            type="number"
            min={10}
            max={100}
            placeholder="30"
            value={data.age ?? ""}
            onChange={(e) => onChange("age", e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="sex">Sexo biológico</label>
          <select
            id="sex"
            value={data.sex ?? ""}
            onChange={(e) => onChange("sex", e.target.value || undefined)}
          >
            <option value="">Seleccionar…</option>
            <option value="MALE">Hombre</option>
            <option value="FEMALE">Mujer</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="height">Altura (cm)</label>
          <input
            id="height"
            type="number"
            min={100}
            max={250}
            placeholder="175"
            value={data.heightCm ?? ""}
            onChange={(e) => onChange("heightCm", e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="weight">Peso actual (kg)</label>
          <input
            id="weight"
            type="number"
            min={30}
            max={300}
            step={0.1}
            placeholder="80"
            value={data.weightKg ?? ""}
            onChange={(e) => onChange("weightKg", e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>

        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
          <label htmlFor="goalWeight">Objetivo (peso o descripción)</label>
          <input
            id="goalWeight"
            type="text"
            placeholder="Ej: 72 kg, o «verme definido para el verano»"
            value={data.goalWeight ?? ""}
            onChange={(e) => onChange("goalWeight", e.target.value || undefined)}
          />
        </div>

        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
          <label htmlFor="timeline">Velocidad de pérdida</label>
          <select
            id="timeline"
            value={data.timeline ?? ""}
            onChange={(e) => onChange("timeline", e.target.value || undefined)}
          >
            <option value="">Seleccionar…</option>
            <option value="steady">Sostenible y sin prisa (~0.5 kg/semana)</option>
            <option value="fast">Lo más rápido posible (~1 kg/semana)</option>
          </select>
        </div>
      </div>

      <div className={styles.wizardActions}>
        <button className="btn btn-primary" onClick={onNext}>
          Siguiente →
        </button>
      </div>
    </div>
  );
}

// ─── Section 2: Lifestyle ─────────────────────────────────────────────────────

function Section2({
  data,
  onChange,
  onBack,
  onNext,
}: {
  data: NutritionProfileData;
  onChange: (f: keyof NutritionProfileData, v: string | number | boolean | undefined) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <h2 className={styles.sectionTitle}>Sección 2 — Estilo de vida</h2>
      <p className={styles.sectionDesc}>Tu actividad diaria determina cuántas calorías necesitas realmente.</p>

      <div className={styles.formGrid}>
        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
          <label htmlFor="jobType">Tipo de trabajo</label>
          <select
            id="jobType"
            value={data.jobType ?? ""}
            onChange={(e) => onChange("jobType", e.target.value || undefined)}
          >
            <option value="">Seleccionar…</option>
            <option value="Trabajo de escritorio (oficina / teletrabajo)">Escritorio / oficina / teletrabajo</option>
            <option value="Trabajo de pie (dependiente, enfermero, maestro…)">De pie — dependiente, enfermero, maestro…</option>
            <option value="Trabajo físico moderado">Físico moderado — mecánico, mensajero…</option>
            <option value="Trabajo físico intenso (construcción, mudanzas, agricultura)">Físico intenso — construcción, mudanzas, agricultura</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="exercisePerWeek">Días de ejercicio/semana</label>
          <input
            id="exercisePerWeek"
            type="number"
            min={0}
            max={7}
            placeholder="3"
            value={data.exercisePerWeek ?? ""}
            onChange={(e) => onChange("exercisePerWeek", e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="exerciseType">Tipo de ejercicio</label>
          <input
            id="exerciseType"
            type="text"
            placeholder="Pesas, running, crossfit…"
            value={data.exerciseType ?? ""}
            onChange={(e) => onChange("exerciseType", e.target.value || undefined)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="sleepHours">Horas de sueño/noche</label>
          <input
            id="sleepHours"
            type="number"
            min={3}
            max={12}
            step={0.5}
            placeholder="7"
            value={data.sleepHours ?? ""}
            onChange={(e) => onChange("sleepHours", e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="stressLevel">Nivel de estrés</label>
          <select
            id="stressLevel"
            value={data.stressLevel ?? ""}
            onChange={(e) => onChange("stressLevel", e.target.value || undefined)}
          >
            <option value="">Seleccionar…</option>
            <option value="low">Bajo</option>
            <option value="moderate">Moderado</option>
            <option value="high">Alto</option>
          </select>
        </div>

        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
          <label htmlFor="alcohol">Consumo de alcohol</label>
          <input
            id="alcohol"
            type="text"
            placeholder="Ej: 2 cervezas los fines de semana, 1 copa de vino en cenas…"
            value={data.alcohol ?? ""}
            onChange={(e) => onChange("alcohol", e.target.value || undefined)}
          />
          <p className="form-hint">Sé honesto/a — esto se tiene en cuenta en las calorías semanales</p>
        </div>
      </div>

      <div className={styles.wizardActions}>
        <button className="btn btn-secondary" onClick={onBack}>← Atrás</button>
        <button className="btn btn-primary" onClick={onNext}>Siguiente →</button>
      </div>
    </div>
  );
}

// ─── Section 3: Food preferences ─────────────────────────────────────────────

function Section3({
  data,
  onChange,
  onBack,
  onNext,
}: {
  data: NutritionProfileData;
  onChange: (f: keyof NutritionProfileData, v: string | number | boolean | undefined) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <h2 className={styles.sectionTitle}>Sección 3 — Preferencias alimentarias</h2>
      <p className={styles.sectionDesc}>Para construir un plan que realmente quieras seguir.</p>

      <div className={styles.formGrid}>
        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
          <label htmlFor="favoriteMeals">Tus 5 platos o comidas favoritas</label>
          <textarea
            id="favoriteMeals"
            rows={3}
            placeholder="Ej: pizza margarita, pollo al curry, hamburguesas caseras, pasta carbonara, sushi…"
            value={data.favoriteMeals ?? ""}
            onChange={(e) => onChange("favoriteMeals", e.target.value || undefined)}
          />
        </div>

        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
          <label htmlFor="hatedFoods">Alimentos que no soportas y jamás comerías</label>
          <input
            id="hatedFoods"
            type="text"
            placeholder="Ej: pescado, hígado, coliflor, cilantro…"
            value={data.hatedFoods ?? ""}
            onChange={(e) => onChange("hatedFoods", e.target.value || undefined)}
          />
        </div>

        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
          <label htmlFor="restrictions">Restricciones o alergias</label>
          <input
            id="restrictions"
            type="text"
            placeholder="Ej: sin gluten, sin lácteos, alergia a frutos secos… (deja en blanco si ninguna)"
            value={data.dietaryRestrictions ?? ""}
            onChange={(e) => onChange("dietaryRestrictions", e.target.value || undefined)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="cookingStyle">Estilo de cocina preferido</label>
          <select
            id="cookingStyle"
            value={data.cookingStyle ?? ""}
            onChange={(e) => onChange("cookingStyle", e.target.value || undefined)}
          >
            <option value="">Seleccionar…</option>
            <option value="scratch">Cocinar desde cero</option>
            <option value="quick">Comidas rápidas (&lt; 20 min)</option>
            <option value="batch">Meal prep en lote</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="adventurousness">
            Nivel de aventura gastronómica (1–10)
          </label>
          <div className={styles.sliderRow}>
            <input
              id="adventurousness"
              type="range"
              min={1}
              max={10}
              value={data.foodAdventurousness ?? 5}
              onChange={(e) => onChange("foodAdventurousness", Number(e.target.value))}
            />
            <span className={styles.sliderValue}>
              {data.foodAdventurousness ?? 5}
            </span>
          </div>
          <p className="form-hint">1 = solo lo de siempre · 10 = me encanta experimentar</p>
        </div>
      </div>

      <div className={styles.wizardActions}>
        <button className="btn btn-secondary" onClick={onBack}>← Atrás</button>
        <button className="btn btn-primary" onClick={onNext}>Siguiente →</button>
      </div>
    </div>
  );
}

// ─── Section 4: Snack habits ──────────────────────────────────────────────────

function Section4({
  data,
  onChange,
  onBack,
  onGenerate,
  saving,
}: {
  data: NutritionProfileData;
  onChange: (f: keyof NutritionProfileData, v: string | number | boolean | undefined) => void;
  onBack: () => void;
  onGenerate: () => void;
  saving: boolean;
}) {
  return (
    <div>
      <h2 className={styles.sectionTitle}>Sección 4 — Hábitos de snack</h2>
      <p className={styles.sectionDesc}>Los snacks pueden hacer o deshacer un plan. Cuéntame tu realidad.</p>

      <div className={styles.formGrid}>
        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
          <label htmlFor="currentSnacks">¿Qué snacks sueles tomar ahora?</label>
          <input
            id="currentSnacks"
            type="text"
            placeholder="Ej: galletas, frutos secos, patatas fritas, fruta, yogur…"
            value={data.currentSnacks ?? ""}
            onChange={(e) => onChange("currentSnacks", e.target.value || undefined)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="snackReason">¿Por qué picoteas?</label>
          <select
            id="snackReason"
            value={data.snackReason ?? ""}
            onChange={(e) => onChange("snackReason", e.target.value || undefined)}
          >
            <option value="">Seleccionar…</option>
            <option value="hunger">Hambre real</option>
            <option value="boredom">Aburrimiento</option>
            <option value="habit">Hábito (lo hago sin pensar)</option>
            <option value="multiple">Por varios motivos</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="snackPref">Preferencia de sabor</label>
          <select
            id="snackPref"
            value={data.snackPreference ?? ""}
            onChange={(e) => onChange("snackPreference", e.target.value || undefined)}
          >
            <option value="">Seleccionar…</option>
            <option value="sweet">Dulce</option>
            <option value="savory">Salado</option>
            <option value="both">Ambos</option>
          </select>
        </div>

        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={data.lateNightSnacking ?? false}
              onChange={(e) => onChange("lateNightSnacking", e.target.checked)}
            />
            <span>Suelo picar por la noche (después de cenar)</span>
          </label>
        </div>
      </div>

      <div className={styles.generateBox}>
        <p className={styles.generateBoxText}>
          ¡Todo listo! Claude analizará tu perfil completo y generará un plan de nutrición personalizado con calorías, macros, plan semanal, snacks alternativos, reglas personales, hidratación y suplementos.
        </p>
        <div className={styles.wizardActions}>
          <button className="btn btn-secondary" onClick={onBack} disabled={saving}>← Atrás</button>
          <button
            className="btn btn-primary"
            onClick={onGenerate}
            disabled={saving}
          >
            {saving ? "Guardando perfil…" : "Generar mi plan ✦"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Plan Renderer ─────────────────────────────────────────────────────────────

function PlanRenderer({ text, streaming }: { text: string; streaming: boolean }) {
  const lines = text.split("\n");
  const blocks: Array<{ title: string; content: string[] }> = [];
  let current: { title: string; content: string[] } | null = null;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (current) blocks.push(current);
      current = { title: line.slice(3).trim(), content: [] };
      continue;
    }

    if (!current) current = { title: "Resumen", content: [] };
    current.content.push(line);
  }

  if (current) blocks.push(current);

  return (
    <div className={styles.planDocument}>
      {blocks.map((block, blockIndex) => {
        const isWeeklySection = /plan de 7 días|plan de 7 dias/i.test(block.title);
        const weekly = isWeeklySection ? parseWeeklyPlan(block.content) : null;

        return (
          <section key={blockIndex} className={styles.planSectionCard}>
            <h2 className={styles.planSectionTitle}>{block.title}</h2>
            <div className={styles.planSectionBody}>
              {weekly ? <WeeklyPlanGrid days={weekly} /> : renderBlock(block.content)}
            </div>
          </section>
        );
      })}
      {streaming && <span className={styles.cursor}>▌</span>}
    </div>
  );
}

function renderBlock(lines: string[]) {
  const nodes: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];

  const flushList = (key: string) => {
    if (listItems.length > 0) {
      nodes.push(
        <ul key={key} className={styles.planList}>
          {listItems}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, i) => {
    const key = `line-${i}`;
    const trimmed = line.trim();

    if (!trimmed) {
      flushList(`list-${i}`);
      return;
    }

    if (trimmed === "---") {
      flushList(`list-${i}`);
      nodes.push(<hr key={key} className={styles.planHr} />);
      return;
    }

    if (line.startsWith("### ")) {
      flushList(`list-${i}`);
      nodes.push(
        <h3 key={key} className={styles.planSubTitle}>
          {line.slice(4)}
        </h3>
      );
      return;
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      listItems.push(
        <li key={key} className={styles.planListItem}>
          {renderInline(line.slice(2))}
        </li>
      );
      return;
    }

    if (/^\d+\. /.test(line)) {
      listItems.push(
        <li key={key} className={styles.planListItem}>
          {renderInline(line.replace(/^\d+\. /, ""))}
        </li>
      );
      return;
    }

    flushList(`list-${i}`);

    if (line.startsWith("**") && line.endsWith("**") && line.length > 4) {
      nodes.push(
        <p key={key} className={styles.planLead}>
          {line.slice(2, -2)}
        </p>
      );
      return;
    }

    nodes.push(
      <p key={key} className={styles.planParagraph}>
        {renderInline(line)}
      </p>
    );
  });

  flushList("list-final");
  return nodes;
}

function renderInline(text: string): React.ReactNode {
  // Replace **bold** patterns
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
}


function WeeklyPlanGrid({ days }: { days: WeeklyDay[] }) {
  return (
    <>
      <div className={styles.weeklyPlanDesktop}>
        <div className={styles.weeklyGrid} style={{ gridTemplateColumns: `140px repeat(${days.length}, minmax(180px, 1fr))` }}>
          <div className={styles.weeklyCorner} />
          {days.map((day) => (
            <div key={day.day} className={styles.weeklyDayHeader}>{day.day}</div>
          ))}

          {MEAL_ROW_LABELS.map((row) => (
            <>
              <div key={`${row.key}-label`} className={styles.weeklyRowLabel}>{row.label}</div>
              {days.map((day) => (
                <div key={`${day.day}-${row.key}`} className={styles.weeklyCell}>
                  {day[row.key as keyof WeeklyDay] ? (
                    <p className={styles.weeklyCellText}>{day[row.key as keyof WeeklyDay] as string}</p>
                  ) : (
                    <span className={styles.weeklyCellEmpty}>—</span>
                  )}
                </div>
              ))}
            </>
          ))}
        </div>
      </div>

      <div className={styles.weeklyPlanMobile}>
        {days.map((day) => (
          <article key={day.day} className={styles.mobileDayCard}>
            <h3 className={styles.mobileDayTitle}>{day.day}</h3>
            {MEAL_ROW_LABELS.map((row) => {
              const value = day[row.key as keyof WeeklyDay] as string | undefined;
              if (!value) return null;
              return (
                <div key={`${day.day}-${row.key}`} className={styles.mobileMealRow}>
                  <span className={styles.mobileMealLabel}>{row.label}</span>
                  <p className={styles.mobileMealValue}>{value}</p>
                </div>
              );
            })}
          </article>
        ))}
      </div>
    </>
  );
}
