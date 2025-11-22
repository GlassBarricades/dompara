-- Миграция: обновление статусов заявок и создание таблицы логов
-- Выполните этот SQL в Supabase SQL Editor или через миграции

-- Обновляем тип статуса заявки (если нужно изменить существующий CHECK constraint)
-- Сначала удаляем старый constraint, если он существует
DO $$ 
BEGIN
  -- Проверяем и обновляем constraint для статуса
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'orders_status_check' 
    AND table_name = 'orders'
  ) THEN
    ALTER TABLE orders DROP CONSTRAINT orders_status_check;
  END IF;
END $$;

-- Добавляем новый constraint с финальными статусами
ALTER TABLE orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('new', 'in_progress', 'completed', 'rejected'));

-- Комментарий к статусам
COMMENT ON COLUMN orders.status IS 'Статус заявки: new (новая), in_progress (в работе), completed (проведена), rejected (отклонена)';

-- Таблица логов изменений заявок
CREATE TABLE IF NOT EXISTS order_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  field_name VARCHAR(50), -- Поле, которое изменилось (status, customer_name, items, etc.)
  old_value TEXT, -- Старое значение (JSON для сложных полей)
  new_value TEXT, -- Новое значение (JSON для сложных полей)
  comment TEXT, -- Комментарий к изменению
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT -- Можно добавить ID пользователя, если есть авторизация
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_order_logs_order_id ON order_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_order_logs_created_at ON order_logs(created_at DESC);

-- Комментарии
COMMENT ON TABLE order_logs IS 'Логи изменений заявок для контроля всех операций';
COMMENT ON COLUMN order_logs.field_name IS 'Название поля, которое изменилось (null для общих изменений)';

