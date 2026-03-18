-- CreateTable
CREATE TABLE "persons" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "recipes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "mealType" TEXT NOT NULL,
    "prepTime" INTEGER,
    "cookTime" INTEGER,
    "instructions" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "caloriesPerServing" REAL,
    "proteinPerServing" REAL,
    "carbsPerServing" REAL,
    "fatPerServing" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "recipe_ingredients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "calories" REAL,
    "protein" REAL,
    "carbs" REAL,
    "fat" REAL,
    CONSTRAINT "recipe_ingredients_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "weekly_plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weekStartDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "planned_meals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weeklyPlanId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "slot" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "planned_meals_weeklyPlanId_fkey" FOREIGN KEY ("weeklyPlanId") REFERENCES "weekly_plans" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "planned_meals_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "planned_meal_portions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plannedMealId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "servings" REAL NOT NULL,
    CONSTRAINT "planned_meal_portions_plannedMealId_fkey" FOREIGN KEY ("plannedMealId") REFERENCES "planned_meals" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "planned_meal_portions_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "shopping_list_item_states" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weeklyPlanId" TEXT NOT NULL,
    "ingredientKey" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "shopping_list_item_states_weeklyPlanId_fkey" FOREIGN KEY ("weeklyPlanId") REFERENCES "weekly_plans" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "persons_name_key" ON "persons"("name");

-- CreateIndex
CREATE UNIQUE INDEX "persons_slug_key" ON "persons"("slug");

-- CreateIndex
CREATE INDEX "recipes_mealType_idx" ON "recipes"("mealType");

-- CreateIndex
CREATE INDEX "recipes_isFavorite_idx" ON "recipes"("isFavorite");

-- CreateIndex
CREATE INDEX "recipe_ingredients_recipeId_idx" ON "recipe_ingredients"("recipeId");

-- CreateIndex
CREATE INDEX "weekly_plans_weekStartDate_idx" ON "weekly_plans"("weekStartDate");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_plans_weekStartDate_key" ON "weekly_plans"("weekStartDate");

-- CreateIndex
CREATE INDEX "planned_meals_weeklyPlanId_idx" ON "planned_meals"("weeklyPlanId");

-- CreateIndex
CREATE INDEX "planned_meals_date_idx" ON "planned_meals"("date");

-- CreateIndex
CREATE UNIQUE INDEX "planned_meals_weeklyPlanId_date_slot_key" ON "planned_meals"("weeklyPlanId", "date", "slot");

-- CreateIndex
CREATE INDEX "planned_meal_portions_plannedMealId_idx" ON "planned_meal_portions"("plannedMealId");

-- CreateIndex
CREATE UNIQUE INDEX "planned_meal_portions_plannedMealId_personId_key" ON "planned_meal_portions"("plannedMealId", "personId");

-- CreateIndex
CREATE INDEX "shopping_list_item_states_weeklyPlanId_idx" ON "shopping_list_item_states"("weeklyPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "shopping_list_item_states_weeklyPlanId_ingredientKey_key" ON "shopping_list_item_states"("weeklyPlanId", "ingredientKey");
