// Экспортируем типы из API файлов
import type {
  Category,
  Subcategory,
  Product,
  AttributeDataType,
  ProductAttributeDisplay,
  FilterableAttributeDefinition,
  ProductAttributeValueRow,
} from "@/lib/catalog-api";

import type { ContactSettings } from "@/lib/settings-api";

// Реэкспортируем типы
export type {
  Category,
  Subcategory,
  Product,
  AttributeDataType,
  ProductAttributeDisplay,
  FilterableAttributeDefinition,
  ProductAttributeValueRow,
  ContactSettings,
};

// Расширенные типы для админки (включают дополнительные поля из БД)
export interface CategoryWithSort extends Category {
  sort_order: number;
}

export interface SubcategoryWithSort extends Subcategory {
  sort_order: number;
}

export interface ProductWithStatus extends Product {
  is_active: boolean;
}

// Типы для заказов
export type OrderStatus = "new" | "in_progress" | "completed" | "rejected";

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  customer_name: string;
  phone: string;
  email: string | null;
  telegram: string | null;
  comment: string | null;
  items: OrderItem[];
  status: OrderStatus;
  created_at: string;
  updated_at?: string;
}

// Типы для характеристик
export interface AttributeDefinition {
  id: string;
  name: string;
  slug: string;
  data_type: AttributeDataType;
  unit: string | null;
  options: Array<{ value: string; label: string }> | null;
  description: string | null;
}

export interface AttributeAssignment {
  id: string;
  product_id: string;
  attribute_definition_id: string;
  value: any;
  sort_order: number;
}

// Типы для отзывов
export interface Review {
  id: string;
  product_id: string | null;
  author_name: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
}

// Типы для FAQ
export interface FAQ {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
}

// Типы для баннеров
export interface Banner {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
}

// Типы для преимуществ
export interface Feature {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
}

// Типы для страниц контента
export interface Page {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_title: string | null;
  meta_description: string | null;
}

// Типы для накладных
export interface Invoice {
  id: string;
  invoice_number: string;
  supplier_name: string | null;
  invoice_date: string;
  total_amount: number | null;
  comment: string | null;
  created_at: string;
}

// Типы для движения товаров
export interface StockMovement {
  id: string;
  product_id: string;
  invoice_id: string | null;
  movement_type: "in" | "out" | "adjustment";
  quantity: number;
  comment: string | null;
  created_at: string;
}

// Опции для форм
export interface Option {
  value: string;
  label: string;
}

