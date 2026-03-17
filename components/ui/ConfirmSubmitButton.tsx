"use client";

import { type ButtonHTMLAttributes } from "react";
import { Button } from "@/components/ui/Button";

type ConfirmSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  message: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function ConfirmSubmitButton({
  message,
  onClick,
  variant = "danger",
  ...props
}: ConfirmSubmitButtonProps) {
  return (
    <Button
      {...props}
      variant={variant}
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
          return;
        }

        onClick?.(event);
      }}
    />
  );
}
