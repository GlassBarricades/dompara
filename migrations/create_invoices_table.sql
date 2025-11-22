-- Миграция: создание таблиц для накладных
-- Выполните этот SQL в Supabase SQL Editor или через миграции

-- Таблица накладных
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(100) NOT NULL UNIQUE,
  supplier_name TEXT,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT -- Можно добавить ID пользователя, если есть авторизация
);

-- Таблица позиций накладной
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10, 2), -- Цена за единицу (опционально, для учета)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_product_id ON invoice_items(product_id);

-- Комментарии
COMMENT ON TABLE invoices IS 'Накладные на приход товаров';
COMMENT ON TABLE invoice_items IS 'Позиции накладных (товары с количеством)';

