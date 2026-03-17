import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import styles from "@/components/ui/Field.module.css";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
};

export function Textarea({ label, hint, className, id, ...props }: TextareaProps) {
  return (
    <label className={styles.field} htmlFor={id}>
      {label ? <span className={styles.label}>{label}</span> : null}
      <textarea id={id} className={cn(styles.control, styles.textarea, className)} {...props} />
      {hint ? <span className={styles.hint}>{hint}</span> : null}
    </label>
  );
}
