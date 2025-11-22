-- Миграция: добавление поля is_custom_order в таблицу products
-- Выполните этот SQL в Supabase SQL Editor или через миграции

ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_custom_order BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN products.is_custom_order IS 'Товар изготавливается под заказ. У таких товаров остатки не отслеживаются.';

