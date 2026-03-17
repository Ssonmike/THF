import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { getProjectRoot } from "./db-path.mjs";

const prisma = new PrismaClient();

async function main() {
  const exportDirectory = path.join(getProjectRoot(), "exports");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const exportPath = path.join(exportDirectory, `nutri-week-export-${timestamp}.json`);

  fs.mkdirSync(exportDirectory, { recursive: true });

  const payload = {
    exportedAt: new Date().toISOString(),
    people: await prisma.person.findMany({ orderBy: { name: "asc" } }),
    recipes: await prisma.recipe.findMany({
      include: {
        ingredients: {
          orderBy: {
            sortOrder: "asc"
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    }),
    weeklyPlans: await prisma.weeklyPlan.findMany({
      include: {
        plannedMeals: {
          include: {
            portions: true
          }
        },
        shoppingItemStates: true
      },
      orderBy: {
        weekStartDate: "asc"
      }
    })
  };

  fs.writeFileSync(exportPath, JSON.stringify(payload, null, 2));
  console.log(`Data exported to ${exportPath}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
