export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <main className="container mx-auto px-4 py-16 text-center">
      <h1 className="mb-4 text-4xl font-semibold">404</h1>
      <p className="mb-8 text-muted-foreground">
        Страница не найдена
      </p>
      <a
        href="/"
        className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
      >
        Вернуться на главную
      </a>
    </main>
  );
}
