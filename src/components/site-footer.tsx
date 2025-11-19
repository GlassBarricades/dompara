export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto flex flex-col gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div>© {year} Всё для бани. Все права защищены.</div>
        <div className="flex flex-wrap gap-2">
          <span>Телефон: +375 (___) ___-__-__</span>
          <span className="hidden sm:inline">·</span>
          <span>Режим работы: ежедневно</span>
        </div>
      </div>
    </footer>
  );
}


