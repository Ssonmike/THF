import { MealType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils/slug";
import { type RecipeFormValues } from "@/lib/validators/recipe";

export async function getRecipes(filters?: { search?: string; mealType?: MealType | "ALL" }) {
  return prisma.recipe.findMany({
    where: {
      name: filters?.search
        ? {
            contains: filters.search
          }
        : undefined,
      mealType:
        filters?.mealType && filters.mealType !== "ALL" ? filters.mealType : undefined
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
    orderBy: [{ mealType: "asc" }, { name: "asc" }]
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

export async function createRecipe(data: RecipeFormValues) {
  const slug = await buildUniqueSlug(data.name);

  return prisma.recipe.create({
    data: {
      name: data.name,
      slug,
      mealType: data.mealType,
      description: data.description || null,
      instructions: data.instructions || null,
      notes: data.notes || null,
      imageUrl: data.imageUrl || null,
      nutritionCaloriesPerServing: data.nutritionCaloriesPerServing ?? null,
      nutritionProteinPerServing: data.nutritionProteinPerServing ?? null,
      nutritionCarbsPerServing: data.nutritionCarbsPerServing ?? null,
      nutritionFatsPerServing: data.nutritionFatsPerServing ?? null,
      isFavorite: data.isFavorite ?? false,
      ingredients: {
        create: data.ingredients.map((ingredient, index) => ({
          itemName: ingredient.itemName,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          notes: ingredient.notes || null,
          sortOrder: index
        }))
      }
    }
  });
}

export async function updateRecipe(id: string, data: RecipeFormValues) {
  const slug = await buildUniqueSlug(data.name, id);

  return prisma.recipe.update({
    where: { id },
    data: {
      name: data.name,
      slug,
      mealType: data.mealType,
      description: data.description || null,
      instructions: data.instructions || null,
      notes: data.notes || null,
      imageUrl: data.imageUrl || null,
      nutritionCaloriesPerServing: data.nutritionCaloriesPerServing ?? null,
      nutritionProteinPerServing: data.nutritionProteinPerServing ?? null,
      nutritionCarbsPerServing: data.nutritionCarbsPerServing ?? null,
      nutritionFatsPerServing: data.nutritionFatsPerServing ?? null,
      isFavorite: data.isFavorite ?? false,
      ingredients: {
        deleteMany: {},
        create: data.ingredients.map((ingredient, index) => ({
          itemName: ingredient.itemName,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          notes: ingredient.notes || null,
          sortOrder: index
        }))
      }
    }
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

  if (recipe._count.plannedMeals > 0) {
    throw new Error(
      "This recipe is already used in the planner. Remove those meals before deleting it."
    );
  }

  await prisma.recipe.delete({
    where: { id }
  });
}
