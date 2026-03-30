import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { NutritionProfileData } from "@/actions/nutrition";

interface GenerateBody {
  profile: NutritionProfileData;
  personName: string;
}

function buildPrompt(name: string, p: NutritionProfileData): string {
  const sex = p.sex === "MALE" ? "Hombre" : p.sex === "FEMALE" ? "Mujer" : "No especificado";
  const stress: Record<string, string> = { low: "bajo", moderate: "moderado", high: "alto" };
  const cooking: Record<string, string> = {
    scratch: "cocinar desde cero",
    quick: "comidas rápidas",
    batch: "meal prep en lote",
  };
  const snackReason: Record<string, string> = {
    hunger: "hambre real",
    boredom: "aburrimiento",
    habit: "hábito",
    multiple: "varios motivos",
  };
  const snackPref: Record<string, string> = {
    sweet: "dulce",
    savory: "salado",
    both: "ambos",
  };

  return `Actúa como un nutricionista experto con 30 años de experiencia ayudando a personas a perder grasa corporal de forma sostenible. Tu tono es cercano, motivador y directo — como un amigo brillante con titulación en nutrición.

Crea un plan de nutrición completamente personalizado para **${name}** basándote en la siguiente información:

---

**SECCIÓN 1 — DATOS PERSONALES**
- Edad: ${p.age ?? "no especificada"} años
- Sexo biológico: ${sex}
- Altura: ${p.heightCm ?? "no especificada"} cm
- Peso actual: ${p.weightKg ?? "no especificado"} kg
- Objetivo de peso/aspecto: ${p.goalWeight ?? "no especificado"}
- Velocidad de pérdida deseada: ${p.timeline ?? "no especificada"}

**SECCIÓN 2 — ESTILO DE VIDA**
- Tipo de trabajo: ${p.jobType ?? "no especificado"}
- Ejercicio: ${p.exercisePerWeek ?? 0} veces/semana — ${p.exerciseType ?? "no especificado"}
- Horas de sueño: ${p.sleepHours ?? "no especificadas"} h/noche
- Nivel de estrés: ${p.stressLevel ? (stress[p.stressLevel] ?? p.stressLevel) : "no especificado"}
- Alcohol: ${p.alcohol ?? "no especificado"}

**SECCIÓN 3 — PREFERENCIAS ALIMENTARIAS**
- Platos favoritos: ${p.favoriteMeals ?? "no especificados"}
- Alimentos que detesta: ${p.hatedFoods ?? "ninguno"}
- Restricciones/alergias: ${p.dietaryRestrictions || "ninguna"}
- Estilo de cocina preferido: ${p.cookingStyle ? (cooking[p.cookingStyle] ?? p.cookingStyle) : "no especificado"}
- Nivel de aventura gastronómica: ${p.foodAdventurousness ?? "no especificado"}/10

**SECCIÓN 4 — HÁBITOS DE SNACK**
- Snacks actuales: ${p.currentSnacks ?? "no especificados"}
- Razón para picar: ${p.snackReason ? (snackReason[p.snackReason] ?? p.snackReason) : "no especificada"}
- Preferencia: ${p.snackPreference ? (snackPref[p.snackPreference] ?? p.snackPreference) : "no especificada"}
- Picar por la noche: ${p.lateNightSnacking ? "Sí" : "No"}

---

Proporciona un plan completo con las siguientes 8 secciones en **español** y con formato Markdown claro:

## 1. ⚠️ AVISO SOBRE CALCULADORAS ONLINE
Explica brevemente por qué las calculadoras online son inexactas y que el mejor dato es el real.

## 2. 🔢 CÁLCULO DE CALORÍAS
Usa la fórmula Mifflin-St Jeor paso a paso:
- Hombres: (10 × kg) + (6.25 × cm) − (5 × edad) + 5
- Mujeres: (10 × kg) + (6.25 × cm) − (5 × edad) − 161
Aplica el multiplicador de actividad correcto. Establece un déficit de 500 kcal. Muestra el cálculo completo.

## 3. 🥩 OBJETIVOS DIARIOS DE MACROS
Proteínas, carbohidratos y grasas en gramos con justificación clara.

## 4. 📅 PLAN DE 7 DÍAS
Un día temático por día (ej: "Lunes Mediterráneo"). Para cada día: desayuno, comida, cena y postre opcional. Incluye calorías y macros por comida. Señala los platos aptos para meal prep. Incluye al menos 2 comidas a la semana que parezcan un capricho pero sean bajas en calorías. Usa las comidas favoritas de ${name} como inspiración. Nada de pollo con brócoli aburrido a menos que ${name} lo haya pedido.

## 5. 🍎 ALTERNATIVAS DE SNACK
Para cada snack actual, sugiere una alternativa más saludable que llene el mismo hueco. Mínimo 5 opciones con calorías. Hazlos apetecibles.

## 6. 📋 5 REGLAS PERSONALES
Cinco reglas específicas para ${name} basadas en su situación. No genéricas — que sean realmente suyas.

## 7. 📈 TIMELINE REALISTA
Proyección semana a semana o mes a mes. Sin promesas falsas pero con motivación real.

## 8. 💧 OBJETIVO DE HIDRATACIÓN
Calcula con: 35 ml × kg + 500 ml por hora de ejercicio (+ extra si trabajo físico). Explica la conexión con la pérdida de grasa. 3-4 consejos prácticos para ${name}.

## 9. 💊 SUPLEMENTOS
Solo los que tengan evidencia científica sólida. Para cada uno: dosis, mejor momento, por qué es relevante para ${name} específicamente, opción económica.

---
Recuerda: tono cálido, directo y motivador. ${name} debe sentir que tiene un nutricionista de primer nivel en su equipo.`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY no configurada. Añádela al archivo .env" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: GenerateBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Cuerpo de la petición inválido" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const client = new Anthropic({ apiKey });

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = client.messages.stream({
          model: "claude-opus-4-6",
          max_tokens: 64000,
          thinking: { type: "adaptive" },
          messages: [
            {
              role: "user",
              content: buildPrompt(body.personName, body.profile),
            },
          ],
        });

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(new TextEncoder().encode(event.delta.text));
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error desconocido";
        controller.enqueue(new TextEncoder().encode(`\n\n**Error:** ${msg}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
