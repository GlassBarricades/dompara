'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/stores/cart-context'
import { toast } from 'sonner'
import type { Product, ProductAttributeDisplay } from '@/lib/catalog-api'

// Компонент вкладок со скроллом для контента
function TabsWithScroll({ defaultTab, tabs }: { defaultTab?: string; tabs: { id: string; label: string; content: ReactNode }[] }) {
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

    const activeContent = tabs.find((tab) => tab.id === activeTab)?.content

    return (
        <div className="flex flex-col min-h-0 h-full">
            <div className="border-b flex-shrink-0">
                <nav className="flex gap-4 -mb-px">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                                activeTab === tab.id
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain [webkit-overflow-scrolling:touch] pt-4 animate-in fade-in duration-200">
                {activeContent}
            </div>
        </div>
    )
}

interface QuickViewModalProps {
    productSlug: string | null
    isOpen: boolean
    onClose: () => void
}

interface ProductData {
    product: Product
    attributes: ProductAttributeDisplay[]
}

export function QuickViewModal({ productSlug, isOpen, onClose }: QuickViewModalProps) {
    const router = useRouter()
    const cartStore = useCartStore()
    const [data, setData] = useState<ProductData | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [activeImageIndex, setActiveImageIndex] = useState(0)
    const [justAdded, setJustAdded] = useState(false)

    useEffect(() => {
        if (!isOpen || !productSlug) {
            setData(null)
            setError(null)
            setActiveImageIndex(0)
            return
        }

        async function loadProduct() {
            setLoading(true)
            setError(null)
            try {
                const response = await fetch(`/api/products/${productSlug}`)
                if (!response.ok) {
                    if (response.status === 404) {
                        setError('Товар не найден')
                    } else {
                        setError('Не удалось загрузить товар')
                    }
                    return
                }
                const responseData = (await response.json()) as ProductData
                setData(responseData)
            } catch (err) {
                console.error('Failed to load product', err)
                setError('Не удалось загрузить товар')
            } finally {
                setLoading(false)
            }
        }

        void loadProduct()
    }, [isOpen, productSlug])

    // Закрытие по Escape и блокировка скролла
    useEffect(() => {
        if (!isOpen) return

        function handleEscape(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                onClose()
            }
        }

        document.addEventListener('keydown', handleEscape)

        // Блокируем скролл фона и компенсируем ширину скроллбара
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
        const originalOverflow = document.body.style.overflow
        const originalPaddingRight = document.body.style.paddingRight

        document.body.style.overflow = 'hidden'
        if (scrollbarWidth > 0) {
            document.body.style.paddingRight = `${scrollbarWidth}px`
        }

        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = originalOverflow
            document.body.style.paddingRight = originalPaddingRight
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    const product = data?.product
    const attributes = data?.attributes ?? []

    function handleAddToCart() {
        if (!product) return
        cartStore.addItem({
            id: product.id,
            name: product.name,
            price: product.price,
        })
        setJustAdded(true)
        setTimeout(() => setJustAdded(false), 1200)
    }

    function handleViewDetails() {
        if (!product) return
        onClose()
        router.push(`/product/${product.slug}`)
    }

    const images = product ? [product.main_image_url, ...(Array.isArray(product.gallery) ? product.gallery : [])].filter((src): src is string => !!src) : []

    function formatAttributeValue(attr: ProductAttributeDisplay): string | null {
        const { data_type, value, options } = attr
        if (value === null || value === undefined) return null

        switch (data_type) {
            case 'string':
                return String(value)
            case 'number': {
                const n = Number(value)
                return Number.isNaN(n) ? null : String(n)
            }
            case 'boolean':
                return value ? 'Да' : 'Нет'
            case 'select': {
                const val = String(value)
                const opt = Array.isArray(options) && options.find((o: any) => o.value === val)
                return opt ? (opt.label ?? opt.value) : val
            }
            case 'multiselect': {
                const arr = Array.isArray(value) ? value : []
                if (!arr.length) return null
                if (!Array.isArray(options)) {
                    return arr.join(', ')
                }
                const labels = arr.map((v: any) => {
                    const opt = options.find((o: any) => o.value === v)
                    return opt ? (opt.label ?? opt.value) : v
                })
                return labels.join(', ')
            }
            default:
                return null
        }
    }

    const tabsContent = product
        ? [
              {
                  id: 'description',
                  label: 'Описание',
                  content: product.short_description ? (
                      <div
                          className="text-sm text-muted-foreground prose prose-sm max-w-none prose-p:my-2 prose-headings:my-2 prose-ul:my-2 prose-ol:my-2"
                          dangerouslySetInnerHTML={{ __html: product.short_description }}
                      />
                  ) : (
                      <p className="text-sm text-muted-foreground">Описание товара отсутствует.</p>
                  ),
              },
              {
                  id: 'specs',
                  label: 'Характеристики',
                  content:
                      attributes.length > 0 ? (
                          <dl className="space-y-2 text-sm">
                              {attributes.map((attr) => {
                                  const label = attr.name
                                  const value = formatAttributeValue(attr)
                                  if (value == null || value === '') return null
                                  return (
                                      <div key={attr.id} className="flex justify-between gap-2 py-2 border-b last:border-0">
                                          <dt className="text-muted-foreground">
                                              {label}
                                              {attr.unit && <span className="text-[10px] text-muted-foreground"> ({attr.unit})</span>}
                                          </dt>
                                          <dd className="text-right font-medium">{value}</dd>
                                      </div>
                                  )
                              })}
                          </dl>
                      ) : (
                          <p className="text-sm text-muted-foreground">Характеристики не указаны.</p>
                      ),
              },
          ]
        : []

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 md:items-center md:p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="w-full md:max-w-5xl h-[100dvh] max-h-[100dvh] md:h-[90vh] md:max-h-[90vh] flex flex-col rounded-t-lg border bg-background md:rounded-lg animate-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="text-muted-foreground">Загрузка...</div>
                    </div>
                ) : error ? (
                    <div className="p-12 text-center space-y-4">
                        <div className="text-red-600">{error}</div>
                        <Button variant="outline" onClick={onClose}>
                            Закрыть
                        </Button>
                    </div>
                ) : product ? (
                    <div className="grid flex-1 min-h-0 gap-4 p-4 md:grid-cols-[1fr,1fr] md:gap-6 md:p-6 overflow-hidden">
                        {/* Левая колонка: Галерея */}
                        <div className="space-y-4 flex flex-col">
                            <div className="relative aspect-[4/3] md:aspect-square overflow-hidden rounded-lg border bg-muted">
                                {images.length > 0 ? (
                                    <img src={images[activeImageIndex]} alt={product.name} className="h-full w-full object-contain" loading="lazy" />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-muted-foreground">Нет изображения</div>
                                )}
                                {/* Бейджи */}
                                <div className="absolute top-2 left-2 flex flex-col gap-1">
                                    {product.is_featured && (
                                        <span className="inline-flex items-center rounded-full bg-amber-500 px-2 py-0.5 text-xs font-medium text-white">
                                            ⭐ Популярный
                                        </span>
                                    )}
                                    {product.is_custom_order && (
                                        <span className="inline-flex items-center rounded-full bg-purple-500 px-2 py-0.5 text-xs font-medium text-white">
                                            📦 Под заказ
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Миниатюры галереи */}
                            {images.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto pb-1">
                                    {images.map((src, index) => (
                                        <button
                                            key={src + index}
                                            type="button"
                                            className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border ${
                                                index === activeImageIndex ? 'ring-2 ring-primary' : 'opacity-75 hover:opacity-100'
                                            }`}
                                            onClick={() => setActiveImageIndex(index)}
                                        >
                                            <img src={src} alt={`${product.name} ${index + 1}`} className="h-full w-full object-cover" loading="lazy" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Правая колонка: Информация */}
                        <div className="flex flex-col space-y-4 min-w-0 min-h-0">
                            {/* Заголовок и кнопка закрытия */}
                            <div className="flex items-start justify-between gap-4 flex-shrink-0">
                                <h2 className="text-2xl font-semibold flex-1">{product.name}</h2>
                                <button
                                    onClick={onClose}
                                    className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 text-xl"
                                    aria-label="Закрыть"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Цена и остатки */}
                            <div className="space-y-2 border-t pt-4 flex-shrink-0">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold">
                                        {product.is_custom_order === true || product.category_id === 'bcb746f9-6815-4ff6-92b6-9d1c5cefad9b' ? ' от' : ''}{' '}
                                        {Number(product.price).toLocaleString('ru-RU')} BYN
                                    </span>
                                </div>
                                {!product.is_custom_order && product.stock_quantity !== null && product.stock_quantity !== undefined && (
                                    <div className="text-sm text-muted-foreground">
                                        Остаток:{' '}
                                        <span
                                            className={`font-medium ${
                                                product.stock_quantity === 0 ? 'text-red-600' : product.stock_quantity < 10 ? 'text-orange-600' : 'text-emerald-600'
                                            }`}
                                        >
                                            {product.stock_quantity} шт.
                                        </span>
                                    </div>
                                )}
                                {product.is_custom_order && <div className="text-sm text-muted-foreground">Товар изготавливается под заказ</div>}
                            </div>

                            {/* Вкладки с описанием и характеристиками */}
                            {tabsContent.length > 0 && (
                                <div className="border-t pt-4 flex-1 flex flex-col min-h-0 overflow-hidden">
                                    <TabsWithScroll tabs={tabsContent} defaultTab="description" />
                                </div>
                            )}

                            {/* Кнопки действий */}
                            <div className="flex flex-col gap-2 pt-2 border-t flex-shrink-0">
                                <Button onClick={handleAddToCart} className="w-full" disabled={(!product.is_custom_order && product.stock_quantity === 0) || justAdded}>
                                    {justAdded ? 'Добавлено' : product.is_custom_order ? 'Заказать' : product.stock_quantity === 0 ? 'Нет в наличии' : 'В корзину'}
                                </Button>
                                <Button variant="outline" onClick={handleViewDetails} className="w-full">
                                    Подробнее на странице товара
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
