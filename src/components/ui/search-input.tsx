"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { searchProducts } from "@/lib/catalog-api";
import type { Product } from "@/lib/catalog-api";

interface SearchInputProps {
  onClose?: () => void;
}

export function SearchInput({ onClose }: SearchInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    }

    if (showResults) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showResults]);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsSearching(true);
        setShowResults(true);
        try {
          const products = await searchProducts(query, 8);
          setResults(products);
        } catch (error) {
          console.error("Search error:", error);
          setResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleProductClick = (product: Product) => {
    setShowResults(false);
    setQuery("");
    if (onClose) onClose();
    router.push(`/product/${product.slug}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2 && results.length > 0) {
      handleProductClick(results[0]);
    } else if (query.trim().length >= 2) {
      router.push(`/catalog?search=${encodeURIComponent(query.trim())}`);
      setShowResults(false);
      setQuery("");
      if (onClose) onClose();
    }
  };

  return (
    <div className="relative w-full max-w-md" ref={containerRef}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск товаров..."
            className="w-full rounded-md border bg-background px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
            {isSearching ? "⏳" : "🔍"}
          </div>
        </div>
      </form>

      {showResults && (query.trim().length >= 2 || results.length > 0) && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-background shadow-lg max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Поиск...
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleProductClick(product)}
                  className="w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    {product.main_image_url && (
                      <img
                        src={product.main_image_url}
                        alt={product.name}
                        className="h-12 w-12 rounded object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {product.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {product.price.toLocaleString("ru-RU")} BYN
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              {results.length >= 8 && (
                <Link
                  href={`/catalog?search=${encodeURIComponent(query.trim())}`}
                  onClick={() => {
                    setShowResults(false);
                    setQuery("");
                    if (onClose) onClose();
                  }}
                  className="block px-4 py-2 text-center text-sm text-primary hover:bg-accent transition-colors border-t"
                >
                  Показать все результаты
                </Link>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Товары не найдены
            </div>
          )}
        </div>
      )}
    </div>
  );
}
