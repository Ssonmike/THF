import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  setShoppingItemChecked,
  setShoppingItemsChecked
} from "@/lib/services/shopping";
import { logger } from "@/lib/utils/logger";
import { shoppingStateMutationSchema } from "@/lib/validators/shopping";

export async function POST(request: Request) {
  try {
    const body = shoppingStateMutationSchema.parse(await request.json());

    if (body.action === "toggle") {
      await setShoppingItemChecked(body.weeklyPlanId, body.item, body.checked);
    } else if (body.action === "mark-all") {
      await setShoppingItemsChecked(body.weeklyPlanId, body.items, true);
    } else {
      await setShoppingItemsChecked(body.weeklyPlanId, body.items, false);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("shopping list state mutation failed", error);

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof ZodError
            ? error.issues[0]?.message ?? "Peticion de lista de compra invalida."
            : "No se pudo actualizar el estado de la lista de compra."
      },
      { status: 400 }
    );
  }
}
