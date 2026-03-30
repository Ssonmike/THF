-- CreateTable
CREATE TABLE "nutrition_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personId" TEXT NOT NULL,
    "age" INTEGER,
    "sex" TEXT,
    "heightCm" REAL,
    "weightKg" REAL,
    "goalWeight" TEXT,
    "timeline" TEXT,
    "jobType" TEXT,
    "exercisePerWeek" INTEGER,
    "exerciseType" TEXT,
    "sleepHours" REAL,
    "stressLevel" TEXT,
    "alcohol" TEXT,
    "favoriteMeals" TEXT,
    "hatedFoods" TEXT,
    "dietaryRestrictions" TEXT,
    "cookingStyle" TEXT,
    "foodAdventurousness" INTEGER,
    "currentSnacks" TEXT,
    "snackReason" TEXT,
    "snackPreference" TEXT,
    "lateNightSnacking" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "nutrition_profiles_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "nutrition_plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "nutrition_plans_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "nutrition_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "nutrition_profiles_personId_key" ON "nutrition_profiles"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "nutrition_plans_profileId_key" ON "nutrition_plans"("profileId");
