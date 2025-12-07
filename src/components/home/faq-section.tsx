import { getActiveFAQItems } from "@/lib/faq-api";
import { Accordion } from "@/components/ui/accordion";
import type { FAQItem } from "@/lib/faq-api";

export async function FAQSection() {
  const faqItems = await getActiveFAQItems();

  if (faqItems.length === 0) {
    return null;
  }

  return (
    <section className="container mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Часто задаваемые вопросы</h2>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          Ответы на популярные вопросы о заказе, доставке и обслуживании
        </p>
      </div>
      <div className="max-w-3xl mx-auto">
        <Accordion
          items={faqItems.map((item) => ({
            id: item.id,
            question: item.question,
            answer: item.answer,
          }))}
        />
      </div>
    </section>
  );
}
