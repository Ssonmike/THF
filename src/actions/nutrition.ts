"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface NutritionProfileData {
  // Section 1
  age?: number;
  sex?: string;
  heightCm?: number;
  weightKg?: number;
  goalWeight?: string;
  timeline?: string;
  // Section 2
  jobType?: string;
  exercisePerWeek?: number;
  exerciseType?: string;
  sleepHours?: number;
  stressLevel?: string;
  alcohol?: string;
  // Section 3
  favoriteMeals?: string;
  hatedFoods?: string;
  dietaryRestrictions?: string;
  cookingStyle?: string;
  foodAdventurousness?: number;
  // Section 4
  currentSnacks?: string;
  snackReason?: string;
  snackPreference?: string;
  lateNightSnacking?: boolean;
}

export async function getPersonWithProfile(slug: string) {
  return prisma.person.findUnique({
    where: { slug },
    include: { nutritionProfile: { include: { plan: true } } },
  });
}

export async function saveNutritionProfile(
  personSlug: string,
  data: NutritionProfileData
): Promise<{ success: boolean; profileId?: string; error?: string }> {
  try {
    const person = await prisma.person.findUnique({ where: { slug: personSlug } });
    if (!person) return { success: false, error: "Persona no encontrada" };

    const profile = await prisma.nutritionProfile.upsert({
      where: { personId: person.id },
      update: { ...data, updatedAt: new Date() },
      create: { personId: person.id, ...data },
    });

    revalidatePath(`/nutrition/${personSlug}`);
    return { success: true, profileId: profile.id };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Error al guardar el perfil" };
  }
}

export async function saveNutritionPlan(
  profileId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.nutritionPlan.upsert({
      where: { profileId },
      update: { content, generatedAt: new Date() },
      create: { profileId, content },
    });
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Error al guardar el plan" };
  }
}

export async function getAllPersons() {
  return prisma.person.findMany({
    include: { nutritionProfile: { include: { plan: true } } },
    orderBy: { name: "asc" },
  });
}
