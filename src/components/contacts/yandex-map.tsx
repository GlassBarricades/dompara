"use client";

interface YandexMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  className?: string;
}

export function YandexMap({ latitude, longitude, zoom = 15, className = "" }: YandexMapProps) {
  // Формируем URL для iframe Яндекс.Карт
  // Используем конструктор карт Яндекс без API ключа
  const mapUrl = `https://yandex.ru/map-widget/v1/?ll=${longitude},${latitude}&z=${zoom}&pt=${longitude},${latitude}&l=map`;

  return (
    <iframe
      src={mapUrl}
      className={`w-full h-full border-0 ${className}`}
      style={{ minHeight: "300px" }}
      allowFullScreen
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}
