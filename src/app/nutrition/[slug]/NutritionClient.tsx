"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { NutritionProfileData } from "@/actions/nutrition";
import { saveNutritionProfile, saveNutritionPlan } from "@/actions/nutrition";
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
    sex: p.sex ?? undefined,
    heightCm: p.heightCm ?? undefined,
    weightKg: p.weightKg ?? undefined,
    goalWeight: p.goalWeight ?? undefined,
    timeline: p.timeline ?? undefined,
    jobType: p.jobType ?? undefined,
    exercisePerWeek: p.exercisePerWeek ?? undefined,
    exerciseType: p.exerciseType ?? undefined,
    sleepHours: p.sleepHours ?? undefined,
    stressLevel: p.stressLevel ?? undefined,
    alcohol: p.alcohol ?? undefined,
    favoriteMeals: p.favoriteMeals ?? undefined,
    hatedFoods: p.hatedFoods ?? undefined,
    dietaryRestrictions: p.dietaryRestrictions ?? undefined,
    cookingStyle: p.cookingStyle ?? undefined,
    foodAdventurousness: p.foodAdventurousness ?? undefined,
    currentSnacks: p.currentSnacks ?? undefined,
    snackReason: p.snackReason ?? undefined,
    snackPreference: p.snackPreference ?? undefined,
    lateNightSnacking: p.lateNightSnacking ?? false,
  };
}

const TOTAL_STEPS = 4;

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
  const planRef = useRef<HTMLDivElement>(null);

  function update(field: keyof NutritionProfileData, value: string | number | boolean | undefined) {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
      await saveNutritionPlan(profileId, fullText);
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
          </div>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: "var(--space-4)" }}>
            {error}
            {error.includes("ANTHROPIC_API_KEY") && (
              <p style={{ marginTop: "var(--space-2)", fontSize: "var(--text-sm)" }}>
                Añade tu clave de API en el archivo <code>.env</code>: <code>ANTHROPIC_API_KEY="sk-..."</code>
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
  // Simple markdown-like rendering: split into lines and format headers + bold
  const lines = text.split("\n");

  return (
    <div className={styles.planText}>
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return <h2 key={i} className={styles.planH2}>{line.slice(3)}</h2>;
        }
        if (line.startsWith("### ")) {
          return <h3 key={i} className={styles.planH3}>{line.slice(4)}</h3>;
        }
        if (line.startsWith("**") && line.endsWith("**") && line.length > 4) {
          return <p key={i} className={styles.planBold}>{line.slice(2, -2)}</p>;
        }
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return <li key={i} className={styles.planLi}>{renderInline(line.slice(2))}</li>;
        }
        if (/^\d+\. /.test(line)) {
          return <li key={i} className={styles.planLi}>{renderInline(line.replace(/^\d+\. /, ""))}</li>;
        }
        if (line.trim() === "---") {
          return <hr key={i} className={styles.planHr} />;
        }
        if (line.trim() === "") {
          return <div key={i} className={styles.planSpacer} />;
        }
        return <p key={i} className={styles.planP}>{renderInline(line)}</p>;
      })}
      {streaming && <span className={styles.cursor}>▌</span>}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  // Replace **bold** patterns
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
}
