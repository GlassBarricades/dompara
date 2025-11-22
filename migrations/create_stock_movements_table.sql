-- Миграция: создание таблицы для логов изменений остатков
-- Выполните этот SQL в Supabase SQL Editor или через миграции

CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  old_quantity INTEGER,
  new_quantity INTEGER,
  movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('income', 'outcome', 'set', 'inventory')),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT -- Можно добавить ID пользователя, если есть авторизация
);

-- Индекс для быстрого поиска по товару
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);

-- Индекс для сортировки по дате
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at DESC);

-- Комментарии к полям
COMMENT ON TABLE stock_movements IS 'Логи изменений остатков товаров';
COMMENT ON COLUMN stock_movements.movement_type IS 'Тип операции: income (приход), outcome (списание), set (установка), inventory (инвентаризация)';
COMMENT ON COLUMN stock_movements.old_quantity IS 'Старое значение остатка (NULL если не отслеживался)';
COMMENT ON COLUMN stock_movements.new_quantity IS 'Новое значение остатка (NULL если не отслеживается)';

