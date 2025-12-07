"use client";

import { useState, useMemo, useRef, useEffect } from "react";

interface ProductOption {
  id: string;
  name: string;
  slug: string;
}

interface ProductSelectProps {
  products: ProductOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ProductSelect({
  products,
  value,
  onChange,
  disabled = false,
  placeholder = "Выберите товар...",
}: ProductSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedProduct = products.find((p) => p.id === value);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const query = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.slug.toLowerCase().includes(query)
    );
  }, [products, search]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent transition-colors"
      >
        <span className={selectedProduct ? "" : "text-muted-foreground"}>
          {selectedProduct ? selectedProduct.name : placeholder}
        </span>
        <span className="text-muted-foreground">
          {isOpen ? "▲" : "▼"}
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 rounded-md border bg-background shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b">
            <input
              type="text"
              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
              placeholder="Поиск товара..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="overflow-y-auto max-h-48">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
                setSearch("");
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors ${
                !value ? "bg-accent font-medium" : ""
              }`}
            >
              Общий отзыв
            </button>
            {filteredProducts.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                Товары не найдены
              </div>
            ) : (
              filteredProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => {
                    onChange(product.id);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors ${
                    value === product.id ? "bg-accent font-medium" : ""
                  }`}
                >
                  {product.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
