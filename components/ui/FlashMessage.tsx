import { cn } from "@/lib/utils/cn";
import styles from "@/components/ui/FlashMessage.module.css";

type FlashMessageProps = {
  message?: string;
  tone?: "success" | "error";
};

export function FlashMessage({ message, tone = "success" }: FlashMessageProps) {
  if (!message) {
    return null;
  }

  return <div className={cn(styles.message, styles[tone])}>{message}</div>;
}
