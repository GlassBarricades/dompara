import Link from "next/link";

import {
  type CatalogCategoryNode,
} from "@/lib/catalog-api";

interface CatalogTreeProps {
  tree: CatalogCategoryNode[];
  activeCategorySlug?: string;
  activeSubcategorySlug?: string;
}

export function CatalogTree({
  tree,
  activeCategorySlug,
  activeSubcategorySlug,
}: CatalogTreeProps) {
  return (
    <nav className="space-y-3 text-sm">
      <div className="font-semibold text-xs uppercase text-muted-foreground">
        Каталог
      </div>
      <div className="space-y-1">
        <Link
          href="/catalog"
          className={`block rounded-md px-2 py-1 text-xs ${
            !activeCategorySlug
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          Все разделы
        </Link>
      </div>

      <ul className="space-y-1">
        {tree.map((cat) => {
          const isActiveCategory = cat.slug === activeCategorySlug;
          return (
            <li key={cat.id}>
              <Link
                href={`/catalog/${cat.slug}`}
                className={`flex items-center justify-between rounded-md px-2 py-1 ${
                  isActiveCategory
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <span className="truncate">{cat.name}</span>
              </Link>
              {cat.subcategories.length > 0 && (
                <ul className="mt-1 space-y-0.5 border-l pl-3 text-xs text-muted-foreground">
                  {cat.subcategories.map((sub) => {
                    const isActiveSub =
                      isActiveCategory && sub.slug === activeSubcategorySlug;
                    return (
                      <li key={sub.id}>
                        <Link
                          href={`/catalog/${cat.slug}/${sub.slug}`}
                          className={`block truncate rounded-md px-2 py-0.5 ${
                            isActiveSub
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-accent hover:text-accent-foreground"
                          }`}
                        >
                          {sub.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}


