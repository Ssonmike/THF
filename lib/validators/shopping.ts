import { z } from "zod";

export const shoppingStateItemSchema = z.object({
  aggregateKey: z.string().trim().min(1),
  itemName: z.string().trim().min(1),
  unit: z.string().trim().min(1)
});

export const shoppingStateMutationSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("toggle"),
    weeklyPlanId: z.string().trim().min(1),
    item: shoppingStateItemSchema,
    checked: z.boolean()
  }),
  z.object({
    action: z.literal("mark-all"),
    weeklyPlanId: z.string().trim().min(1),
    items: z.array(shoppingStateItemSchema)
  }),
  z.object({
    action: z.literal("clear-all"),
    weeklyPlanId: z.string().trim().min(1),
    items: z.array(shoppingStateItemSchema)
  })
]);
