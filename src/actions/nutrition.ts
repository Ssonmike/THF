"use server";

import { prisma } from "@/lib/prisma";
import {
  NutritionPlanContentSchema,
  NutritionProfileSchema,
  type NutritionProfileInput,
} from "@/lib/nutrition";
import { revalidatePath } from "next/cache";

export type NutritionProfileData = NutritionProfileInput;

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
    const parsed = NutritionProfileSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors[0]?.message ?? "Perfil nutricional inválido",
      };
    }

    const person = await prisma.person.findUnique({ where: { slug: personSlug } });
    if (!person) return { success: false, error: "Persona no encontrada" };

    const profile = await prisma.nutritionProfile.upsert({
      where: { personId: person.id },
      update: { ...parsed.data, updatedAt: new Date() },
      create: { personId: person.id, ...parsed.data },
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
    const parsedContent = NutritionPlanContentSchema.safeParse(content);
    if (!parsedContent.success) {
      return {
        success: false,
        error: parsedContent.error.errors[0]?.message ?? "Plan nutricional inválido",
      };
    }

    await prisma.nutritionPlan.upsert({
      where: { profileId },
      update: { content: parsedContent.data, generatedAt: new Date() },
      create: { profileId, content: parsedContent.data },
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
