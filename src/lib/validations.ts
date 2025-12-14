import { z } from "zod";

// Валидация данных корзины
export const cartItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
});

export const cartSubmitSchema = z.object({
  items: z.array(cartItemSchema).min(1, "Корзина не может быть пустой"),
  customer: z.object({
    name: z.string().min(1, "Имя обязательно"),
    phone: z.string().min(1, "Телефон обязателен"),
    email: z.string().email("Неверный формат email").optional().nullable(),
    telegram: z.string().optional().nullable(),
    comment: z.string().optional().nullable(),
  }),
});

export type CartSubmitInput = z.infer<typeof cartSubmitSchema>;

// Валидация категории
export const categorySchema = z.object({
  name: z.string().min(1, "Название обязательно"),
  slug: z.string().min(1, "Slug обязателен"),
  description: z.string().nullable().optional(),
  sort_order: z.number().int().nonnegative(),
  image_url: z.string().url("Неверный URL изображения").nullable().optional(),
  vertical_card_layout: z.boolean().optional(),
});

// Валидация товара
export const productSchema = z.object({
  name: z.string().min(1, "Название обязательно"),
  slug: z.string().min(1, "Slug обязателен"),
  category_id: z.string().min(1, "Категория обязательна"),
  subcategory_id: z.string().nullable().optional(),
  short_description: z.string().nullable().optional(),
  price: z.number().nonnegative("Цена не может быть отрицательной"),
  main_image_url: z.string().url("Неверный URL изображения").nullable().optional(),
  gallery: z.array(z.string().url()).nullable().optional(),
  stock_quantity: z.number().int().nonnegative().nullable().optional(),
  is_active: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  is_custom_order: z.boolean().optional(),
});

// Валидация заказа
export const orderStatusSchema = z.enum([
  "new",
  "in_progress",
  "completed",
  "rejected",
]);

export const orderUpdateSchema = z.object({
  status: orderStatusSchema,
  comment: z.string().optional().nullable(),
});

// Валидация email для форм
export const emailSchema = z.string().email("Неверный формат email");

// Валидация телефона (базовая)
export const phoneSchema = z
  .string()
  .min(1, "Телефон обязателен")
  .regex(/^[\d\s\-\+\(\)]+$/, "Неверный формат телефона");

// Функция для форматирования ошибок
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Произошла неизвестная ошибка";
}

