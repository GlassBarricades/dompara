import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import type { PostgrestError } from "@supabase/supabase-js";

interface UseAdminDataOptions {
  table: string;
  select?: string;
  orderBy?: { column: string; ascending?: boolean };
  filter?: Record<string, unknown>;
  enabled?: boolean;
}

interface UseAdminDataResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAdminData<T = unknown>({
  table,
  select = "*",
  orderBy,
  filter,
  enabled = true,
}: UseAdminDataOptions): UseAdminDataResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!enabled || !supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase.from(table).select(select);

      // Применяем фильтры
      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      // Применяем сортировку
      if (orderBy) {
        query = query.order(orderBy.column, {
          ascending: orderBy.ascending ?? true,
        });
      }

      const { data: result, error: queryError } = await query;

      if (queryError) {
        throw queryError;
      }

      setData((result as T[]) ?? []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Произошла ошибка при загрузке данных";
      setError(errorMessage);
      console.error("Admin data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, table]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

