-- Миграция: добавление поля stock_quantity в таблицу products
-- Выполните этот SQL в Supabase SQL Editor или через миграции

ALTER TABLE products
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT NULL;

COMMENT ON COLUMN products.stock_quantity IS 'Остаток товара на складе. NULL означает, что остаток не отслеживается.';

