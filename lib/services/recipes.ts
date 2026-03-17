import { MealType, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils/slug";
import { type RecipeFormValues } from "@/lib/validators/recipe";

export function assertRecipeCanBeDeleted(plannedMealsCount: number) {
  if (plannedMealsCount > 0) {
    throw new Error(
      "This recipe is already used in the planner. Remove those meals before deleting it."
    );
  }
}

export function sanitizeRecipeForPersistence(data: RecipeFormValues): RecipeFormValues {
  return {
    ...data,
    name: data.name.trim(),
    description: data.description?.trim() || "",
    instructions: data.instructions?.trim() || "",
    notes: data.notes?.trim() || "",
    imageUrl: data.imageUrl?.trim() || "",
    ingredients: data.ingredients
      .map((ingredient) => ({
        ...ingredient,
        itemName: ingredient.itemName.trim(),
        notes: ingredient.notes?.trim() || ""
      }))
      .filter((ingredient) => ingredient.itemName.length > 0)
  };
}

export async function getRecipes(filters?: {
  search?: string;
  mealType?: MealType | "ALL";
  favoritesOnly?: boolean;
}) {
  return prisma.recipe.findMany({
    where: {
      OR: filters?.search
        ? [
            {
              name: {
                contains: filters.search.trim()
              }
            },
            {
              ingredients: {
                some: {
                  itemName: {
                    contains: filters.search.trim()
                  }
                }
              }
            }
          ]
        : undefined,
      mealType:
        filters?.mealType && filters.mealType !== "ALL" ? filters.mealType : undefined,
      isFavorite: filters?.favoritesOnly ? true : undefined
    },
    include: {
      ingredients: {
        orderBy: {
          sortOrder: "asc"
        }
      },
      _count: {
        select: {
          plannedMeals: true
        }
      }
    },
    orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }]
  });
}

export async function getRecipeById(id: string) {
  return prisma.recipe.findUnique({
    where: { id },
    include: {
      ingredients: {
        orderBy: {
          sortOrder: "asc"
        }
      },
      _count: {
        select: {
          plannedMeals: true
        }
      }
    }
  });
}

export async function getRecipeOptions() {
  return prisma.recipe.findMany({
    select: {
      id: true,
      name: true,
      mealType: true
    },
    orderBy: [{ isFavorite: "desc" }, { mealType: "asc" }, { name: "asc" }]
  });
}

async function buildUniqueSlug(name: string, currentId?: string) {
  const baseSlug = slugify(name) || "recipe";
  let slug = baseSlug;
  let suffix = 1;

  while (true) {
    const existing = await prisma.recipe.findUnique({
      where: { slug },
      select: { id: true }
    });

    if (!existing || existing.id === currentId) {
      return slug;
    }

    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }
}

function buildIngredientCreateData(data: RecipeFormValues["ingredients"]): Prisma.RecipeIngredientCreateWithoutRecipeInput[] {
  return data.map((ingredient, index) => ({
    itemName: ingredient.itemName,
    quantity: ingredient.quantity,
    unit: ingredient.unit,
    notes: ingredient.notes || null,
    sortOrder: index
  }));
}

export async function createRecipe(data: RecipeFormValues) {
  const sanitized = sanitizeRecipeForPersistence(data);
  const slug = await buildUniqueSlug(sanitized.name);

  return prisma.recipe.create({
    data: {
      name: sanitized.name,
      slug,
      mealType: sanitized.mealType,
      description: sanitized.description || null,
      instructions: sanitized.instructions || null,
      notes: sanitized.notes || null,
      imageUrl: sanitized.imageUrl || null,
      nutritionCaloriesPerServing: sanitized.nutritionCaloriesPerServing ?? null,
      nutritionProteinPerServing: sanitized.nutritionProteinPerServing ?? null,
      nutritionCarbsPerServing: sanitized.nutritionCarbsPerServing ?? null,
      nutritionFatsPerServing: sanitized.nutritionFatsPerServing ?? null,
      isFavorite: sanitized.isFavorite ?? false,
      ingredients: {
        create: buildIngredientCreateData(sanitized.ingredients)
      }
    }
  });
}

export async function updateRecipe(id: string, data: RecipeFormValues) {
  const sanitized = sanitizeRecipeForPersistence(data);
  const slug = await buildUniqueSlug(sanitized.name, id);

  return prisma.recipe.update({
    where: { id },
    data: {
      name: sanitized.name,
      slug,
      mealType: sanitized.mealType,
      description: sanitized.description || null,
      instructions: sanitized.instructions || null,
      notes: sanitized.notes || null,
      imageUrl: sanitized.imageUrl || null,
      nutritionCaloriesPerServing: sanitized.nutritionCaloriesPerServing ?? null,
      nutritionProteinPerServing: sanitized.nutritionProteinPerServing ?? null,
      nutritionCarbsPerServing: sanitized.nutritionCarbsPerServing ?? null,
      nutritionFatsPerServing: sanitized.nutritionFatsPerServing ?? null,
      isFavorite: sanitized.isFavorite ?? false,
      ingredients: {
        deleteMany: {},
        create: buildIngredientCreateData(sanitized.ingredients)
      }
    }
  });
}

export async function duplicateRecipe(id: string) {
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      ingredients: {
        orderBy: {
          sortOrder: "asc"
        }
      }
    }
  });

  if (!recipe) {
    throw new Error("Recipe not found.");
  }

  return createRecipe({
    name: `${recipe.name} Copy`,
    mealType: recipe.mealType,
    description: recipe.description ?? "",
    instructions: recipe.instructions ?? "",
    notes: recipe.notes ?? "",
    imageUrl: recipe.imageUrl ?? "",
    nutritionCaloriesPerServing: recipe.nutritionCaloriesPerServing ?? undefined,
    nutritionProteinPerServing: recipe.nutritionProteinPerServing ?? undefined,
    nutritionCarbsPerServing: recipe.nutritionCarbsPerServing ?? undefined,
    nutritionFatsPerServing: recipe.nutritionFatsPerServing ?? undefined,
    isFavorite: false,
    ingredients: recipe.ingredients.map((ingredient) => ({
      itemName: ingredient.itemName,
      quantity: ingredient.quantity,
      unit: ingredient.unit as RecipeFormValues["ingredients"][number]["unit"],
      notes: ingredient.notes ?? ""
    }))
  });
}

export async function deleteRecipeSafely(id: string) {
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          plannedMeals: true
        }
      }
    }
  });

  if (!recipe) {
    throw new Error("Recipe not found.");
  }

  assertRecipeCanBeDeleted(recipe._count.plannedMeals);

  await prisma.recipe.delete({
    where: { id }
  });
}
