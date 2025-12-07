-- Добавление полей для координат карты в настройки контактов

-- Добавляем поля для координат карты
ALTER TABLE contact_settings 
ADD COLUMN IF NOT EXISTS map_latitude DECIMAL(10, 8);
ALTER TABLE contact_settings 
ADD COLUMN IF NOT EXISTS map_longitude DECIMAL(11, 8);
ALTER TABLE contact_settings 
ADD COLUMN IF NOT EXISTS map_zoom INTEGER DEFAULT 15;

-- Добавляем комментарии
COMMENT ON COLUMN contact_settings.map_latitude IS 'Широта для отображения точки на карте';
COMMENT ON COLUMN contact_settings.map_longitude IS 'Долгота для отображения точки на карте';
COMMENT ON COLUMN contact_settings.map_zoom IS 'Уровень масштаба карты (от 1 до 19, по умолчанию 15)';
