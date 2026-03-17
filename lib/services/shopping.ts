import { DayOfWeek, MealType, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatQuantity, roundTo } from "@/lib/utils/format";
import {
  buildIngredientAggregateKey,
  normalizeQuantityToBaseUnit,
  presentIngredientName
} from "@/lib/utils/units";

export type PlannedMealForAggregation = {
  id: string;
  dayOfWeek: DayOfWeek;
  mealSlot: MealType;
  recipe: {
    id: string;
    name: string;
    ingredients: Array<{
      id: string;
      itemName: string;
      quantity: number;
      unit: string;
      notes: string | null;
    }>;
  };
  portions: Array<{
    personId: string;
    servings: number;
  }>;
};

export type ShoppingListItem = {
  aggregateKey: string;
  itemName: string;
  unit: string;
  quantity: number;
  checked: boolean;
};

export type ShoppingStateEntry = {
  aggregateKey: string;
  isChecked: boolean;
};

export function buildShoppingList(plannedMeals: PlannedMealForAggregation[]): ShoppingListItem[] {
  const aggregate = new Map<string, ShoppingListItem>();

  for (const meal of plannedMeals) {
    const totalServings = roundTo(
      meal.portions.reduce((sum, portion) => sum + portion.servings, 0),
      3
    );

    for (const ingredient of meal.recipe.ingredients) {
      const normalizedQuantity = normalizeQuantityToBaseUnit(
        ingredient.quantity * totalServings,
        ingredient.unit
      );
      const aggregateKey = buildIngredientAggregateKey(
        ingredient.itemName,
        normalizedQuantity.unit
      );
      const current = aggregate.get(aggregateKey);

      if (current) {
        current.quantity = roundTo(current.quantity + normalizedQuantity.quantity, 3);
        continue;
      }

      aggregate.set(aggregateKey, {
        aggregateKey,
        itemName: presentIngredientName(ingredient.itemName),
        unit: normalizedQuantity.unit,
        quantity: normalizedQuantity.quantity,
        checked: false
      });
    }
  }

  return Array.from(aggregate.values()).sort((a, b) => a.itemName.localeCompare(b.itemName));
}

export function applyShoppingItemStates(
  items: ShoppingListItem[],
  stateEntries: ShoppingStateEntry[]
) {
  const stateMap = new Map(
    stateEntries.map((entry) => [entry.aggregateKey, entry.isChecked])
  );

  return items.map((item) => ({
    ...item,
    checked: stateMap.get(item.aggregateKey) ?? false
  }));
}

export function buildShoppingListText(items: ShoppingListItem[], options?: { onlyPending?: boolean }) {
  return items
    .filter((item) => (options?.onlyPending ? !item.checked : true))
    .map((item) => `- ${item.itemName}: ${formatQuantity(item.quantity)} ${item.unit}`)
    .join("\n");
}

export function buildShoppingListCsv(items: ShoppingListItem[]) {
  const header = "item,quantity,unit,checked";
  const rows = items.map(
    (item) =>
      `"${item.itemName.replace(/"/g, '""')}",${roundTo(item.quantity, 3)},${item.unit},${item.checked ? "yes" : "no"}`
  );

  return [header, ...rows].join("\n");
}

async function getShoppingStateEntries(weeklyPlanId: string, aggregateKeys: string[]) {
  if (aggregateKeys.length === 0) {
    return [];
  }

  return prisma.shoppingListItemState.findMany({
    where: {
      weeklyPlanId,
      aggregateKey: {
        in: aggregateKeys
      }
    },
    select: {
      aggregateKey: true,
      isChecked: true
    }
  });
}

export async function getShoppingListForWeek(weekStartDate: Date) {
  const weeklyPlan = await prisma.weeklyPlan.findUnique({
    where: { weekStartDate },
    include: {
      plannedMeals: {
        include: {
          recipe: {
            include: {
              ingredients: {
                orderBy: {
                  sortOrder: "asc"
                }
              }
            }
          },
          portions: true
        }
      }
    }
  });

  if (!weeklyPlan) {
    return {
      weeklyPlan: null,
      items: [],
      stats: {
        total: 0,
        checked: 0,
        pending: 0
      }
    };
  }

  const aggregatedItems = buildShoppingList(weeklyPlan.plannedMeals);
  const stateEntries = await getShoppingStateEntries(
    weeklyPlan.id,
    aggregatedItems.map((item) => item.aggregateKey)
  );
  const items = applyShoppingItemStates(aggregatedItems, stateEntries);

  return {
    weeklyPlan,
    items,
    stats: {
      total: items.length,
      checked: items.filter((item) => item.checked).length,
      pending: items.filter((item) => !item.checked).length
    }
  };
}

type ShoppingStateItemInput = Pick<ShoppingListItem, "aggregateKey" | "itemName" | "unit">;

function buildShoppingStateUpsertData(
  weeklyPlanId: string,
  item: ShoppingStateItemInput,
  isChecked: boolean
): Prisma.ShoppingListItemStateUpsertArgs {
  return {
    where: {
      weeklyPlanId_aggregateKey: {
        weeklyPlanId,
        aggregateKey: item.aggregateKey
      }
    },
    create: {
      weeklyPlanId,
      aggregateKey: item.aggregateKey,
      displayName: item.itemName,
      displayUnit: item.unit,
      isChecked,
      checkedAt: isChecked ? new Date() : null
    },
    update: {
      displayName: item.itemName,
      displayUnit: item.unit,
      isChecked,
      checkedAt: isChecked ? new Date() : null
    }
  };
}

export async function setShoppingItemChecked(
  weeklyPlanId: string,
  item: ShoppingStateItemInput,
  isChecked: boolean
) {
  return prisma.shoppingListItemState.upsert(
    buildShoppingStateUpsertData(weeklyPlanId, item, isChecked)
  );
}

export async function setShoppingItemsChecked(
  weeklyPlanId: string,
  items: ShoppingStateItemInput[],
  isChecked: boolean
) {
  return prisma.$transaction(
    items.map((item) =>
      prisma.shoppingListItemState.upsert(
        buildShoppingStateUpsertData(weeklyPlanId, item, isChecked)
      )
    )
  );
}

export async function clearShoppingListStateForWeek(weeklyPlanId: string) {
  return prisma.shoppingListItemState.deleteMany({
    where: {
      weeklyPlanId
    }
  });
}
