import type { ReactNode } from "react";
import Link, { type LinkProps } from "next/link";
import { cn } from "@/lib/utils/cn";
import styles from "@/components/ui/Button.module.css";

type ButtonLinkProps = LinkProps & {
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "default" | "small";
};

export function ButtonLink({
  children,
  className,
  variant = "primary",
  size = "default",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        styles.button,
        styles[variant],
        size === "small" && styles.small,
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
