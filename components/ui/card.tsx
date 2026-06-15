import { cn } from "@/lib/cn";
import { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface shadow-sm shadow-black/[0.03] dark:shadow-black/20",
        className,
      )}
      {...props}
    />
  );
}
