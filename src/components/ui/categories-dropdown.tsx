"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCatalogTree } from "@/lib/catalog-api";
import type { CatalogCategoryNode } from "@/lib/catalog-api";

interface CategoriesDropdownProps {
  onClose?: () => void;
}

export function CategoriesDropdown({ onClose }: CategoriesDropdownProps) {
  const [categories, setCategories] = useState<CatalogCategoryNode[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen && categories.length === 0) {
      setIsLoading(true);
      getCatalogTree()
        .then((data) => {
          setCategories(data);
        })
        .catch((error) => {
          console.error("Failed to load categories", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, categories.length]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleCategoryClick = (slug: string) => {
    setIsOpen(false);
    if (onClose) onClose();
    router.push(`/catalog/${slug}`);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <span>Каталог</span>
        <span className="text-xs">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-md border bg-background shadow-lg max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Загрузка...
            </div>
          ) : categories.length > 0 ? (
            <div className="py-2">
              {categories.map((category) => (
                <div key={category.id}>
                  <button
                    type="button"
                    onClick={() => handleCategoryClick(category.slug)}
                    className="w-full text-left px-4 py-2 hover:bg-accent transition-colors font-medium text-sm"
                  >
                    {category.name}
                  </button>
                  {category.subcategories.length > 0 && (
                    <div className="pl-4">
                      {category.subcategories.map((subcategory) => (
                        <Link
                          key={subcategory.id}
                          href={`/catalog/${category.slug}/${subcategory.slug}`}
                          onClick={() => {
                            setIsOpen(false);
                            if (onClose) onClose();
                          }}
                          className="block px-4 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        >
                          {subcategory.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Категории не найдены
            </div>
          )}
        </div>
      )}
    </div>
  );
}
