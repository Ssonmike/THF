import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import styles from "@/components/ui/Badge.module.css";

type BadgeProps = {
  children: ReactNode;
  neutral?: boolean;
};

export function Badge({ children, neutral = false }: BadgeProps) {
  return <span className={cn(styles.badge, neutral && styles.neutral)}>{children}</span>;
}
