import { notFound } from "next/navigation";
import { getPersonWithProfile } from "@/actions/nutrition";
import NutritionClient from "./NutritionClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function NutritionPersonPage({ params }: Props) {
  const { slug } = await params;
  const person = await getPersonWithProfile(slug);
  if (!person) notFound();

  return (
    <NutritionClient
      personSlug={person.slug}
      personName={person.name}
      initialProfile={person.nutritionProfile ?? null}
      initialPlan={person.nutritionProfile?.plan?.content ?? null}
    />
  );
}
