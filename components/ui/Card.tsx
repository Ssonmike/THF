import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import styles from "@/components/ui/Card.module.css";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(styles.card, className)} {...props} />;
}
