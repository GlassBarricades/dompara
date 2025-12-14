import { useState, useCallback } from "react";

export function useFormState<T extends Record<string, unknown>>(
  initialValues: T
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const setValue = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    // Очищаем ошибку при изменении значения
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }, [errors]);

  const setError = useCallback(<K extends keyof T>(key: K, error: string | undefined) => {
    setErrors((prev) => {
      if (error === undefined) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: error };
    });
  }, []);

  const setFieldTouched = useCallback(<K extends keyof T>(key: K, isTouched = true) => {
    setTouched((prev) => ({ ...prev, [key]: isTouched }));
  }, []);

  const reset = useCallback((newValues?: T) => {
    setValues(newValues ?? initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const validate = useCallback(
    (validator: (values: T) => Partial<Record<keyof T, string>>) => {
      const validationErrors = validator(values);
      setErrors(validationErrors);
      return Object.keys(validationErrors).length === 0;
    },
    [values]
  );

  return {
    values,
    errors,
    touched,
    setValue,
    setError,
    setFieldTouched,
    reset,
    validate,
  };
}

