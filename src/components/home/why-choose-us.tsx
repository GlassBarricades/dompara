import { getActiveFeatures } from "@/lib/features-api";
import type { Feature } from "@/lib/features-api";

export async function WhyChooseUs() {
  const features = await getActiveFeatures();

  return (
    <section className="container mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Почему выбирают нас</h2>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          Мы заботимся о каждом клиенте и предлагаем не просто товары, а комплексные решения для вашей бани
        </p>
      </div>
      {features.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          Преимущества не настроены
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              className="rounded-lg border bg-background p-6 hover:shadow-md transition-shadow duration-200 animate-in fade-in slide-in-from-bottom-4"
              style={{
                animationDelay: `${index * 100}ms`,
                animationFillMode: "both",
              }}
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl flex-shrink-0">{feature.icon}</div>
                <div className="space-y-1 flex-1">
                  <div className="font-medium text-sm">{feature.title}</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
