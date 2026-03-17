import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import styles from "@/components/ui/Field.module.css";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
};

export function Select({ label, hint, className, id, children, ...props }: SelectProps) {
  return (
    <label className={styles.field} htmlFor={id}>
      {label ? <span className={styles.label}>{label}</span> : null}
      <select id={id} className={cn(styles.control, className)} {...props}>
        {children}
      </select>
      {hint ? <span className={styles.hint}>{hint}</span> : null}
    </label>
  );
}
