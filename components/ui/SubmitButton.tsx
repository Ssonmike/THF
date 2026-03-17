"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";

type SubmitButtonProps = {
  label: string;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  fullWidth?: boolean;
};

export function SubmitButton({
  label,
  pendingLabel = "Saving...",
  variant = "primary",
  fullWidth = false
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} variant={variant} fullWidth={fullWidth}>
      {pending ? pendingLabel : label}
    </Button>
  );
}
