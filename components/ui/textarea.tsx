import { cn } from "@/lib/cn";
import { TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  serif?: boolean;
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, serif, invalid, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          "w-full rounded-xl border border-border bg-surface px-4 py-3.5 text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ring-offset)]",
          invalid
            ? "border-danger focus-visible:ring-danger"
            : "focus-visible:ring-accent",
          serif ? "font-serif text-[17px] leading-relaxed" : "text-base leading-normal",
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";
