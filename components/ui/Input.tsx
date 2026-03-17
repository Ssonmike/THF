import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import styles from "@/components/ui/Field.module.css";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
};

export function Input({ label, hint, className, id, ...props }: InputProps) {
  return (
    <label className={styles.field} htmlFor={id}>
      {label ? <span className={styles.label}>{label}</span> : null}
      <input id={id} className={cn(styles.control, className)} {...props} />
      {hint ? <span className={styles.hint}>{hint}</span> : null}
    </label>
  );
}
