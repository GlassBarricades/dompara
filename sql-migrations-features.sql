-- Создание таблицы для преимуществ "Почему выбирают нас"

-- Создаем таблицу features
CREATE TABLE IF NOT EXISTS features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  icon TEXT NOT NULL DEFAULT '💳',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Создаем индекс для сортировки активных преимуществ
CREATE INDEX IF NOT EXISTS idx_features_active_sort ON features(is_active, sort_order) WHERE is_active = true;

-- Добавляем комментарии к таблице и полям
COMMENT ON TABLE features IS 'Преимущества для блока "Почему выбирают нас" на главной странице';
COMMENT ON COLUMN features.icon IS 'Эмодзи-иконка для отображения преимущества';
COMMENT ON COLUMN features.title IS 'Название преимущества';
COMMENT ON COLUMN features.description IS 'Описание преимущества';
COMMENT ON COLUMN features.sort_order IS 'Порядок сортировки (по возрастанию)';
COMMENT ON COLUMN features.is_active IS 'Активно ли преимущество (показывать на главной странице)';

-- Вставляем начальные данные (опционально)
INSERT INTO features (icon, title, description, sort_order, is_active) VALUES
  ('💳', 'Заявка без предоплаты', 'Вы оформляете корзину как заявку, менеджер связывается, уточняет детали и только потом согласует оплату.', 1, true),
  ('💬', 'Живой менеджер', 'Заявка уходит напрямую в Telegram — вам ответит специалист, а не автоответчик.', 2, true),
  ('🎯', 'Подбор под вашу баню', 'Можем подобрать комплект «под ключ» под параметры помещения и ваши пожелания по бюджету.', 3, true),
  ('🚚', 'Быстрая доставка', 'Доставляем товары по всей Беларуси. Согласовываем удобное время и место доставки.', 4, true),
  ('🛠️', 'Монтаж и запуск', 'При необходимости организуем монтаж оборудования и запуск печи с консультацией.', 5, true),
  ('✅', 'Гарантия качества', 'Работаем только с проверенными поставщиками. Гарантия на все товары и сервисное обслуживание.', 6, true)
ON CONFLICT DO NOTHING;
