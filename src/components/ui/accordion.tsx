"use client";

import { useState } from "react";

interface AccordionItem {
  id: string;
  question: string;
  answer: string;
}

interface AccordionProps {
  items: AccordionItem[];
  className?: string;
}

export function Accordion({ items, className = "" }: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((item) => {
        const isOpen = openItems.has(item.id);
        return (
          <div key={item.id} className="border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => toggleItem(item.id)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent transition-colors touch-manipulation min-h-[44px]"
            >
              <span className="font-medium text-sm pr-4">{item.question}</span>
              <span className="text-muted-foreground flex-shrink-0">
                {isOpen ? "▲" : "▼"}
              </span>
            </button>
            {isOpen && (
              <div className="px-4 pb-3 pt-0">
                <div
                  className="text-sm text-muted-foreground prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2"
                  dangerouslySetInnerHTML={{ __html: item.answer }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
