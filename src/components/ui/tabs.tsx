"use client";

import { useState, type ReactNode } from "react";

interface TabsProps {
  defaultTab?: string;
  tabs: { id: string; label: string; content: ReactNode }[];
}

export function Tabs({ defaultTab, tabs }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const activeContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <div className="space-y-4">
      <div className="border-b">
        <nav className="flex gap-4 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="animate-in fade-in duration-200">
        {activeContent}
      </div>
    </div>
  );
}
