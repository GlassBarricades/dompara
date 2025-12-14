/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
      },
      {
        protocol: 'https',
        hostname: 'i.pinimg.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.iportal.ru',
      },
      {
        protocol: 'https',
        hostname: 'cache3.youla.io',
      },
      {
        protocol: 'https',
        hostname: 'avatars.mds.yandex.net',
      },
      {
        protocol: 'https',
        hostname: 'pech-berezka.ru',
      },
      // Добавьте другие домены изображений по необходимости
    ],
  },
  // Удаляем console.log в production
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error", "warn"],
    } : false,
  },
};

export default nextConfig;


