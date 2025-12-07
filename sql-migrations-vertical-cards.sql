-- Добавление поля для вертикального отображения карточек товаров

-- Добавляем поле в таблицу categories
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS vertical_card_layout BOOLEAN NOT NULL DEFAULT false;

-- Добавляем поле в таблицу subcategories
ALTER TABLE subcategories 
ADD COLUMN IF NOT EXISTS vertical_card_layout BOOLEAN NOT NULL DEFAULT false;

-- Добавляем комментарии
COMMENT ON COLUMN categories.vertical_card_layout IS 'Использовать вертикальное отображение карточек товаров (более высокие изображения)';
COMMENT ON COLUMN subcategories.vertical_card_layout IS 'Использовать вертикальное отображение карточек товаров (более высокие изображения)';
