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
    const ingredientsCreate = Array.isArray(data.ingredients?.create)
      ? data.ingredients.create
      : [];

    return prisma.recipe.upsert({
      where: { id },
      update: {
        ...data,
        ingredients: {
          deleteMany: {},
          create: ingredientsCreate,
        },
      },
      create: { id, ...data },
    });
  }

  await prisma.plannedMeal.deleteMany({
    where: {
      recipeId: {
        in: [
          "recipe-tostadas-salmon",
          "recipe-salmon-esparragos",
          "recipe-merluza-horno",
          "recipe-ensalada-quinoa-atun",
          "recipe-salmon-brocoli",
          "recipe-gambas-esparragos",
          "recipe-atun-tomate",
        ],
      },
    },
  });

  await prisma.recipe.deleteMany({
    where: {
      id: {
        in: [
          "recipe-tostadas-salmon",
          "recipe-salmon-esparragos",
          "recipe-merluza-horno",
          "recipe-ensalada-quinoa-atun",
          "recipe-salmon-brocoli",
          "recipe-gambas-esparragos",
          "recipe-atun-tomate",
        ],
      },
    },
  });

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

  await upsertRecipe("recipe-overnight-oats-manzana", {
    name: "Overnight oats de manzana y canela",
    description: "Desayuno frío que se deja listo la noche anterior. Cremoso, saciante y muy práctico.",
    mealType: "BREAKFAST",
    prepTime: 5,
    cookTime: 0,
    instructions:
      "1. Mezcla en un tarro la avena, el yogur, la leche y la canela.\n2. Añade la manzana en dados y las semillas.\n3. Deja reposar en la nevera toda la noche.\n4. Por la mañana remueve y sirve con nueces por encima.",
    caloriesPerServing: 340,
    proteinPerServing: 18,
    carbsPerServing: 42,
    fatPerServing: 10,
    ingredients: {
      create: [
        { name: "copos de avena", quantity: 55, unit: "g" },
        { name: "yogur griego 0%", quantity: 150, unit: "g" },
        { name: "leche semidesnatada", quantity: 120, unit: "ml" },
        { name: "manzana", quantity: 0.5, unit: "unit" },
        { name: "canela", quantity: 0.5, unit: "tsp" },
        { name: "semillas de lino", quantity: 8, unit: "g" },
        { name: "nueces", quantity: 15, unit: "g" },
      ],
    },
  });

  await upsertRecipe("recipe-tortitas-avena", {
    name: "Tortitas de avena y yogur",
    description: "Tortitas tiernas y rápidas con buena cantidad de proteína para empezar el día fuerte.",
    mealType: "BREAKFAST",
    prepTime: 8,
    cookTime: 10,
    instructions:
      "1. Tritura la avena con el huevo, el yogur, el plátano y la canela.\n2. Cocina pequeñas porciones en una sartén antiadherente 2-3 min por cada lado.\n3. Sirve con frutos rojos por encima.",
    caloriesPerServing: 365,
    proteinPerServing: 20,
    carbsPerServing: 46,
    fatPerServing: 10,
    ingredients: {
      create: [
        { name: "copos de avena", quantity: 60, unit: "g" },
        { name: "huevos", quantity: 2, unit: "unit" },
        { name: "yogur griego 0%", quantity: 100, unit: "g" },
        { name: "plátano", quantity: 1, unit: "unit" },
        { name: "canela", quantity: 0.5, unit: "tsp" },
        { name: "frutos rojos", quantity: 60, unit: "g" },
      ],
    },
  });

  await upsertRecipe("recipe-pudding-chia", {
    name: "Pudding de chía con mango",
    description: "Desayuno fresco, rico en fibra y perfecto para preparar con antelación.",
    mealType: "BREAKFAST",
    prepTime: 5,
    cookTime: 0,
    instructions:
      "1. Mezcla la leche con el yogur, las semillas de chía y la vainilla.\n2. Reposa en la nevera al menos 4 horas.\n3. Sirve con el mango en dados y almendras laminadas.",
    caloriesPerServing: 310,
    proteinPerServing: 17,
    carbsPerServing: 28,
    fatPerServing: 13,
    ingredients: {
      create: [
        { name: "semillas de chía", quantity: 30, unit: "g" },
        { name: "leche semidesnatada", quantity: 180, unit: "ml" },
        { name: "yogur griego 0%", quantity: 120, unit: "g" },
        { name: "mango", quantity: 100, unit: "g" },
        { name: "extracto de vainilla", quantity: 0.5, unit: "tsp" },
        { name: "almendras laminadas", quantity: 10, unit: "g" },
      ],
    },
  });

  await upsertRecipe("recipe-burrito-desayuno", {
    name: "Wrap de desayuno con huevo y pavo",
    description: "Opción salada muy completa con proteína, verduras y carbohidratos moderados.",
    mealType: "BREAKFAST",
    prepTime: 5,
    cookTime: 7,
    instructions:
      "1. Haz un revuelto con los huevos y las espinacas.\n2. Calienta la tortilla integral y rellénala con el revuelto, el pavo y el queso.\n3. Cierra el wrap y dóralo 1 min por cada lado.",
    caloriesPerServing: 345,
    proteinPerServing: 27,
    carbsPerServing: 24,
    fatPerServing: 14,
    ingredients: {
      create: [
        { name: "tortilla integral", quantity: 1, unit: "unit" },
        { name: "huevos", quantity: 2, unit: "unit" },
        { name: "fiambre de pavo", quantity: 60, unit: "g" },
        { name: "espinacas frescas", quantity: 40, unit: "g" },
        { name: "queso rallado light", quantity: 20, unit: "g" },
        { name: "aceite de oliva", quantity: 5, unit: "ml" },
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

  await upsertRecipe("recipe-pollo-mostaza-patata", {
    name: "Pollo a la mostaza con patatas asadas",
    description: "Plato completo y sabroso con pollo jugoso y patatas doradas al horno.",
    mealType: "LUNCH",
    prepTime: 10,
    cookTime: 30,
    instructions:
      "1. Mezcla la mostaza con yogur, ajo y especias.\n2. Unta el pollo con la mezcla y colócalo en una bandeja.\n3. Añade las patatas y la zanahoria con aceite, sal y pimienta.\n4. Hornea 30 min a 200°C hasta que todo esté dorado.",
    caloriesPerServing: 430,
    proteinPerServing: 39,
    carbsPerServing: 32,
    fatPerServing: 14,
    isFavorite: true,
    ingredients: {
      create: [
        { name: "pechuga de pollo", quantity: 200, unit: "g" },
        { name: "patatas", quantity: 180, unit: "g" },
        { name: "zanahoria", quantity: 100, unit: "g" },
        { name: "yogur griego 0%", quantity: 50, unit: "g" },
        { name: "mostaza dijon", quantity: 15, unit: "g" },
        { name: "ajo en polvo", quantity: 1, unit: "tsp" },
        { name: "aceite de oliva", quantity: 15, unit: "ml" },
        { name: "sal", quantity: 1, unit: "tsp" },
        { name: "pimienta negra", quantity: 0.5, unit: "tsp" },
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

  await upsertRecipe("recipe-albondigas-pavo-arroz", {
    name: "Albóndigas de pavo con arroz y tomate",
    description: "Una comida muy completa y casera con salsa ligera de tomate.",
    mealType: "LUNCH",
    prepTime: 15,
    cookTime: 30,
    instructions:
      "1. Mezcla el pavo picado con ajo, huevo y especias. Forma albóndigas.\n2. Hornea 15 min a 200°C.\n3. Cocina la cebolla con tomate triturado y albahaca hasta formar una salsa.\n4. Añade las albóndigas a la salsa y sirve con arroz cocido.",
    caloriesPerServing: 465,
    proteinPerServing: 37,
    carbsPerServing: 42,
    fatPerServing: 14,
    ingredients: {
      create: [
        { name: "pechuga de pavo picada", quantity: 180, unit: "g" },
        { name: "arroz integral", quantity: 75, unit: "g" },
        { name: "tomate triturado", quantity: 180, unit: "g" },
        { name: "cebolla", quantity: 60, unit: "g" },
        { name: "huevos", quantity: 1, unit: "unit" },
        { name: "ajo", quantity: 2, unit: "unit" },
        { name: "albahaca fresca", quantity: 5, unit: "g" },
        { name: "aceite de oliva", quantity: 15, unit: "ml" },
        { name: "sal", quantity: 1, unit: "tsp" },
      ],
    },
  });

  await upsertRecipe("recipe-quinoa-pollo-aguacate", {
    name: "Ensalada templada de quinoa, pollo y aguacate",
    description: "Muy fresca y equilibrada, perfecta para comer bien incluso con poco tiempo.",
    mealType: "LUNCH",
    prepTime: 10,
    cookTime: 12,
    instructions:
      "1. Cuece la quinoa y deja templar.\n2. Cocina el pollo a la plancha con sal y limón y córtalo en tiras.\n3. Mezcla con aguacate, pepino, tomate cherry y perejil.\n4. Aliña con aceite de oliva y limón.",
    caloriesPerServing: 420,
    proteinPerServing: 34,
    carbsPerServing: 31,
    fatPerServing: 16,
    isFavorite: true,
    ingredients: {
      create: [
        { name: "quinoa", quantity: 70, unit: "g" },
        { name: "pechuga de pollo", quantity: 150, unit: "g" },
        { name: "aguacate", quantity: 70, unit: "g" },
        { name: "pepino", quantity: 80, unit: "g" },
        { name: "tomate cherry", quantity: 60, unit: "g" },
        { name: "aceite de oliva", quantity: 15, unit: "ml" },
        { name: "limón", quantity: 0.5, unit: "unit" },
        { name: "sal", quantity: 1, unit: "tsp" },
      ],
    },
  });

  await upsertRecipe("recipe-fajitas-pollo", {
    name: "Fajitas de pollo con pimientos",
    description: "Comida sabrosa y fácil de compartir, con muchas verduras y proteína magra.",
    mealType: "LUNCH",
    prepTime: 10,
    cookTime: 15,
    instructions:
      "1. Corta el pollo y los pimientos en tiras.\n2. Saltea todo con cebolla, comino y pimentón.\n3. Calienta las tortillas y rellénalas al gusto con yogur y lima.",
    caloriesPerServing: 455,
    proteinPerServing: 36,
    carbsPerServing: 38,
    fatPerServing: 15,
    ingredients: {
      create: [
        { name: "pechuga de pollo", quantity: 180, unit: "g" },
        { name: "tortilla integral", quantity: 2, unit: "unit" },
        { name: "pimiento rojo", quantity: 80, unit: "g" },
        { name: "pimiento verde", quantity: 80, unit: "g" },
        { name: "cebolla", quantity: 70, unit: "g" },
        { name: "yogur griego 0%", quantity: 40, unit: "g" },
        { name: "comino", quantity: 1, unit: "tsp" },
        { name: "pimentón dulce", quantity: 1, unit: "tsp" },
        { name: "aceite de oliva", quantity: 10, unit: "ml" },
      ],
    },
  });

  await upsertRecipe("recipe-burrito-bowl", {
    name: "Burrito bowl de arroz, ternera y alubias",
    description: "Bol completo con inspiración tex-mex y muy buen reparto de macros.",
    mealType: "LUNCH",
    prepTime: 10,
    cookTime: 20,
    instructions:
      "1. Cuece el arroz.\n2. Cocina la ternera picada con cebolla, comino y pimentón.\n3. Añade las alubias y el maíz y cocina 3 min.\n4. Sirve en un bol con tomate, aguacate y arroz.",
    caloriesPerServing: 520,
    proteinPerServing: 34,
    carbsPerServing: 44,
    fatPerServing: 21,
    ingredients: {
      create: [
        { name: "arroz integral", quantity: 75, unit: "g" },
        { name: "ternera picada magra", quantity: 160, unit: "g" },
        { name: "alubias rojas cocidas", quantity: 100, unit: "g" },
        { name: "maíz cocido", quantity: 60, unit: "g" },
        { name: "aguacate", quantity: 50, unit: "g" },
        { name: "tomate", quantity: 80, unit: "g" },
        { name: "cebolla", quantity: 50, unit: "g" },
        { name: "comino", quantity: 1, unit: "tsp" },
        { name: "aceite de oliva", quantity: 10, unit: "ml" },
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

  await upsertRecipe("recipe-skyr-kiwi-avena", {
    name: "Skyr con kiwi y avena crujiente",
    description: "Merienda muy proteica y ligera con un toque fresco de fruta.",
    mealType: "SNACK",
    prepTime: 3,
    cookTime: 0,
    instructions:
      "1. Sirve el skyr en un bol.\n2. Añade el kiwi troceado y la avena por encima.\n3. Termina con canela o unas gotas de miel si te apetece.",
    caloriesPerServing: 190,
    proteinPerServing: 18,
    carbsPerServing: 20,
    fatPerServing: 3,
    ingredients: {
      create: [
        { name: "skyr natural", quantity: 170, unit: "g" },
        { name: "kiwi", quantity: 1, unit: "unit" },
        { name: "copos de avena", quantity: 20, unit: "g" },
        { name: "canela", quantity: 0.25, unit: "tsp" },
      ],
    },
  });

  await upsertRecipe("recipe-hummus-pepino", {
    name: "Hummus con pepino y crackers integrales",
    description: "Snack vegetal y muy saciante para media tarde.",
    mealType: "SNACK",
    prepTime: 5,
    cookTime: 0,
    instructions:
      "1. Coloca el hummus en un cuenco pequeño.\n2. Lava y corta el pepino en bastones.\n3. Sirve con crackers para ir mojando.",
    caloriesPerServing: 210,
    proteinPerServing: 8,
    carbsPerServing: 24,
    fatPerServing: 8,
    ingredients: {
      create: [
        { name: "hummus", quantity: 70, unit: "g" },
        { name: "pepino", quantity: 120, unit: "g" },
        { name: "crackers integrales", quantity: 30, unit: "g" },
      ],
    },
  });

  await upsertRecipe("recipe-bocaditos-requeson", {
    name: "Requesón con pera y canela",
    description: "Merienda sencilla con proteína láctea y fruta suave.",
    mealType: "SNACK",
    prepTime: 4,
    cookTime: 0,
    instructions:
      "1. Pon el requesón en un bol.\n2. Añade la pera en cubitos.\n3. Espolvorea canela y unas nueces picadas por encima.",
    caloriesPerServing: 205,
    proteinPerServing: 14,
    carbsPerServing: 18,
    fatPerServing: 8,
    ingredients: {
      create: [
        { name: "requesón", quantity: 150, unit: "g" },
        { name: "pera", quantity: 1, unit: "unit" },
        { name: "nueces", quantity: 10, unit: "g" },
        { name: "canela", quantity: 0.25, unit: "tsp" },
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

  await upsertRecipe("recipe-pavo-calabacin", {
    name: "Pavo salteado con calabacín y champiñones",
    description: "Cena ligera y muy proteica con verduras salteadas en pocos minutos.",
    mealType: "DINNER",
    prepTime: 5,
    cookTime: 12,
    instructions:
      "1. Dora el pavo en una sartén caliente con aceite.\n2. Añade el calabacín, los champiñones y el ajo.\n3. Saltea hasta que las verduras estén tiernas y termina con limón y perejil.",
    caloriesPerServing: 280,
    proteinPerServing: 35,
    carbsPerServing: 9,
    fatPerServing: 11,
    ingredients: {
      create: [
        { name: "pechuga de pavo", quantity: 180, unit: "g" },
        { name: "calabacín", quantity: 180, unit: "g" },
        { name: "champiñones", quantity: 120, unit: "g" },
        { name: "ajo", quantity: 2, unit: "unit" },
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

  await upsertRecipe("recipe-crema-calabacin-huevo", {
    name: "Crema de calabacín con huevo duro",
    description: "Cena suave y reconfortante con un extra de proteína fácil de preparar.",
    mealType: "DINNER",
    prepTime: 10,
    cookTime: 20,
    instructions:
      "1. Sofríe cebolla y calabacín troceado con aceite.\n2. Añade el caldo y cocina 15 min.\n3. Tritura hasta obtener una crema fina.\n4. Sirve con huevo duro picado y pimienta.",
    caloriesPerServing: 250,
    proteinPerServing: 14,
    carbsPerServing: 13,
    fatPerServing: 14,
    ingredients: {
      create: [
        { name: "calabacín", quantity: 300, unit: "g" },
        { name: "cebolla", quantity: 70, unit: "g" },
        { name: "caldo de verduras", quantity: 300, unit: "ml" },
        { name: "huevos", quantity: 2, unit: "unit" },
        { name: "aceite de oliva", quantity: 15, unit: "ml" },
        { name: "sal", quantity: 1, unit: "tsp" },
      ],
    },
  });

  await upsertRecipe("recipe-tofu-teriyaki", {
    name: "Tofu teriyaki con verduras salteadas",
    description: "Cena vegetal completa, sabrosa y con textura crujiente por fuera.",
    mealType: "DINNER",
    prepTime: 10,
    cookTime: 12,
    instructions:
      "1. Dora el tofu en dados en una sartén antiadherente.\n2. Añade brócoli, zanahoria y pimiento y saltea unos minutos.\n3. Incorpora la salsa teriyaki y cocina hasta que glace.",
    caloriesPerServing: 315,
    proteinPerServing: 21,
    carbsPerServing: 19,
    fatPerServing: 16,
    ingredients: {
      create: [
        { name: "tofu firme", quantity: 180, unit: "g" },
        { name: "brócoli", quantity: 120, unit: "g" },
        { name: "zanahoria", quantity: 80, unit: "g" },
        { name: "pimiento rojo", quantity: 70, unit: "g" },
        { name: "salsa teriyaki", quantity: 25, unit: "ml" },
        { name: "aceite de oliva", quantity: 10, unit: "ml" },
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

  await upsertRecipe("recipe-berenjena-rellena", {
    name: "Berenjena rellena de carne y verduras",
    description: "Cena completa al horno con carne magra y verduras muy jugosas.",
    mealType: "DINNER",
    prepTime: 15,
    cookTime: 30,
    instructions:
      "1. Asa la berenjena partida por la mitad 20 min.\n2. Vacía parte de la pulpa y sofríela con carne picada, cebolla y tomate.\n3. Rellena las mitades, añade queso y gratina 10 min.",
    caloriesPerServing: 360,
    proteinPerServing: 29,
    carbsPerServing: 17,
    fatPerServing: 18,
    ingredients: {
      create: [
        { name: "berenjena", quantity: 1, unit: "unit" },
        { name: "ternera picada magra", quantity: 140, unit: "g" },
        { name: "cebolla", quantity: 60, unit: "g" },
        { name: "tomate triturado", quantity: 100, unit: "g" },
        { name: "queso rallado light", quantity: 25, unit: "g" },
        { name: "aceite de oliva", quantity: 10, unit: "ml" },
      ],
    },
  });

  await upsertRecipe("recipe-pizza-tortilla", {
    name: "Pizza rápida con base de tortilla",
    description: "Cena rápida estilo pizza con una base ligera y un montón de sabor.",
    mealType: "DINNER",
    prepTime: 8,
    cookTime: 10,
    instructions:
      "1. Coloca la tortilla integral en una bandeja.\n2. Cubre con tomate, mozzarella, pavo y verduras.\n3. Hornea 8-10 min hasta que el queso se funda.",
    caloriesPerServing: 330,
    proteinPerServing: 25,
    carbsPerServing: 24,
    fatPerServing: 14,
    ingredients: {
      create: [
        { name: "tortilla integral", quantity: 1, unit: "unit" },
        { name: "tomate triturado", quantity: 60, unit: "g" },
        { name: "mozzarella light", quantity: 60, unit: "g" },
        { name: "fiambre de pavo", quantity: 50, unit: "g" },
        { name: "champiñones", quantity: 60, unit: "g" },
        { name: "orégano", quantity: 1, unit: "tsp" },
      ],
    },
  });

  console.log("✅ Seed completo. Recetas creadas:");
  console.log("   Desayuno: 9 recetas");
  console.log("   Almuerzo: 11 recetas");
  console.log("   Merienda: 8 recetas");
  console.log("   Cena:     9 recetas");
  console.log("   Total:    37 recetas");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
