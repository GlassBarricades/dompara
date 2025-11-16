import { supabase } from "@/lib/supabase-client";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
}

function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="rounded-lg border bg-background p-4 space-y-1">
      <div className="text-xs font-medium text-muted-foreground uppercase">
        {label}
      </div>
      <div className="text-2xl font-semibold">{value}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export default async function AdminDashboardPage() {
  if (!supabase) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Дашборд</h1>
        <p className="text-sm text-red-600">
          Supabase не сконфигурирован. Установи переменные окружения
          NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY.git
        </p>
      </section>
    );
  }

  const [catCountRes, subCountRes, prodCountRes, activeProdRes, ordersRes] =
    await Promise.all([
      supabase.from("categories").select("*", { count: "exact", head: true }),
      supabase.from("subcategories").select("*", { count: "exact", head: true }),
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("orders")
        .select("id, customer_name, phone, status, created_at", {
          count: "exact",
        })
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const categoriesCount = catCountRes.count ?? 0;
  const subcategoriesCount = subCountRes.count ?? 0;
  const productsCount = prodCountRes.count ?? 0;
  const activeProductsCount = activeProdRes.count ?? 0;
  const ordersCount = ordersRes.count ?? 0;

  const newOrdersCount =
    ordersRes.data?.filter((o: any) => o.status === "new").length ?? 0;

  const recentOrders = (ordersRes.data ?? []) as {
    id: string;
    customer_name: string;
    phone: string;
    status: string;
    created_at: string;
  }[];

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Дашборд</h1>
        <p className="text-sm text-muted-foreground">
          Краткая сводка по каталогу и заявкам.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Категории" value={categoriesCount} />
        <StatCard label="Подкатегории" value={subcategoriesCount} />
        <StatCard
          label="Товары"
          value={productsCount}
          hint={`Активных: ${activeProductsCount}`}
        />
        <StatCard
          label="Заявки"
          value={ordersCount}
          hint={`Новых: ${newOrdersCount}`}
        />
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Последние заявки</h2>
        <div className="rounded-lg border bg-background">
          {recentOrders.length === 0 ? (
            <p className="px-4 py-4 text-sm text-muted-foreground">
              Пока нет ни одной заявки.
            </p>
          ) : (
            <div className="divide-y text-sm">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col gap-1 px-4 py-3 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="font-medium">{order.customer_name}</div>
                    <div className="text-xs text-muted-foreground">
                      Телефон: {order.phone}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      {new Date(order.created_at).toLocaleString("ru-RU")}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5">
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}


