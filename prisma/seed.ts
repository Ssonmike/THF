import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Persons ────────────────────────────────────────────────────────────────
  const miguel = await prisma.person.upsert({
    where: { slug: "miguel" },
    update: {},
    create: { name: "Miguel", slug: "miguel" },
  });

  const ana = await prisma.person.upsert({
    where: { slug: "ana" },
    update: {},
    create: { name: "Ana", slug: "ana" },
  });

  console.log("✓ Persons:", miguel.name, ana.name);

  // ── Helpers ────────────────────────────────────────────────────────────────
  type RecipeCreate = Parameters<typeof prisma.recipe.upsert>[0]["create"];

  async function upsertRecipe(id: string, data: Omit<RecipeCreate, "id">) {
    return prisma.recipe.upsert({
      where: { id },
      update: {},
      create: { id, ...data },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DESAYUNO — alto en proteína, saciante, fácil de preparar
  // ═══════════════════════════════════════════════════════════════════════════

  await upsertRecipe("recipe-avena", {
    name: "Porridge de avena con plátano",
    description: "Desayuno clásico saciante. Añade proteína en polvo para potenciar los macros.",
    mealType: "BREAKFAST",
    prepTime: 2,
    cookTime: 5,
    instructions:
      "1. Mezcla los copos de avena con la leche en un cazo a fuego medio.\n2. Remueve constantemente hasta que espese (3-5 min).\n3. Sirve en un bol con el plátano en rodajas y la miel por encima.",
    caloriesPerServing: 290,
    proteinPerServing: 9,
    carbsPerServing: 50,
    fatPerServing: 6,
    ingredients: {
      create: [
        { name: "copos de avena", quantity: 60, unit: "g" },
        { name: "leche semidesnatada", quantity: 200, unit: "ml" },
        { name: "plátano", quantity: 1, unit: "unit" },
        { name: "miel", quantity: 10, unit: "g" },
      ],
    },
  });

  await upsertRecipe("recipe-tostadas-aguacate-huevo", {
    name: "Tostadas con aguacate y huevo pochado",
    description: "Desayuno completo con grasas buenas y proteína. Rápido y muy saciante.",
    mealType: "BREAKFAST",
    prepTime: 5,
    cookTime: 5,
    instructions:
      "1. Tuesta el pan integral.\n2. Aplasta el aguacate con sal, pimienta y unas gotas de limón.\n3. Calienta agua con un chorrito de vinagre y pocha los huevos 3 min.\n4. Extiende el aguacate sobre las tostadas y coloca el huevo encima. Añade copos de chile si quieres.",
    caloriesPerServing: 360,
    proteinPerServing: 18,
    carbsPerServing: 28,
    fatPerServing: 20,
    ingredients: {
      create: [
        { name: "pan integral", quantity: 2, unit: "unit" },
        { name: "aguacate", quantity: 80, unit: "g" },
        { name: "huevos", quantity: 2, unit: "unit" },
        { name: "limón", quantity: 0.25, unit: "unit" },
        { name: "sal", quantity: 1, unit: "tsp" },
        { name: "pimienta negra", quantity: 0.5, unit: "tsp" },
      ],
    },
  });

  await upsertRecipe("recipe-yogur-granola", {
    name: "Yogur griego con granola y frutos rojos",
    description: "Alto en proteína, probióticos y antioxidantes. Listo en 2 minutos.",
    mealType: "BREAKFAST",
    prepTime: 2,
    cookTime: 0,
    instructions:
      "1. Pon el yogur griego en un bol.\n2. Añade la granola, los frutos rojos y la miel.\n3. Opcional: espolvorea semillas de chía para más fibra y omega-3.",
    caloriesPerServing: 320,
    proteinPerServing: 22,
    carbsPerServing: 32,
    fatPerServing: 9,
    ingredients: {
      create: [
        { name: "yogur griego 0%", quantity: 200, unit: "g" },
        { name: "granola sin azúcar", quantity: 40, unit: "g" },
        { name: "frutos rojos", quantity: 80, unit: "g" },
        { name: "miel", quantity: 10, unit: "g" },
        { name: "semillas de chía", quantity: 5, unit: "g" },
      ],
    },
  });

  await upsertRecipe("recipe-revuelto-claras-espinacas", {
    name: "Revuelto de claras con espinacas y queso",
    description: "Muy alto en proteína, bajo en grasa y carbohidratos. Ideal para déficit calórico.",
    mealType: "BREAKFAST",
    prepTime: 3,
    cookTime: 5,
    instructions:
      "1. Calienta una sartén antiadherente con unas gotas de aceite.\n2. Saltea las espinacas 1 min hasta que se reduzcan.\n3. Vierte las claras y remueve suavemente hasta que cuajen.\n4. Añade el queso fresco desmenuzado y salpimenta. Sirve inmediatamente.",
    caloriesPerServing: 240,
    proteinPerServing: 30,
    carbsPerServing: 4,
    fatPerServing: 10,
    ingredients: {
      create: [
        { name: "claras de huevo", quantity: 200, unit: "ml" },
        { name: "espinacas frescas", quantity: 80, unit: "g" },
        { name: "queso fresco batido", quantity: 50, unit: "g" },
        { name: "aceite de oliva", quantity: 5, unit: "ml" },
        { name: "sal", quantity: 1, unit: "tsp" },
        { name: "pimienta negra", quantity: 0.5, unit: "tsp" },
      ],
    },
  });

  await upsertRecipe("recipe-batido-proteico", {
    name: "Batido proteico de plátano y cacao",
    description: "Desayuno rápido para días con prisa. Rico en proteína y con energía sostenida.",
    mealType: "BREAKFAST",
    prepTime: 3,
    cookTime: 0,
    instructions:
      "1. Pon todos los ingredientes en la batidora.\n2. Tritura hasta obtener una textura suave y cremosa.\n3. Si queda muy espeso, añade más leche. Toma inmediatamente.",
    caloriesPerServing: 350,
    proteinPerServing: 30,
    carbsPerServing: 38,
    fatPerServing: 7,
    ingredients: {
      create: [
        { name: "leche semidesnatada", quantity: 250, unit: "ml" },
        { name: "proteína en polvo (sabor vainilla)", quantity: 30, unit: "g" },
        { name: "plátano", quantity: 1, unit: "unit" },
        { name: "cacao puro en polvo", quantity: 10, unit: "g" },
        { name: "copos de avena", quantity: 20, unit: "g" },
      ],
    },
  });

  await upsertRecipe("recipe-tostadas-salmon", {
    name: "Tostadas con salmón ahumado y queso crema",
    description: "Proteína + omega-3 desde el primer momento del día. Rápido y elegante.",
    mealType: "BREAKFAST",
    prepTime: 5,
    cookTime: 2,
    instructions:
      "1. Tuesta el pan integral.\n2. Extiende el queso crema sobre las tostadas.\n3. Coloca el salmón ahumado por encima.\n4. Añade unas alcaparras, eneldo y unas gotas de limón.",
    caloriesPerServing: 330,
    proteinPerServing: 24,
    carbsPerServing: 26,
    fatPerServing: 14,
    ingredients: {
      create: [
        { name: "pan integral", quantity: 2, unit: "unit" },
        { name: "salmón ahumado", quantity: 60, unit: "g" },
        { name: "queso crema light", quantity: 40, unit: "g" },
        { name: "alcaparras", quantity: 10, unit: "g" },
        { name: "limón", quantity: 0.25, unit: "unit" },
        { name: "eneldo fresco", quantity: 1, unit: "tsp" },
      ],
    },
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // COMIDA — platos principales, alta proteína, mediterráneo
  // ═══════════════════════════════════════════════════════════════════════════

  await upsertRecipe("recipe-tortilla", {
    name: "Tortilla española",
    description: "Tortilla clásica con cebolla, suave y jugosa.",
    mealType: "LUNCH",
    prepTime: 15,
    cookTime: 20,
    instructions:
      "1. Pela y corta las patatas en láminas finas. Corta la cebolla en juliana.\n2. Pocha las patatas con la cebolla en aceite a fuego medio-bajo 20 min.\n3. Escurre el aceite. Bate los huevos con sal y mezcla con las patatas.\n4. Cuaja la tortilla a fuego medio por ambos lados.",
    caloriesPerServing: 380,
    proteinPerServing: 14,
    carbsPerServing: 28,
    fatPerServing: 22,
    ingredients: {
      create: [
        { name: "patatas", quantity: 300, unit: "g" },
        { name: "huevos", quantity: 3, unit: "unit" },
        { name: "cebolla", quantity: 100, unit: "g" },
        { name: "aceite de oliva", quantity: 50, unit: "ml" },
        { name: "sal", quantity: 1, unit: "tsp" },
      ],
    },
  });

  await upsertRecipe("recipe-lentejas", {
    name: "Lentejas con verduras",
    description: "Lentejas caseras con zanahoria, puerro y chorizo.",
    mealType: "LUNCH",
    prepTime: 10,
    cookTime: 35,
    instructions:
      "1. Sofríe la cebolla, zanahoria y puerro cortados. Añade el chorizo en rodajas.\n2. Agrega las lentejas lavadas y cubre con agua o caldo.\n3. Cocina a fuego medio 30-35 min hasta que estén tiernas. Ajusta sal.",
    caloriesPerServing: 320,
    proteinPerServing: 18,
    carbsPerServing: 42,
    fatPerServing: 8,
    ingredients: {
      create: [
        { name: "lentejas", quantity: 100, unit: "g" },
        { name: "zanahoria", quantity: 80, unit: "g" },
        { name: "puerro", quantity: 60, unit: "g" },
        { name: "cebolla", quantity: 60, unit: "g" },
        { name: "chorizo", quantity: 40, unit: "g" },
        { name: "aceite de oliva", quantity: 15, unit: "ml" },
        { name: "sal", quantity: 1, unit: "tsp" },
      ],
    },
  });

  await upsertRecipe("recipe-pollo-boniato-brocoli", {
    name: "Pollo al horno con boniato y brócoli",
    description: "El plato de déficit calórico por excelencia. Muy saciante y altísimo en proteína.",
    mealType: "LUNCH",
    prepTime: 10,
    cookTime: 35,
    instructions:
      "1. Precalienta el horno a 200°C.\n2. Corta el boniato en dados y el brócoli en ramilletes. Mezcla con aceite, sal, ajo y pimentón.\n3. Coloca todo en una bandeja con la pechuga de pollo. Sazona el pollo con sal, pimienta y orégano.\n4. Hornea 30-35 min hasta que el pollo esté dorado y el boniato tierno.",
    caloriesPerServing: 440,
    proteinPerServing: 42,
    carbsPerServing: 35,
    fatPerServing: 12,
    ingredients: {
      create: [
        { name: "pechuga de pollo", quantity: 200, unit: "g" },
        { name: "boniato", quantity: 150, unit: "g" },
        { name: "brócoli", quantity: 150, unit: "g" },
        { name: "aceite de oliva", quantity: 15, unit: "ml" },
        { name: "ajo en polvo", quantity: 1, unit: "tsp" },
        { name: "pimentón dulce", quantity: 1, unit: "tsp" },
        { name: "sal", quantity: 1, unit: "tsp" },
        { name: "orégano", quantity: 1, unit: "tsp" },
      ],
    },
  });

  await upsertRecipe("recipe-salmon-esparragos", {
    name: "Salmón al horno con espárragos",
    description: "Omega-3, proteína completa y verduras en un solo plato. Listo en 20 minutos.",
    mealType: "LUNCH",
    prepTime: 5,
    cookTime: 18,
    instructions:
      "1. Precalienta el horno a 200°C.\n2. Coloca el salmón en una bandeja. Alíñalo con aceite, limón, sal, pimienta y eneldo.\n3. Rodea el salmón con los espárragos aliñados con aceite y sal.\n4. Hornea 15-18 min. El salmón está listo cuando se separa en lascas fácilmente.",
    caloriesPerServing: 390,
    proteinPerServing: 38,
    carbsPerServing: 6,
    fatPerServing: 22,
    isFavorite: true,
    ingredients: {
      create: [
        { name: "lomo de salmón", quantity: 180, unit: "g" },
        { name: "espárragos trigueros", quantity: 200, unit: "g" },
        { name: "aceite de oliva", quantity: 15, unit: "ml" },
        { name: "limón", quantity: 0.5, unit: "unit" },
        { name: "sal", quantity: 1, unit: "tsp" },
        { name: "pimienta negra", quantity: 0.5, unit: "tsp" },
        { name: "eneldo seco", quantity: 1, unit: "tsp" },
      ],
    },
  });

  await upsertRecipe("recipe-pasta-pavo", {
    name: "Pasta integral con boloñesa de pavo",
    description: "La boloñesa más ligera. Pavo en vez de ternera, mucha proteína y menos grasa.",
    mealType: "LUNCH",
    prepTime: 10,
    cookTime: 25,
    instructions:
      "1. Cuece la pasta integral según el paquete. Reserva.\n2. Sofríe la cebolla y el ajo picados en aceite. Añade el pavo picado y dora bien.\n3. Agrega el tomate triturado, orégano, sal y pimienta. Cocina 15 min a fuego medio.\n4. Mezcla con la pasta y sirve con parmesano rallado.",
    caloriesPerServing: 490,
    proteinPerServing: 40,
    carbsPerServing: 52,
    fatPerServing: 10,
    ingredients: {
      create: [
        { name: "pasta integral", quantity: 80, unit: "g" },
        { name: "pechuga de pavo picada", quantity: 180, unit: "g" },
        { name: "tomate triturado", quantity: 200, unit: "g" },
        { name: "cebolla", quantity: 60, unit: "g" },
        { name: "ajo", quantity: 2, unit: "unit" },
        { name: "aceite de oliva", quantity: 10, unit: "ml" },
        { name: "parmesano rallado", quantity: 15, unit: "g" },
        { name: "orégano", quantity: 1, unit: "tsp" },
        { name: "sal", quantity: 1, unit: "tsp" },
      ],
    },
  });

  await upsertRecipe("recipe-arroz-pollo-curry", {
    name: "Arroz integral con pollo al curry",
    description: "Plato completo con proteína, carbohidratos de calidad y especias antiinflamatorias.",
    mealType: "LUNCH",
    prepTime: 10,
    cookTime: 30,
    instructions:
      "1. Cuece el arroz integral según el paquete (unos 25-30 min).\n2. Corta el pollo en dados. Sofríe con cebolla y ajo hasta dorar.\n3. Añade el curry, cúrcuma y comino. Remueve 1 min.\n4. Agrega la leche de coco y cocina 10 min hasta que la salsa espese. Sirve sobre el arroz.",
    caloriesPerServing: 470,
    proteinPerServing: 38,
    carbsPerServing: 48,
    fatPerServing: 12,
    ingredients: {
      create: [
        { name: "arroz integral", quantity: 80, unit: "g" },
        { name: "pechuga de pollo", quantity: 180, unit: "g" },
        { name: "leche de coco light", quantity: 100, unit: "ml" },
        { name: "cebolla", quantity: 60, unit: "g" },
        { name: "ajo", quantity: 2, unit: "unit" },
        { name: "curry en polvo", quantity: 2, unit: "tsp" },
        { name: "cúrcuma", quantity: 1, unit: "tsp" },
        { name: "aceite de oliva", quantity: 10, unit: "ml" },
        { name: "sal", quantity: 1, unit: "tsp" },
      ],
    },
  });

  await upsertRecipe("recipe-garbanzos-espinacas", {
    name: "Garbanzos con espinacas y huevo",
    description: "Plato vegetal muy completo. Proteína vegetal + hierro + huevo para completar aminoácidos.",
    mealType: "LUNCH",
    prepTime: 5,
    cookTime: 15,
    instructions:
      "1. Sofríe el ajo y la cebolla picados en aceite.\n2. Añade el pimentón y remueve brevemente. Agrega los garbanzos cocidos y las espinacas.\n3. Cocina 5 min hasta que las espinacas se reduzcan.\n4. Crea un hueco y casca los huevos. Tapa y cocina 3-4 min hasta que cuajen.",
    caloriesPerServing: 380,
    proteinPerServing: 22,
    carbsPerServing: 38,
    fatPerServing: 14,
    ingredients: {
      create: [
        { name: "garbanzos cocidos", quantity: 200, unit: "g" },
        { name: "espinacas frescas", quantity: 120, unit: "g" },
        { name: "huevos", quantity: 2, unit: "unit" },
        { name: "cebolla", quantity: 60, unit: "g" },
        { name: "ajo", quantity: 2, unit: "unit" },
        { name: "pimentón dulce", quantity: 1, unit: "tsp" },
        { name: "aceite de oliva", quantity: 15, unit: "ml" },
        { name: "sal", quantity: 1, unit: "tsp" },
      ],
    },
  });

  await upsertRecipe("recipe-merluza-horno", {
    name: "Merluza al horno con patatas y pimientos",
    description: "Pescado blanco muy magro con patatas. Clásico español, ligero y nutritivo.",
    mealType: "LUNCH",
    prepTime: 10,
    cookTime: 30,
    instructions:
      "1. Precalienta el horno a 190°C.\n2. Coloca las patatas en rodajas en la base de la bandeja con aceite y sal. Hornea 15 min.\n3. Añade el pimiento en tiras y los lomos de merluza encima. Sazona con sal, ajo y perejil.\n4. Hornea 15 min más. Riega con un chorrito de vino blanco a mitad de cocción.",
    caloriesPerServing: 360,
    proteinPerServing: 34,
    carbsPerServing: 30,
    fatPerServing: 9,
    ingredients: {
      create: [
        { name: "lomo de merluza", quantity: 200, unit: "g" },
        { name: "patatas", quantity: 150, unit: "g" },
        { name: "pimiento rojo", quantity: 80, unit: "g" },
        { name: "aceite de oliva", quantity: 20, unit: "ml" },
        { name: "ajo en polvo", quantity: 1, unit: "tsp" },
        { name: "perejil fresco", quantity: 1, unit: "tbsp" },
        { name: "vino blanco", quantity: 30, unit: "ml" },
        { name: "sal", quantity: 1, unit: "tsp" },
      ],
    },
  });

  await upsertRecipe("recipe-ensalada-quinoa-atun", {
    name: "Ensalada de quinoa, atún y aguacate",
    description: "Proteína completa, grasas buenas y fibra. Fresquísima y lista en 15 minutos.",
    mealType: "LUNCH",
    prepTime: 10,
    cookTime: 12,
    instructions:
      "1. Cuece la quinoa en el doble de agua con sal durante 12 min. Deja enfriar.\n2. Mezcla la quinoa con el atún escurrido, el aguacate en dados y el pepino.\n3. Aliña con aceite, limón, sal y cilantro o perejil.",
    caloriesPerServing: 380,
    proteinPerServing: 28,
    carbsPerServing: 30,
    fatPerServing: 16,
    isFavorite: true,
    ingredients: {
      create: [
        { name: "quinoa", quantity: 70, unit: "g" },
        { name: "atún en agua", quantity: 120, unit: "g" },
        { name: "aguacate", quantity: 70, unit: "g" },
        { name: "pepino", quantity: 80, unit: "g" },
        { name: "tomate cherry", quantity: 60, unit: "g" },
        { name: "aceite de oliva", quantity: 15, unit: "ml" },
        { name: "limón", quantity: 0.5, unit: "unit" },
        { name: "sal", quantity: 1, unit: "tsp" },
      ],
    },
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MERIENDA — proteína, sin picos de azúcar, saciante
  // ═══════════════════════════════════════════════════════════════════════════

  await upsertRecipe("recipe-yogur-nueces", {
    name: "Yogur griego con nueces y miel",
    description: "Merienda proteica con grasas buenas. Sencilla, saciante y sin procesar.",
    mealType: "SNACK",
    prepTime: 2,
    cookTime: 0,
    instructions: "1. Pon el yogur griego en un bol.\n2. Añade las nueces troceadas y la miel por encima.\n3. Opcional: espolvorea canela.",
    caloriesPerServing: 210,
    proteinPerServing: 15,
    carbsPerServing: 14,
    fatPerServing: 10,
    ingredients: {
      create: [
        { name: "yogur griego 0%", quantity: 170, unit: "g" },
        { name: "nueces", quantity: 20, unit: "g" },
        { name: "miel", quantity: 8, unit: "g" },
      ],
    },
  });

  await upsertRecipe("recipe-tostada-cottage", {
    name: "Tostada con queso cottage y tomate",
    description: "Muy alta en proteína y baja en calorías. El queso cottage es el secreto.",
    mealType: "SNACK",
    prepTime: 3,
    cookTime: 2,
    instructions:
      "1. Tuesta la rebanada de pan integral.\n2. Extiende el queso cottage generosamente.\n3. Coloca rodajas de tomate encima, sal, aceite y unas hojas de albahaca.",
    caloriesPerServing: 180,
    proteinPerServing: 16,
    carbsPerServing: 20,
    fatPerServing: 4,
    ingredients: {
      create: [
        { name: "pan integral", quantity: 1, unit: "unit" },
        { name: "queso cottage", quantity: 80, unit: "g" },
        { name: "tomate", quantity: 80, unit: "g" },
        { name: "aceite de oliva", quantity: 5, unit: "ml" },
        { name: "albahaca fresca", quantity: 3, unit: "g" },
        { name: "sal", quantity: 1, unit: "tsp" },
      ],
    },
  });

  await upsertRecipe("recipe-edamame", {
    name: "Edamame con sal marina",
    description: "Snack proteico vegetal rapidísimo. Ideal para picar sin estropear el déficit.",
    mealType: "SNACK",
    prepTime: 1,
    cookTime: 5,
    instructions:
      "1. Cuece el edamame congelado en agua hirviendo con sal 4-5 min.\n2. Escurre bien.\n3. Espolvorea con escamas de sal marina y sirve en el propio vaso.",
    caloriesPerServing: 150,
    proteinPerServing: 12,
    carbsPerServing: 10,
    fatPerServing: 5,
    ingredients: {
      create: [
        { name: "edamame congelado", quantity: 150, unit: "g" },
        { name: "sal marina en escamas", quantity: 1, unit: "tsp" },
      ],
    },
  });

  await upsertRecipe("recipe-manzana-cacahuete", {
    name: "Manzana con mantequilla de cacahuete",
    description: "Carbohidratos + proteína + grasa. Merienda perfecta para aguantar hasta la cena.",
    mealType: "SNACK",
    prepTime: 3,
    cookTime: 0,
    instructions:
      "1. Lava y corta la manzana en gajos.\n2. Sirve con la mantequilla de cacahuete como dip.\n3. Usa mantequilla de cacahuete 100% sin azúcar añadido.",
    caloriesPerServing: 220,
    proteinPerServing: 8,
    carbsPerServing: 26,
    fatPerServing: 10,
    ingredients: {
      create: [
        { name: "manzana", quantity: 1, unit: "unit" },
        { name: "mantequilla de cacahuete natural", quantity: 30, unit: "g" },
      ],
    },
  });

  await upsertRecipe("recipe-huevo-zanahoria", {
    name: "Huevo duro con bastones de zanahoria",
    description: "Merienda mínima y efectiva. Proteína completa + fibra + apenas calorías.",
    mealType: "SNACK",
    prepTime: 2,
    cookTime: 10,
    instructions:
      "1. Cuece los huevos en agua hirviendo 10 min. Enfría y pela.\n2. Corta la zanahoria en bastones.\n3. Sirve con un pellizco de sal y pimienta en el huevo.",
    caloriesPerServing: 140,
    proteinPerServing: 10,
    carbsPerServing: 7,
    fatPerServing: 6,
    ingredients: {
      create: [
        { name: "huevos", quantity: 2, unit: "unit" },
        { name: "zanahoria", quantity: 100, unit: "g" },
        { name: "sal", quantity: 0.5, unit: "tsp" },
      ],
    },
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CENA — ligera, alta en proteína, baja en carbohidratos
  // ═══════════════════════════════════════════════════════════════════════════

  await upsertRecipe("recipe-ensalada", {
    name: "Ensalada de pollo a la plancha",
    description: "Cena ligera con proteína, grasas buenas y verdura. La opción diaria de déficit.",
    mealType: "DINNER",
    prepTime: 10,
    cookTime: 10,
    instructions:
      "1. Marca la pechuga de pollo a la plancha con sal y pimienta. Deja reposar y corta en tiras.\n2. Mezcla la lechuga, tomate cherry y aguacate en un bol.\n3. Añade el pollo y aliña con aceite, limón y sal.",
    caloriesPerServing: 310,
    proteinPerServing: 32,
    carbsPerServing: 8,
    fatPerServing: 16,
    ingredients: {
      create: [
        { name: "pechuga de pollo", quantity: 150, unit: "g" },
        { name: "lechuga", quantity: 80, unit: "g" },
        { name: "tomate cherry", quantity: 100, unit: "g" },
        { name: "aguacate", quantity: 60, unit: "g" },
        { name: "aceite de oliva", quantity: 15, unit: "ml" },
        { name: "limón", quantity: 0.5, unit: "unit" },
        { name: "sal", quantity: 1, unit: "tsp" },
      ],
    },
  });

  await upsertRecipe("recipe-pollo-limon-judias", {
    name: "Pechuga al limón con judías verdes",
    description: "Cena clásica de definición. Muy fácil, muy limpia y mucha proteína.",
    mealType: "DINNER",
    prepTime: 5,
    cookTime: 15,
    instructions:
      "1. Aplana ligeramente la pechuga para que se cocine uniformemente.\n2. Marca en sartén caliente con aceite 5-6 min por cada lado.\n3. Riega con el zumo de limón y sazona. Deja reposar 3 min.\n4. Cuece las judías verdes al vapor 8-10 min. Sirve con sal y un hilo de aceite.",
    caloriesPerServing: 300,
    proteinPerServing: 40,
    carbsPerServing: 10,
    fatPerServing: 10,
    isFavorite: true,
    ingredients: {
      create: [
        { name: "pechuga de pollo", quantity: 180, unit: "g" },
        { name: "judías verdes", quantity: 200, unit: "g" },
        { name: "limón", quantity: 1, unit: "unit" },
        { name: "aceite de oliva", quantity: 10, unit: "ml" },
        { name: "sal", quantity: 1, unit: "tsp" },
        { name: "ajo en polvo", quantity: 0.5, unit: "tsp" },
        { name: "pimienta negra", quantity: 0.5, unit: "tsp" },
      ],
    },
  });

  await upsertRecipe("recipe-salmon-brocoli", {
    name: "Salmón a la plancha con brócoli al vapor",
    description: "Cena ideal para quemar grasa. Proteína + omega-3 + verdura crucífera.",
    mealType: "DINNER",
    prepTime: 5,
    cookTime: 15,
    instructions:
      "1. Cuece el brócoli al vapor 8-10 min hasta que esté tierno pero con mordida.\n2. Calienta una sartén y marca el salmón 3-4 min por cada lado con sal y pimienta.\n3. Sirve el salmón sobre el brócoli. Aliña con limón y aceite de oliva virgen extra.",
    caloriesPerServing: 340,
    proteinPerServing: 36,
    carbsPerServing: 8,
    fatPerServing: 18,
    ingredients: {
      create: [
        { name: "lomo de salmón", quantity: 160, unit: "g" },
        { name: "brócoli", quantity: 200, unit: "g" },
        { name: "aceite de oliva", quantity: 10, unit: "ml" },
        { name: "limón", quantity: 0.5, unit: "unit" },
        { name: "sal", quantity: 1, unit: "tsp" },
        { name: "pimienta negra", quantity: 0.5, unit: "tsp" },
      ],
    },
  });

  await upsertRecipe("recipe-tortilla-francesa", {
    name: "Tortilla francesa con ensalada verde",
    description: "Cena rápida y proteica. Perfecta cuando hay poco tiempo y quieres algo ligero.",
    mealType: "DINNER",
    prepTime: 5,
    cookTime: 5,
    instructions:
      "1. Bate los huevos con sal y pimienta.\n2. Calienta una sartén antiadherente con unas gotas de aceite.\n3. Vierte los huevos y mueve la sartén en círculos. Dobla cuando esté casi cuajada.\n4. Sirve con la ensalada aliñada con aceite, sal y limón.",
    caloriesPerServing: 270,
    proteinPerServing: 20,
    carbsPerServing: 5,
    fatPerServing: 18,
    ingredients: {
      create: [
        { name: "huevos", quantity: 3, unit: "unit" },
        { name: "lechuga", quantity: 80, unit: "g" },
        { name: "tomate", quantity: 60, unit: "g" },
        { name: "aceite de oliva", quantity: 10, unit: "ml" },
        { name: "sal", quantity: 1, unit: "tsp" },
        { name: "pimienta negra", quantity: 0.5, unit: "tsp" },
      ],
    },
  });

  await upsertRecipe("recipe-gambas-esparragos", {
    name: "Gambas al ajillo con espárragos a la plancha",
    description: "Cena ligera y sabrosa. Muy poca grasa, mucha proteína y listo en 10 minutos.",
    mealType: "DINNER",
    prepTime: 5,
    cookTime: 10,
    instructions:
      "1. Calienta aceite en una sartén con el ajo laminado y la guindilla.\n2. Añade las gambas peladas y saltea 2-3 min hasta que cambien de color. Añade perejil y limón.\n3. En otra sartén o plancha, marca los espárragos con sal y aceite 5-6 min.",
    caloriesPerServing: 240,
    proteinPerServing: 28,
    carbsPerServing: 6,
    fatPerServing: 12,
    ingredients: {
      create: [
        { name: "gambas peladas", quantity: 200, unit: "g" },
        { name: "espárragos trigueros", quantity: 150, unit: "g" },
        { name: "ajo", quantity: 3, unit: "unit" },
        { name: "aceite de oliva", quantity: 20, unit: "ml" },
        { name: "guindilla", quantity: 0.5, unit: "unit" },
        { name: "limón", quantity: 0.5, unit: "unit" },
        { name: "perejil fresco", quantity: 1, unit: "tbsp" },
        { name: "sal", quantity: 1, unit: "tsp" },
      ],
    },
  });

  await upsertRecipe("recipe-atun-tomate", {
    name: "Atún a la plancha con tomate y aceitunas",
    description: "Mediterráneo, rápido y equilibrado. El atún fresco es mucho mejor que el enlatado.",
    mealType: "DINNER",
    prepTime: 5,
    cookTime: 8,
    instructions:
      "1. Sazona el atún con sal, pimienta y un hilo de aceite.\n2. Marca en plancha bien caliente 2-3 min por cada lado (que quede rosa por dentro).\n3. Sirve sobre rodajas de tomate con aceitunas negras, orégano y aceite de oliva virgen extra.",
    caloriesPerServing: 290,
    proteinPerServing: 34,
    carbsPerServing: 6,
    fatPerServing: 14,
    ingredients: {
      create: [
        { name: "lomo de atún fresco", quantity: 180, unit: "g" },
        { name: "tomate", quantity: 150, unit: "g" },
        { name: "aceitunas negras", quantity: 30, unit: "g" },
        { name: "aceite de oliva", quantity: 15, unit: "ml" },
        { name: "orégano", quantity: 1, unit: "tsp" },
        { name: "sal", quantity: 1, unit: "tsp" },
        { name: "pimienta negra", quantity: 0.5, unit: "tsp" },
      ],
    },
  });

  await upsertRecipe("recipe-crema-calabaza", {
    name: "Crema de calabaza con semillas de pipas",
    description: "Cena ligera y reconfortante. Baja en calorías, saciante y perfecta para el frío.",
    mealType: "DINNER",
    prepTime: 10,
    cookTime: 25,
    instructions:
      "1. Sofríe la cebolla y el ajo en aceite. Añade la calabaza en dados y el caldo.\n2. Cocina 20-25 min hasta que la calabaza esté muy tierna.\n3. Tritura hasta obtener una crema fina. Ajusta de sal y añade nuez moscada.\n4. Sirve con un hilo de aceite y las pipas de calabaza por encima.",
    caloriesPerServing: 190,
    proteinPerServing: 6,
    carbsPerServing: 24,
    fatPerServing: 8,
    ingredients: {
      create: [
        { name: "calabaza", quantity: 400, unit: "g" },
        { name: "cebolla", quantity: 80, unit: "g" },
        { name: "ajo", quantity: 2, unit: "unit" },
        { name: "caldo de verduras", quantity: 400, unit: "ml" },
        { name: "aceite de oliva", quantity: 15, unit: "ml" },
        { name: "pipas de calabaza", quantity: 15, unit: "g" },
        { name: "nuez moscada", quantity: 0.25, unit: "tsp" },
        { name: "sal", quantity: 1, unit: "tsp" },
      ],
    },
  });

  console.log("✅ Seed completo. Recetas creadas:");
  console.log("   Desayuno: 6 recetas");
  console.log("   Comida:   9 recetas");
  console.log("   Merienda: 5 recetas");
  console.log("   Cena:     7 recetas");
  console.log("   Total:    27 recetas");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
