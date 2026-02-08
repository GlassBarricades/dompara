'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Product {
    id: string
    name: string
    slug: string
    price: number
    stock_quantity: number | null
    is_custom_order: boolean
    main_image_url: string | null
    category_id: string
}

interface CartItem {
    product_id: string
    product_name: string
    price: number
    quantity: number
}

interface Order {
    id: string
    customer_name: string
    phone: string
    email?: string | null
    telegram?: string | null
    comment?: string | null
    items: any
    status: string
    created_at: string
    total: number
}

export default function CashierPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [statusFilter, setStatusFilter] = useState<string>('')

    // Поиск товаров
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [productQuantity, setProductQuantity] = useState('1')
    const [showNewOrderForm, setShowNewOrderForm] = useState(false)

    // Корзина для новой заявки
    const [cart, setCart] = useState<CartItem[]>([])
    const [customerName, setCustomerName] = useState('')
    const [customerPhone, setCustomerPhone] = useState('')
    const [customerEmail, setCustomerEmail] = useState('')
    const [customerComment, setCustomerComment] = useState('')

    // Модальные окна
    const [addProductDialogOpen, setAddProductDialogOpen] = useState(false)
    const [orderDetailsDialogOpen, setOrderDetailsDialogOpen] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

    const canUseSupabase = !!supabase

    useEffect(() => {
        if (!canUseSupabase) return
        void loadProducts()
        void loadRecentOrders()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canUseSupabase])

    async function loadProducts() {
        try {
            const { data, error } = await supabase!
                .from('products')
                .select('id, name, slug, price, stock_quantity, is_custom_order, main_image_url')
                .eq('is_active', true)
                .order('name', { ascending: true })

            if (error) throw error
            setProducts((data ?? []) as Product[])
        } catch (err) {
            console.error('Failed to load products', err)
        }
    }

    async function loadRecentOrders() {
        setLoading(true)
        try {
            const { data, error } = await supabase!
                .from('orders')
                .select('id, customer_name, phone, email, telegram, comment, items, status, created_at')
                .order('created_at', { ascending: false })
                .limit(10)

            if (error) throw error

            const ordersWithTotal = (data ?? []).map((order: any) => {
                const items = Array.isArray(order.items) ? order.items : []
                const total = items.reduce((sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 0), 0)
                return { ...order, total }
            }) as Order[]

            setOrders(ordersWithTotal)
        } catch (err) {
            console.error('Failed to load orders', err)
        } finally {
            setLoading(false)
        }
    }

    const filteredProducts = useMemo(() => {
        const query = searchQuery.toLowerCase().trim()
        if (!query) return products.slice(0, 100)
        return products.filter((p) => p.name.toLowerCase().includes(query)).slice(0, 100)
    }, [products, searchQuery])

    function handleAddToCart() {
        if (!selectedProduct || !productQuantity) return

        const quantity = Number(productQuantity)
        if (Number.isNaN(quantity) || quantity <= 0) {
            setError('Укажите корректное количество')
            return
        }

        const existingItem = cart.find((item) => item.product_id === selectedProduct.id)
        if (existingItem) {
            setCart(cart.map((item) => (item.product_id === selectedProduct.id ? { ...item, quantity: item.quantity + quantity } : item)))
        } else {
            setCart([
                ...cart,
                {
                    product_id: selectedProduct.id,
                    product_name: selectedProduct.name,
                    price: selectedProduct.price,
                    quantity,
                },
            ])
        }

        setSelectedProduct(null)
        setProductQuantity('1')
        setAddProductDialogOpen(false)
        setSearchQuery('')
        setError(null)
    }

    function handleRemoveFromCart(productId: string) {
        setCart(cart.filter((item) => item.product_id !== productId))
    }

    function handleUpdateQuantity(productId: string, quantity: number) {
        if (quantity <= 0) {
            handleRemoveFromCart(productId)
            return
        }
        setCart(cart.map((item) => (item.product_id === productId ? { ...item, quantity } : item)))
    }

    async function handleCreateOrder() {
        if (!canUseSupabase) return

        if (!customerName.trim() || !customerPhone.trim()) {
            setError('Заполните имя и телефон клиента')
            return
        }

        if (cart.length === 0) {
            setError('Добавьте товары в заявку')
            return
        }

        setSaving(true)
        setError(null)
        setSuccess(null)

        try {
            const items = cart.map((item) => ({
                id: item.product_id,
                name: item.product_name,
                price: item.price,
                quantity: item.quantity,
            }))

            const { data, error } = await supabase!
                .from('orders')
                .insert({
                    customer_name: customerName.trim(),
                    phone: customerPhone.trim(),
                    email: customerEmail.trim() || null,
                    telegram: null,
                    comment: customerComment.trim() || null,
                    items,
                    status: 'new',
                })
                .select('id')
                .single()

            if (error) throw error

            // Логируем создание заявки
            await supabase!.from('order_logs').insert({
                order_id: data.id,
                field_name: null,
                old_value: null,
                new_value: JSON.stringify({
                    customer_name: customerName.trim(),
                    phone: customerPhone.trim(),
                    items,
                }),
                comment: 'Создана новая заявка через кассу',
            })

            setSuccess('Заявка успешно создана!')

            // Очищаем форму
            setCart([])
            setCustomerName('')
            setCustomerPhone('')
            setCustomerEmail('')
            setCustomerComment('')
            setShowNewOrderForm(false)

            // Обновляем список заявок
            await loadRecentOrders()
        } catch (err) {
            console.error(err)
            setError('Не удалось создать заявку')
        } finally {
            setSaving(false)
        }
    }

    async function handleQuickStatusChange(orderId: string, newStatus: string) {
        if (!canUseSupabase) return

        const order = orders.find((o) => o.id === orderId)
        if (!order) return

        // Если переводим в "проведена", списываем остатки
        if (newStatus === 'completed' && order.status !== 'completed') {
            if (!window.confirm('Провести заявку? Это списает товары со склада.')) {
                return
            }

            try {
                for (const item of Array.isArray(order.items) ? order.items : []) {
                    let product = null

                    const { data: productById } = await supabase!.from('products').select('id, stock_quantity, is_custom_order').eq('id', item.id).maybeSingle()

                    if (productById) {
                        product = productById
                    } else {
                        const { data: productBySlug } = await supabase!.from('products').select('id, stock_quantity, is_custom_order').eq('slug', item.id).maybeSingle()

                        if (productBySlug) {
                            product = productBySlug
                        }
                    }

                    if (!product || product.is_custom_order) continue

                    const oldStock = product.stock_quantity ?? 0
                    const quantity = Number(item.quantity) || 0
                    if (quantity <= 0) continue

                    const newStock = Math.max(0, oldStock - quantity)

                    await supabase!.from('products').update({ stock_quantity: newStock }).eq('id', product.id)

                    await supabase!.from('stock_movements').insert({
                        product_id: product.id,
                        old_quantity: oldStock,
                        new_quantity: newStock,
                        movement_type: 'outcome',
                        comment: `Списание по заявке #${orderId.substring(0, 8)}`,
                    })
                }
            } catch (err) {
                console.error('Failed to process stock deduction:', err)
                setError('Не удалось списать остатки')
                return
            }
        }

        try {
            const { error } = await supabase!.from('orders').update({ status: newStatus }).eq('id', orderId)

            if (error) throw error

            await logOrderChange(orderId, 'status', order.status, newStatus)
            await loadRecentOrders()
        } catch (err) {
            console.error(err)
            setError('Не удалось изменить статус')
        }
    }

    async function logOrderChange(orderId: string, fieldName: string | null, oldValue: any, newValue: any, comment?: string) {
        if (!canUseSupabase) return
        try {
            await supabase!.from('order_logs').insert({
                order_id: orderId,
                field_name: fieldName,
                old_value: oldValue ? JSON.stringify(oldValue) : null,
                new_value: newValue ? JSON.stringify(newValue) : null,
                comment: comment || null,
            })
        } catch (err) {
            console.error('Failed to log order change:', err)
        }
    }

    function formatDate(dateString: string) {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date)
    }

    function getTelegramLink(telegram: string | null | undefined): string | null {
        if (!telegram) return null
        const cleaned = telegram.trim().replace(/^@/, '')
        if (!cleaned) return null
        return `https://t.me/${cleaned}`
    }

    const cartTotal = useMemo(() => {
        return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    }, [cart])

    const filteredOrders = useMemo(() => {
        if (!statusFilter) return orders
        return orders.filter((order) => order.status === statusFilter)
    }, [orders, statusFilter])

    return (
        <section className="space-y-6">
            <header className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold">Рабочее место менеджера</h1>
                    <p className="text-sm text-muted-foreground">Быстрое создание заявок и управление текущими заявками.</p>
                </div>
                <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/admin/products/stock">Остатки</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/admin/products/invoices">Накладные</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/admin/orders">Все заявки</Link>
                    </Button>
                </div>
            </header>

            {!canUseSupabase && (
                <p className="text-sm text-red-600">
                    Supabase не сконфигурирован. Установи переменные окружения NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY.
                </p>
            )}

            {error && (
                <div className="rounded-md border-2 border-red-600 bg-red-100 p-4 text-sm font-medium text-red-900 dark:border-red-500 dark:bg-red-950 dark:text-red-100">
                    <strong className="font-semibold">✕</strong> {error}
                </div>
            )}

            {success && (
                <div className="rounded-md border-2 border-emerald-600 bg-emerald-100 p-4 text-sm font-medium text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950 dark:text-emerald-100">
                    <strong className="font-semibold">✓</strong> {success}
                </div>
            )}

            {/* Быстрые действия */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex gap-2">
                    <Button onClick={() => setShowNewOrderForm(true)} className="bg-emerald-600 hover:bg-emerald-700">
                        + Новая заявка
                    </Button>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/admin/products/stock">Остатки</Link>
                    </Button>
                </div>
            </div>

            {/* Форма создания новой заявки */}
            {showNewOrderForm && (
                <div className="rounded-md border bg-background p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Новая заявка</h2>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setShowNewOrderForm(false)
                                setCart([])
                                setCustomerName('')
                                setCustomerPhone('')
                                setCustomerEmail('')
                                setCustomerComment('')
                                setSearchQuery('')
                            }}
                        >
                            ✕
                        </Button>
                    </div>

                    {/* Поиск и выбор товаров */}
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="flex-1 rounded-md border px-3 py-2 text-sm"
                                placeholder="Поиск товара по названию..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <Button
                                onClick={() => {
                                    setSearchQuery('')
                                    setSelectedProduct(null)
                                    setAddProductDialogOpen(true)
                                }}
                            >
                                Выбрать товар
                            </Button>
                        </div>

                        {/* Список товаров для выбора */}
                        {filteredProducts.length > 0 && (
                            <div className="max-h-64 overflow-y-auto rounded-md border bg-background">
                                {filteredProducts.map((product) => (
                                    <button
                                        key={product.id}
                                        type="button"
                                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted border-b last:border-0 flex items-center justify-between"
                                        onClick={() => {
                                            setSelectedProduct(product)
                                            setProductQuantity('1')
                                            setAddProductDialogOpen(true)
                                        }}
                                    >
                                        <div className="flex-1">
                                            <div className="font-medium">{product.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {product.price} BYN
                                                {product.stock_quantity !== null && product.stock_quantity !== undefined && <> • Остаток: {product.stock_quantity}</>}
                                                {product.is_custom_order && <> • Под заказ</>}
                                            </div>
                                        </div>
                                        <Button size="sm" variant="outline" className="ml-2">
                                            Добавить
                                        </Button>
                                    </button>
                                ))}
                            </div>
                        )}
                        {!searchQuery.trim() && filteredProducts.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                Начните вводить название товара для поиска или нажмите "Выбрать товар" для просмотра списка
                            </p>
                        )}
                    </div>

                    {/* Корзина */}
                    {cart.length > 0 && (
                        <div className="mb-4 rounded-md border">
                            <div className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">Товары в заявке</div>
                            <div className="divide-y">
                                {cart.map((item) => (
                                    <div key={item.product_id} className="flex items-center justify-between px-3 py-2">
                                        <div className="flex-1">
                                            <div className="text-sm font-medium">{item.product_name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {item.price} BYN × {item.quantity} = {item.price * item.quantity} BYN
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button size="icon-sm" variant="outline" onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}>
                                                −
                                            </Button>
                                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                                            <Button size="icon-sm" variant="outline" onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}>
                                                +
                                            </Button>
                                            <Button size="icon-sm" variant="ghost" onClick={() => handleRemoveFromCart(item.product_id)} className="text-red-600">
                                                ✕
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t px-3 py-2 text-right">
                                <div className="text-sm font-semibold">Итого: {cartTotal} BYN</div>
                            </div>
                        </div>
                    )}

                    {/* Данные клиента */}
                    <div className="space-y-3">
                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">
                                    Имя <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="w-full rounded-md border px-3 py-2 text-sm"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="Имя клиента"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">
                                    Телефон <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    className="w-full rounded-md border px-3 py-2 text-sm"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    placeholder="+375..."
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Email</label>
                            <input
                                type="email"
                                className="w-full rounded-md border px-3 py-2 text-sm"
                                value={customerEmail}
                                onChange={(e) => setCustomerEmail(e.target.value)}
                                placeholder="email@example.com"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Комментарий</label>
                            <textarea
                                className="w-full rounded-md border px-3 py-2 text-sm min-h-[60px]"
                                value={customerComment}
                                onChange={(e) => setCustomerComment(e.target.value)}
                                placeholder="Дополнительная информация..."
                            />
                        </div>
                    </div>

                    <Button onClick={handleCreateOrder} disabled={saving || cart.length === 0 || !customerName.trim() || !customerPhone.trim()} className="w-full mt-4">
                        {saving ? 'Создание...' : 'Создать заявку'}
                    </Button>
                </div>
            )}

            {/* Список заявок на всю ширину */}
            <div className="rounded-md border bg-background overflow-x-auto">
                <div className="border-b px-4 py-3 flex items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold">Текущие заявки</h2>
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-muted-foreground">Статус:</label>
                        <select className="rounded-md border bg-background px-3 py-1.5 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="">Все</option>
                            <option value="new">Новая</option>
                            <option value="in_progress">В работе</option>
                            <option value="completed">Проведена</option>
                            <option value="rejected">Отклонена</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">Загрузка...</div>
                ) : filteredOrders.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                        {orders.length === 0 ? 'Заявок пока нет' : 'Заявки с выбранным статусом не найдены'}
                    </div>
                ) : (
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 font-medium"></th>
                                <th className="px-4 py-3 font-medium">№</th>
                                <th className="px-4 py-3 font-medium">Клиент</th>
                                <th className="px-4 py-3 font-medium">Контакты</th>
                                <th className="px-4 py-3 font-medium">Товары</th>
                                <th className="px-4 py-3 font-medium text-right">Сумма</th>
                                <th className="px-4 py-3 font-medium">Статус</th>
                                <th className="px-4 py-3 font-medium">Комментарий</th>
                                <th className="px-4 py-3 font-medium">Создана</th>
                                <th className="px-4 py-3 font-medium text-right">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3">
                                        <Button
                                            size="icon-sm"
                                            variant="outline"
                                            title="Детали"
                                            onClick={() => {
                                                setSelectedOrder(order)
                                                setOrderDetailsDialogOpen(true)
                                            }}
                                        >
                                            👁
                                        </Button>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-sm font-mono text-muted-foreground">#{order.id.substring(0, 8)}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{order.customer_name}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="space-y-1 text-sm">
                                            <div>{order.phone}</div>
                                            {order.email && <div className="text-xs text-muted-foreground">📧 {order.email}</div>}
                                            {order.telegram && getTelegramLink(order.telegram) && (
                                                <div className="text-xs">
                                                    <a
                                                        href={getTelegramLink(order.telegram)!}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-700 hover:underline"
                                                    >
                                                        💬 {order.telegram}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-sm">{Array.isArray(order.items) ? order.items.length : 0} товар(ов)</div>
                                        {Array.isArray(order.items) && order.items.length > 0 && (
                                            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                {order.items
                                                    .slice(0, 2)
                                                    .map((item: any) => item.name)
                                                    .join(', ')}
                                                {order.items.length > 2 && '...'}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="font-medium">{order.total} BYN</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                                order.status === 'new'
                                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-100'
                                                    : order.status === 'in_progress'
                                                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-100'
                                                      : order.status === 'completed'
                                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100'
                                                        : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-100'
                                            }`}
                                        >
                                            {order.status === 'new'
                                                ? 'Новая'
                                                : order.status === 'in_progress'
                                                  ? 'В работе'
                                                  : order.status === 'completed'
                                                    ? 'Проведена'
                                                    : 'Отклонена'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-xs text-muted-foreground max-w-xs line-clamp-3">{order.comment || '—'}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-xs text-muted-foreground">{formatDate(order.created_at)}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            {order.status !== 'completed' && (
                                                <Button
                                                    size="icon-sm"
                                                    variant="outline"
                                                    title="Провести"
                                                    className="text-emerald-600 hover:text-emerald-700"
                                                    onClick={() => handleQuickStatusChange(order.id, 'completed')}
                                                >
                                                    ✓
                                                </Button>
                                            )}
                                            {order.status !== 'rejected' && (
                                                <Button
                                                    size="icon-sm"
                                                    variant="outline"
                                                    title="Отклонить"
                                                    className="text-red-600 hover:text-red-700"
                                                    onClick={() => handleQuickStatusChange(order.id, 'rejected')}
                                                >
                                                    ✕
                                                </Button>
                                            )}
                                            <Button size="icon-sm" variant="outline" title="Редактировать" asChild>
                                                <Link href={`/admin/orders/${order.id}`}>✎</Link>
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Диалог добавления товара */}
            <Dialog open={addProductDialogOpen} onOpenChange={setAddProductDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Добавить товар</DialogTitle>
                        <DialogDescription>{selectedProduct ? `Добавить "${selectedProduct.name}" в заявку` : 'Выберите товар из списка'}</DialogDescription>
                    </DialogHeader>
                    {selectedProduct && (
                        <div className="space-y-4">
                            <div>
                                <div className="font-medium">{selectedProduct.name}</div>
                                <div className="text-sm text-muted-foreground">
                                    Цена:{selectedProduct.is_custom_order === true || selectedProduct.category_id === 'bcb746f9-6815-4ff6-92b6-9d1c5cefad9b' ? ' от' : ''}{' '}
                                    {selectedProduct.price} BYN
                                    {selectedProduct.stock_quantity !== null && selectedProduct.stock_quantity !== undefined && (
                                        <> • Остаток: {selectedProduct.stock_quantity}</>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Количество</label>
                                <input
                                    type="number"
                                    step="1"
                                    min="1"
                                    className="w-full rounded-md border px-3 py-2 text-sm"
                                    value={productQuantity}
                                    onChange={(e) => setProductQuantity(e.target.value)}
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            handleAddToCart()
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    )}
                    {!selectedProduct && (
                        <div className="space-y-2">
                            <input
                                type="text"
                                className="w-full rounded-md border px-3 py-2 text-sm"
                                placeholder="Поиск товара..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                            <div className="max-h-64 overflow-y-auto space-y-1">
                                {filteredProducts.length > 0 ? (
                                    filteredProducts.map((product) => (
                                        <button
                                            key={product.id}
                                            type="button"
                                            className="w-full px-3 py-2 text-left text-sm hover:bg-muted rounded-md border"
                                            onClick={() => {
                                                setSelectedProduct(product)
                                                setProductQuantity('1')
                                            }}
                                        >
                                            <div className="font-medium">{product.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {product.price} BYN
                                                {product.stock_quantity !== null && product.stock_quantity !== undefined && <> • Остаток: {product.stock_quantity}</>}
                                                {product.is_custom_order && <> • Под заказ</>}
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        {searchQuery.trim() ? 'Товары не найдены' : 'Начните вводить название товара для поиска'}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setAddProductDialogOpen(false)
                                setSelectedProduct(null)
                                setProductQuantity('1')
                            }}
                        >
                            Отмена
                        </Button>
                        {selectedProduct && <Button onClick={handleAddToCart}>Добавить</Button>}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Диалог деталей заявки */}
            <Dialog open={orderDetailsDialogOpen} onOpenChange={setOrderDetailsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Детали заявки</DialogTitle>
                        <DialogDescription>
                            {selectedOrder?.customer_name} • {selectedOrder?.phone}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedOrder && (
                        <div className="space-y-4">
                            <div>
                                <div className="text-sm font-medium mb-2">Товары:</div>
                                <div className="rounded-md border divide-y">
                                    {Array.isArray(selectedOrder.items) &&
                                        selectedOrder.items.map((item: any, index: number) => (
                                            <div key={index} className="px-3 py-2 flex justify-between text-sm">
                                                <div>
                                                    {item.name} × {item.quantity}
                                                </div>
                                                <div className="font-medium">{item.price * item.quantity} BYN</div>
                                            </div>
                                        ))}
                                </div>
                                <div className="mt-2 text-right text-sm font-semibold">Итого: {selectedOrder.total} BYN</div>
                            </div>
                            <div className="text-xs text-muted-foreground">Создано: {formatDate(selectedOrder.created_at)}</div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setOrderDetailsDialogOpen(false)
                                setSelectedOrder(null)
                            }}
                        >
                            Закрыть
                        </Button>
                        {selectedOrder && (
                            <Button asChild>
                                <Link href={`/admin/orders/${selectedOrder.id}`}>Редактировать</Link>
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    )
}
