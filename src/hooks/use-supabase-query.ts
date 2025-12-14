import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import type { PostgrestError } from "@supabase/supabase-js";

interface UseSupabaseQueryOptions<T> {
  query: () => Promise<{ data: T | null; error: PostgrestError | null }>;
  enabled?: boolean;
}

interface UseSupabaseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSupabaseQuery<T>({
  query,
  enabled = true,
}: UseSupabaseQueryOptions<T>): UseSupabaseQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
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
      const { data: result, error: queryError } = await query();
      
      if (queryError) {
        throw queryError;
      }

      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Произошла ошибка при загрузке данных";
      setError(errorMessage);
      console.error("Supabase query error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

