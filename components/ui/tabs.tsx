"use client";

import { cn } from "@/lib/cn";

export type AppTab = "compose" | "unlock";

interface TabsProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const tabs: { id: AppTab; label: string }[] = [
  { id: "compose", label: "Compose" },
  { id: "unlock", label: "Unlock" },
];

export function Tabs({ activeTab, onTabChange }: TabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Main navigation"
      className="flex gap-1 border-b border-border"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative px-4 py-3 text-sm font-medium transition-colors motion-safe:duration-200",
              isActive ? "text-accent" : "text-muted hover:text-foreground",
            )}
          >
            {tab.label}
            {isActive ? (
              <span
                aria-hidden
                className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-accent motion-safe:transition-opacity"
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
