import Link from "next/link";
import { getAllPersons } from "@/actions/nutrition";
import styles from "./nutrition.module.css";

export const dynamic = "force-dynamic";

export default async function NutritionPage() {
  const persons = await getAllPersons();

  return (
    <main className="container">
      <div className={styles.header}>
        <h1 className={styles.title}>Nutrición Personalizada</h1>
        <p className={styles.subtitle}>
          Plan de alimentación a medida con IA para cada persona
        </p>
      </div>

      <div className={styles.personGrid}>
        {persons.map((person: (typeof persons)[number]) => {
          const hasProfile = !!person.nutritionProfile;
          const hasPlan = !!person.nutritionProfile?.plan;
          return (
            <Link key={person.id} href={`/nutrition/${person.slug}`} className={styles.personCard}>
              <div className={styles.personAvatar}>
                {person.name.charAt(0)}
              </div>
              <div className={styles.personInfo}>
                <h2 className={styles.personName}>{person.name}</h2>
                <div className={styles.personStatus}>
                  {hasPlan ? (
                    <span className={styles.statusBadge + " " + styles.statusBadgeDone}>
                      Plan generado ✓
                    </span>
                  ) : hasProfile ? (
                    <span className={styles.statusBadge + " " + styles.statusBadgePartial}>
                      Perfil completo
                    </span>
                  ) : (
                    <span className={styles.statusBadge + " " + styles.statusBadgeEmpty}>
                      Sin configurar
                    </span>
                  )}
                </div>
                <p className={styles.personCta}>
                  {hasPlan ? "Ver plan →" : hasProfile ? "Generar plan →" : "Completar perfil →"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
