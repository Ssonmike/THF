-- CreateTable
CREATE TABLE "ShoppingListItemState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weeklyPlanId" TEXT NOT NULL,
    "aggregateKey" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "displayUnit" TEXT NOT NULL,
    "isChecked" BOOLEAN NOT NULL DEFAULT false,
    "checkedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ShoppingListItemState_weeklyPlanId_fkey" FOREIGN KEY ("weeklyPlanId") REFERENCES "WeeklyPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ShoppingListItemState_weeklyPlanId_aggregateKey_key" ON "ShoppingListItemState"("weeklyPlanId", "aggregateKey");

-- CreateIndex
CREATE INDEX "ShoppingListItemState_weeklyPlanId_isChecked_idx" ON "ShoppingListItemState"("weeklyPlanId", "isChecked");
