import { getPageContent } from "@/lib/page-content-api";

export const revalidate = 0;

export default async function DeliveryPage() {
  const pageContent = await getPageContent("delivery");

  return (
    <main className="container mx-auto px-4 py-8 space-y-6">
      {pageContent ? (
        <>
          <h1 className="text-2xl font-semibold">{pageContent.title}</h1>
          <div
            className="prose prose-sm max-w-none prose-headings:mt-6 prose-headings:mb-4 prose-p:my-3 prose-ul:my-3 prose-ol:my-3"
            dangerouslySetInnerHTML={{ __html: pageContent.content_html }}
          />
        </>
      ) : (
        <>
          <h1 className="text-2xl font-semibold mb-4">Доставка и оплата</h1>
          <p className="text-muted-foreground">
            Контент страницы ещё не настроен. Обратитесь к администратору.
          </p>
        </>
      )}
    </main>
  );
}


