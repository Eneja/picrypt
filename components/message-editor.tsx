"use client";

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";
import { useCallback, useEffect, useRef } from "react";

interface MessageEditorProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MessageEditor({ id, value, onChange, placeholder }: MessageEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const element = textareaRef.current;
    if (!element) {
      return;
    }

    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [value, resize]);

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        id={id}
        serif
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onInput={resize}
        placeholder={placeholder}
        rows={1}
        className={cn(
          "min-h-[40vh] resize-none overflow-hidden border-0 bg-surface shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] md:min-h-[50vh]",
          "focus-visible:ring-1 focus-visible:ring-accent/40",
        )}
      />
      <div className="mt-2 flex justify-end px-1">
        <span className="text-xs text-muted" aria-live="polite">
          {value.length > 0 ? `${value.length.toLocaleString()} characters` : "\u00A0"}
        </span>
      </div>
    </div>
  );
}
