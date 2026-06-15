import { cn } from "@/lib/cn";
import { HTMLAttributes } from "react";

type AlertVariant = "error" | "info" | "success";

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

const variantStyles: Record<AlertVariant, string> = {
  error: "border-danger/20 bg-danger-soft text-danger",
  info: "border-border bg-surface text-muted",
  success: "border-accent/20 bg-accent-soft text-foreground",
};

export function Alert({ className, variant = "info", ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border px-4 py-3 text-sm leading-relaxed",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
