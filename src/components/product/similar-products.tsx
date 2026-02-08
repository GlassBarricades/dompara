import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { Product } from '@/lib/catalog-api'

interface SimilarProductsProps {
    products: Product[]
    currentProductId: string
}

export function SimilarProducts({ products, currentProductId }: SimilarProductsProps) {
    if (products.length === 0) return null

    console.log(products)

    return (
        <section className="space-y-4 pt-8 border-t">
            <h2 className="text-xl font-semibold">Похожие товары</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {products
                    .filter((p) => p.id !== currentProductId)
                    .map((product, index) => (
                        <Link
                            key={product.id}
                            href={`/product/${product.slug}`}
                            className="relative flex flex-col rounded-lg border bg-background p-4 transition-all duration-200 hover:bg-accent hover:shadow-md hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4"
                            style={{
                                animationDelay: `${index * 50}ms`,
                                animationFillMode: 'both',
                            }}
                        >
                            <div className="mb-3 flex h-40 items-center justify-center overflow-hidden rounded-md border bg-muted">
                                {product.main_image_url ? (
                                    <img src={product.main_image_url} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
                                ) : (
                                    <span className="text-xs text-muted-foreground">Нет изображения</span>
                                )}
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="text-xs font-semibold uppercase text-muted-foreground">Товар</div>
                                <div className="font-medium line-clamp-2">{product.name}</div>
                            </div>
                            <div className="mt-3 flex items-center justify-between text-sm font-semibold">
                                <span>
                                    {product.is_custom_order === true || product.category_id === 'bcb746f9-6815-4ff6-92b6-9d1c5cefad9b' ? ' от' : ''}{' '}
                                    {product.price.toLocaleString('ru-RU')} BYN
                                </span>
                                <Button variant="outline" size="sm" className="border-primary text-xs text-primary" onClick={(e) => e.preventDefault()}>
                                    Подробнее
                                </Button>
                            </div>
                        </Link>
                    ))}
            </div>
        </section>
    )
}
