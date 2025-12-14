"use client";

import * as React from "react";
import {
  useForm,
  UseFormReturn,
  FormProvider as RHFFormProvider,
  useFormContext as useRHFFormContext,
  FieldValues,
  Path,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";

interface FormProps<T extends FieldValues> {
  schema: z.ZodSchema<T>;
  defaultValues?: Partial<T>;
  onSubmit: (data: T) => void | Promise<void>;
  children: React.ReactNode;
  className?: string;
}

export function Form<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  children,
  className,
}: FormProps<T>) {
  const methods = useForm<T>({
    // @ts-expect-error - типы react-hook-form и zod могут конфликтовать, но работают корректно
    resolver: zodResolver(schema),
    // @ts-expect-error - типы могут конфликтовать, но работают корректно
    defaultValues,
  });

  const handleSubmit = methods.handleSubmit(async (data) => {
    await onSubmit(data as unknown as T);
  });

  return (
    <RHFFormProvider {...methods}>
      <form onSubmit={handleSubmit} className={cn(className)}>
        {children}
      </form>
    </RHFFormProvider>
  );
}

interface FormFieldProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  required?: boolean;
  children: (field: {
    value: unknown;
    onChange: (value: unknown) => void;
    error?: string;
  }) => React.ReactNode;
  className?: string;
}

export function FormField<T extends FieldValues>({
  name,
  label,
  required,
  children,
  className,
}: FormFieldProps<T>) {
  const methods = useRHFFormContext<T>();
  const {
    formState: { errors },
    setValue,
    watch,
  } = methods;

  const error = errors[name]?.message as string | undefined;
  const value = watch(name);

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label htmlFor={String(name)} className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      {children({
        value,
        onChange: (newValue) => setValue(name, newValue as T[Path<T>], { shouldValidate: true }),
        error,
      })}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

// Экспортируем useFormContext для использования в компонентах
export { useRHFFormContext as useFormContext };

