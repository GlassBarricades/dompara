import { useState, useEffect } from "react";

const SEARCH_HISTORY_KEY = "dompara_search_history";
const MAX_HISTORY_ITEMS = 10;

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        const items: string[] = JSON.parse(stored);
        setHistory(items);
      }
    } catch (error) {
      console.error("Failed to load search history:", error);
    }
  }, []);

  const addToHistory = (query: string) => {
    if (!query.trim()) return;

    const trimmed = query.trim().toLowerCase();
    setHistory((prev) => {
      const filtered = prev.filter((q) => q.toLowerCase() !== trimmed);
      const updated = [trimmed, ...filtered].slice(0, MAX_HISTORY_ITEMS);

      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error("Failed to save search history:", error);
      }

      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (error) {
      console.error("Failed to clear search history:", error);
    }
  };

  return { history, addToHistory, clearHistory };
}

