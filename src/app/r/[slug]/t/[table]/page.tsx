'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { store, INITIAL_RESTAURANTS, INITIAL_CATEGORIES, INITIAL_MENU_ITEMS } from '@/lib/store';
import { Restaurant, MenuCategory, MenuItem, CartItem, PaymentMethod, RestaurantPaymentSettings, Order } from '@/types';
import { 
  Search, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Flame, 
  Bell, 
  Check, 
  X, 
  CreditCard, 
  Banknote, 
  Sparkles,
  ChevronRight,
  Info,
  QrCode,
  ShieldCheck,
  HeartHandshake,
  AlertCircle,
  Smartphone,
  ChefHat
} from 'lucide-react';
import confetti from 'canvas-confetti';

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as unknown as { Razorpay: unknown }).Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function CustomerMenuContent() {
  const params = useParams();
  const router = useRouter();
  const slug = (params.slug as string) || 'spice-garden';
  const tableNumber = (params.table as string) || '1';

  const [mounted, setMounted] = useState(false);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(() => {
    return INITIAL_RESTAURANTS.find((r) => r.slug === slug) || INITIAL_RESTAURANTS[0];
  });
  const [categories, setCategories] = useState<MenuCategory[]>(() => {
    const r = INITIAL_RESTAURANTS.find((r) => r.slug === slug) || INITIAL_RESTAURANTS[0];
    return INITIAL_CATEGORIES.filter((c) => c.restaurantId === r.id);
  });
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const r = INITIAL_RESTAURANTS.find((r) => r.slug === slug) || INITIAL_RESTAURANTS[0];
    return INITIAL_MENU_ITEMS.filter((i) => i.restaurantId === r.id);
  });

  const [paymentSettings, setPaymentSettings] = useState<RestaurantPaymentSettings>({
    restaurantId: 'rest-1',
    upiQrEnabled: true,
    upiAppEnabled: true,
    cardEnabled: true,
    counterPaymentEnabled: true,
    updatedAt: '2026-01-01T00:00:00.000Z',
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);

  // Cart & checkout state
  const [cart, setCart] = useState<{ [itemId: string]: CartItem }>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [tipAmount, setTipAmount] = useState<number>(20);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi_app');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Static UPI QR Modal state
  const [showUpiQrModal, setShowUpiQrModal] = useState(false);
  const [createdOrderDetails, setCreatedOrderDetails] = useState<{ id: string; orderCode: string; total: number } | null>(null);

  // Fallback Razorpay demo simulation modal
  const [showRazorpayFallbackModal, setShowRazorpayFallbackModal] = useState(false);
  const [pendingRazorpayOrder, setPendingRazorpayOrder] = useState<{
    orderId: string;
    razorpayOrderId: string;
    amount: number;
  } | null>(null);

  // Waiter Assistance Modal
  const [isAssistanceOpen, setIsAssistanceOpen] = useState(false);
  const [assistanceSent, setAssistanceSent] = useState(false);

  useEffect(() => {
    setMounted(true);
    const r = store.getRestaurantBySlug(slug) || store.getRestaurants()[0];
    if (r) {
      setRestaurant(r);
      setCategories(store.getCategories(r.id));
      setMenuItems(store.getMenuItems(r.id));
      setPaymentSettings(store.getPaymentSettings(r.id));
    }
  }, [slug]);

  const [customerSessionId, setCustomerSessionId] = useState<string>('');
  const [existingOrders, setExistingOrders] = useState<Order[]>([]);

  // Initialize or read unique device session token for this dining table
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const key = `qrdine_sess_${slug}_tbl${tableNumber}`;
    let sess = localStorage.getItem(key);
    if (!sess) {
      sess = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(key, sess);
    }
    setCustomerSessionId(sess);
  }, [slug, tableNumber]);

  useEffect(() => {
    if (!mounted || !restaurant || !customerSessionId) return;
    const syncExisting = () => {
      const orders = store.getOrders(restaurant.id);
      // Strictly isolate orders to THIS phone's customerSessionId
      // A new customer scanning the table on another phone has a different session ID and sees ZERO past orders!
      const matches = orders.filter(
        (o) =>
          o.tableNumber === tableNumber &&
          (o.customerSessionId ? o.customerSessionId === customerSessionId : false) &&
          o.status !== 'cancelled' &&
          o.status !== 'served'
      );
      setExistingOrders(matches);
    };

    syncExisting();

    const unsub = store.subscribe(() => {
      setMenuItems(store.getMenuItems(restaurant.id));
      setPaymentSettings(store.getPaymentSettings(restaurant.id));
      syncExisting();
    });
    return unsub;
  }, [mounted, restaurant, tableNumber, customerSessionId]);

  // Adjust default selected payment method if current is disabled
  useEffect(() => {
    if (paymentMethod === 'upi_app' && !paymentSettings.upiAppEnabled) {
      if (paymentSettings.cardEnabled) setPaymentMethod('card');
      else if (paymentSettings.upiQrEnabled) setPaymentMethod('upi_qr');
      else if (paymentSettings.counterPaymentEnabled) setPaymentMethod('counter');
    }
  }, [paymentSettings, paymentMethod]);

  const hasAnyPaymentMethod = useMemo(() => {
    return (
      paymentSettings.upiQrEnabled ||
      paymentSettings.upiAppEnabled ||
      paymentSettings.cardEnabled ||
      paymentSettings.counterPaymentEnabled
    );
  }, [paymentSettings]);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) return false;
      if (vegOnly && !item.isVeg) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [menuItems, selectedCategory, vegOnly, searchQuery]);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev[item.id];
      const newQty = existing ? existing.quantity + 1 : 1;
      return {
        ...prev,
        [item.id]: {
          menuItem: item,
          quantity: newQty,
          notes: existing?.notes || '',
        },
      };
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return {
        ...prev,
        [itemId]: {
          ...existing,
          quantity: existing.quantity - 1,
        },
      };
    });
  };

  const totalCartCount = useMemo(() => {
    return Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const subtotal = useMemo(() => {
    return Object.values(cart).reduce(
      (sum, item) => sum + item.menuItem.price * item.quantity,
      0
    );
  }, [cart]);

  const gstAmount = useMemo(() => {
    const rate = restaurant?.gstRate || 0.05;
    return Math.round(subtotal * rate * 10) / 10;
  }, [subtotal, restaurant]);

  const grandTotal = subtotal + gstAmount + tipAmount;

  const handleRequestService = (requestType: string) => {
    if (!restaurant) return;
    store.callWaiter(restaurant.id, tableNumber, requestType);
    setAssistanceSent(true);
    setTimeout(() => {
      setAssistanceSent(false);
      setIsAssistanceOpen(false);
    }, 2000);
  };

  const handlePlaceOrder = async () => {
    if (!restaurant || totalCartCount === 0) return;
    setIsSubmitting(true);
    setPaymentError(null);

    const submittedItems = Object.values(cart).map((ci) => ({
      menuItemId: ci.menuItem.id,
      quantity: ci.quantity,
      notes: ci.notes,
      clientItem: {
        id: ci.menuItem.id,
        name: ci.menuItem.name,
        price: ci.menuItem.price,
        isVeg: ci.menuItem.isVeg,
        description: ci.menuItem.description,
        categoryId: ci.menuItem.categoryId,
        imageUrl: ci.menuItem.imageUrl,
      },
    }));

    try {
      // 1. Authoritative Backend Order Creation & Price Verification
      const response = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          tableNumber,
          paymentMethod,
          items: submittedItems,
          tip: tipAmount,
          customerName,
          customerPhone,
          specialInstructions,
          customerSessionId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize order on server');
      }

      const createdOrder = data.order;
      // Sync into local client store so KDS and Order Tracker immediately see it
      store.createOrder(createdOrder);

      // 2. Handle Selected Payment Flow
      if (paymentMethod === 'counter') {
        // Pay at counter
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        setCart({});
        setIsCartOpen(false);
        setIsSubmitting(false);
        router.push(`/r/${slug}/order/${createdOrder.id}`);
        return;
      }

      if (paymentMethod === 'upi_qr') {
        // Static / Stand UPI QR
        setCreatedOrderDetails({
          id: createdOrder.id,
          orderCode: createdOrder.orderCode,
          total: createdOrder.total,
        });
        setIsSubmitting(false);
        setIsCartOpen(false);
        setShowUpiQrModal(true);
        return;
      }

      if (paymentMethod === 'upi_app' || paymentMethod === 'card' || paymentMethod === 'online_upi' || paymentMethod === 'online_card') {
        const razorpayReady = await loadRazorpayScript();

        if (razorpayReady && (window as unknown as { Razorpay: unknown }).Razorpay && data.razorpay) {
          const razorpayOptions = {
            key: data.razorpay.keyId,
            amount: data.razorpay.amountInPaise,
            currency: data.razorpay.currency,
            name: restaurant.name,
            description: `Table ${tableNumber} Order ${createdOrder.orderCode}`,
            image: restaurant.logoUrl,
            order_id: data.razorpay.orderId,
            prefill: {
              name: customerName,
              contact: customerPhone,
            },
            theme: {
              color: '#d97706',
            },
            handler: async function (rzpResponse: {
              razorpay_payment_id: string;
              razorpay_order_id: string;
              razorpay_signature: string;
            }) {
              try {
                // Verify signature on backend
                const verifyRes = await fetch('/api/checkout/verify-payment', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    orderId: createdOrder.id,
                    razorpayOrderId: rzpResponse.razorpay_order_id,
                    razorpayPaymentId: rzpResponse.razorpay_payment_id,
                    razorpaySignature: rzpResponse.razorpay_signature,
                  }),
                });

                const verifyData = await verifyRes.json();
                if (!verifyRes.ok || !verifyData.success) {
                  throw new Error(verifyData.error || 'Server signature verification failed');
                }

                store.updatePaymentStatus(restaurant.id, createdOrder.id, 'paid');
                store.updateOrderStatus(restaurant.id, createdOrder.id, 'accepted');

                confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
                setCart({});
                setIsCartOpen(false);
                router.push(`/r/${slug}/order/${createdOrder.id}`);
              } catch (verifyErr) {
                setPaymentError((verifyErr as Error).message);
              }
            },
            modal: {
              ondismiss: function () {
                setPaymentError('Payment window closed. Your order is reserved; you can retry payment.');
                setIsSubmitting(false);
              },
            },
          };

          const razorpayInstance = new (window as unknown as { Razorpay: new (opts: unknown) => { open: () => void } }).Razorpay(razorpayOptions);
          razorpayInstance.open();
          setIsSubmitting(false);
        } else {
          // Razorpay script blocked or offline test environment fallback
          setPendingRazorpayOrder({
            orderId: createdOrder.id,
            razorpayOrderId: data.razorpay?.orderId || `order_mock_${Date.now()}`,
            amount: createdOrder.total,
          });
          setIsSubmitting(false);
          setIsCartOpen(false);
          setShowRazorpayFallbackModal(true);
        }
      }
    } catch (err: unknown) {
      setPaymentError((err as Error).message || 'Failed to place order');
      setIsSubmitting(false);
    }
  };

  const handleSimulateRazorpaySuccess = async () => {
    if (!pendingRazorpayOrder || !restaurant) return;
    setIsSubmitting(true);

    try {
      const mockPaymentId = `pay_mock_${Date.now()}`;
      const verifyRes = await fetch('/api/checkout/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: pendingRazorpayOrder.orderId,
          razorpayOrderId: pendingRazorpayOrder.razorpayOrderId,
          razorpayPaymentId: mockPaymentId,
          razorpaySignature: `mock_sig_${Date.now()}`,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || 'Verification failed');
      }

      store.updatePaymentStatus(restaurant.id, pendingRazorpayOrder.orderId, 'paid');
      store.updateOrderStatus(restaurant.id, pendingRazorpayOrder.orderId, 'accepted');

      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      setCart({});
      setShowRazorpayFallbackModal(false);
      router.push(`/r/${slug}/order/${pendingRazorpayOrder.orderId}`);
    } catch (err) {
      setPaymentError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-600">
        <p className="animate-pulse">Loading menu...</p>
      </div>
    );
  }

  // Generate UPI QR string for static QR mode
  const staticUpiPayString = `upi://pay?pa=${paymentSettings.upiId || 'spicegarden@okhdfcbank'}&pn=${encodeURIComponent(
    paymentSettings.payeeName || restaurant.name
  )}&am=${createdOrderDetails?.total || grandTotal}&cu=INR&tn=${encodeURIComponent(
    `Table ${tableNumber} Order ${createdOrderDetails?.orderCode || ''}`
  )}`;

  const staticQrImage =
    paymentSettings.upiQrImagePath ||
    `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(
      staticUpiPayString
    )}`;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 pb-28">
      {/* Top Banner / Restaurant Info */}
      <div className="relative bg-gradient-to-r from-amber-700 to-orange-800 text-white shadow-md">
        <div className="max-w-xl mx-auto px-4 pt-4 pb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2 bg-black/25 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Table {tableNumber}</span>
            </div>

            <button
              onClick={() => setIsAssistanceOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all bg-white/15 hover:bg-white/25 text-white border border-white/20 active:scale-95"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Call Waiter</span>
            </button>
          </div>

          <h1 className="text-xl font-bold tracking-tight">{restaurant.name}</h1>
          <p className="text-xs text-amber-100/90 mt-0.5">{restaurant.tagline}</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-4">
        {/* Search & Veg Filter */}
        <div className="flex items-center space-x-2 mb-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
            <input
              type="text"
              placeholder="Search dishes, drinks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <button
            onClick={() => setVegOnly(!vegOnly)}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
              vegOnly
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full border border-emerald-500 flex items-center justify-center p-0.5">
              <span className="w-full h-full bg-emerald-500 rounded-full" />
            </span>
            <span>Veg Only</span>
          </button>
        </div>

        {/* Active In-Flight Order Indicator (Diners can track or add more items) */}
        {existingOrders.length > 0 && (
          <div className="mb-3 p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center justify-between text-xs shadow-xs">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-xl bg-amber-600 text-white">
                <ChefHat className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <p className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <span>Table {tableNumber} has {existingOrders.length} active order{existingOrders.length > 1 ? 's' : ''} in kitchen</span>
                </p>
                <p className="text-[11px] text-stone-500">
                  Latest: {existingOrders[0].orderCode} ({existingOrders[0].status === 'preparing' ? 'Cooking on Line' : existingOrders[0].status === 'ready' ? 'Ready to Serve' : 'Sent to Chef'})
                </p>
              </div>
            </div>
            <Link
              href={`/r/${slug}/order/${existingOrders[0].id}`}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] shadow-xs active:scale-95 transition-all shrink-0"
            >
              Track Live
            </Link>
          </div>
        )}

        {/* Category Scroll Pill Bar */}
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-none text-xs font-medium">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-semibold shadow-sm'
                : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
            }`}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-semibold shadow-sm'
                  : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Menu Item Cards */}
        <div className="mt-4 space-y-3">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-stone-400">
              <Info className="w-8 h-8 mx-auto mb-2 opacity-60" />
              <p className="text-sm">No items found matching your filter.</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const inCartQty = cart[item.id]?.quantity || 0;
              return (
                <div
                  key={item.id}
                  className={`flex gap-3 p-3 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-xs transition-all ${
                    !item.isAvailable ? 'opacity-50 grayscale' : ''
                  }`}
                >
                  {/* Left: Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      {/* Dietary indicator */}
                      <div className="flex items-center space-x-1.5 mb-1">
                        <span
                          className={`w-3.5 h-3.5 border flex items-center justify-center p-0.5 rounded-xs ${
                            item.isVeg ? 'border-emerald-600' : 'border-rose-600'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                            }`}
                          />
                        </span>

                        {item.spicyLevel && item.spicyLevel > 1 && (
                          <span className="flex text-amber-500">
                            {Array.from({ length: item.spicyLevel }).map((_, i) => (
                              <Flame key={i} className="w-3 h-3 fill-amber-500" />
                            ))}
                          </span>
                        )}
                      </div>

                      <h3 className="font-semibold text-sm leading-tight text-stone-900 dark:text-stone-100">
                        {item.name}
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-2.5 font-bold text-sm text-stone-900 dark:text-stone-100">
                      ₹{item.price}
                    </div>
                  </div>

                  {/* Right: Image & Add button */}
                  <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />

                    {item.isAvailable ? (
                      <div className="absolute bottom-1 right-1 left-1">
                        {inCartQty === 0 ? (
                          <button
                            onClick={() => addToCart(item)}
                            className="w-full py-1 rounded-lg bg-white/95 dark:bg-stone-900/95 text-amber-700 dark:text-amber-400 font-bold text-xs shadow-md border border-amber-200 dark:border-amber-900 flex items-center justify-center space-x-1 active:scale-95 transition-transform"
                          >
                            <Plus className="w-3 h-3" />
                            <span>ADD</span>
                          </button>
                        ) : (
                          <div className="flex items-center justify-between bg-amber-600 text-white rounded-lg px-1.5 py-0.5 shadow-md text-xs font-bold">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="p-1 active:scale-90"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span>{inCartQty}</span>
                            <button
                              onClick={() => addToCart(item)}
                              className="p-1 active:scale-90"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] font-bold text-white uppercase tracking-wider">
                        Sold Out
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Floating Bottom Cart Bar */}
      {totalCartCount > 0 && !isCartOpen && (
        <div className="fixed bottom-3 inset-x-4 max-w-xl mx-auto z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-4 py-3.5 rounded-2xl shadow-xl flex items-center justify-between active:scale-[0.99] transition-all"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-medium text-amber-100">
                  {totalCartCount} {totalCartCount === 1 ? 'item' : 'items'}
                </p>
                <p className="font-bold text-base leading-tight">₹{grandTotal}</p>
              </div>
            </div>

            <div className="flex items-center space-x-1 font-semibold text-sm">
              <span>View Cart</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Full Cart Drawer / Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-t-3xl max-h-[90vh] flex flex-col max-w-xl mx-auto w-full shadow-2xl border-t border-stone-200 dark:border-stone-800">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-stone-800">
              <div>
                <h2 className="font-bold text-base text-stone-900 dark:text-stone-100">
                  Your Table {tableNumber} Order
                </h2>
                <p className="text-xs text-stone-500">Review dishes and choose payment method</p>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message Banner */}
            {paymentError && (
              <div className="mx-5 mt-3 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-xl flex items-center space-x-2 text-rose-700 dark:text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            {/* Scrollable item list & options */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div className="divide-y divide-stone-100 dark:divide-stone-800">
                {Object.values(cart).map((ci) => (
                  <div key={ci.menuItem.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`w-3 h-3 border flex items-center justify-center p-0.5 rounded-xs ${
                            ci.menuItem.isVeg ? 'border-emerald-600' : 'border-rose-600'
                          }`}
                        >
                          <span
                            className={`w-1 h-1 rounded-full ${
                              ci.menuItem.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                            }`}
                          />
                        </span>
                        <p className="font-semibold text-sm text-stone-900 dark:text-stone-100">
                          {ci.menuItem.name}
                        </p>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">
                        ₹{ci.menuItem.price} × {ci.quantity} = ₹{ci.menuItem.price * ci.quantity}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 bg-stone-100 dark:bg-stone-800 rounded-xl px-2 py-1">
                      <button
                        onClick={() => removeFromCart(ci.menuItem.id)}
                        className="text-stone-600 dark:text-stone-300 active:scale-90"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold px-1.5">{ci.quantity}</span>
                      <button
                        onClick={() => addToCart(ci.menuItem)}
                        className="text-stone-600 dark:text-stone-300 active:scale-90"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                  Cooking Instructions / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Less spicy, keep chutney on the side"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Staff Tip Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-stone-600 dark:text-stone-300 flex items-center space-x-1">
                    <HeartHandshake className="w-3.5 h-3.5 text-rose-500" />
                    <span>Tip the Kitchen &amp; Service Staff</span>
                  </label>
                  {tipAmount > 0 && <span className="text-xs font-bold text-amber-600">+₹{tipAmount}</span>}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 20, 50, 100].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setTipAmount(amount)}
                      className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        tipAmount === amount
                          ? 'bg-amber-600 border-amber-600 text-white'
                          : 'bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {amount === 0 ? 'No tip' : `₹${amount}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact info */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-stone-500 mb-1">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Vikram"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-stone-500 mb-1">
                    Phone (for Digital Bill)
                  </label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950"
                  />
                </div>
              </div>

              {/* Payment Method Selector (Only Available Methods Shown) */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-2">
                  Available Payment Options
                </label>

                {!hasAnyPaymentMethod ? (
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">No Payment Methods Available</p>
                      <p className="mt-0.5 text-[11px]">
                        The restaurant currently has no payment options enabled. Please notify your waiter or cashier.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Option 1: UPI App Payment */}
                    {paymentSettings.upiAppEnabled && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('upi_app')}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          paymentMethod === 'upi_app'
                            ? 'border-amber-600 bg-amber-50/60 dark:bg-amber-950/30 ring-1 ring-amber-600'
                            : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <Smartphone className="w-4 h-4 text-amber-600" />
                          <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                            UPI App Payment
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 leading-tight">
                          GPay, PhonePe, Paytm via Razorpay
                        </p>
                      </button>
                    )}

                    {/* Option 2: Debit / Credit Card */}
                    {paymentSettings.cardEnabled && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          paymentMethod === 'card'
                            ? 'border-amber-600 bg-amber-50/60 dark:bg-amber-950/30 ring-1 ring-amber-600'
                            : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <CreditCard className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                            Debit / Credit Card
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 leading-tight">
                          Visa, Mastercard, RuPay cards
                        </p>
                      </button>
                    )}

                    {/* Option 3: UPI QR Code */}
                    {paymentSettings.upiQrEnabled && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('upi_qr')}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          paymentMethod === 'upi_qr'
                            ? 'border-amber-600 bg-amber-50/60 dark:bg-amber-950/30 ring-1 ring-amber-600'
                            : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <QrCode className="w-4 h-4 text-amber-600" />
                          <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                            UPI QR Stand
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 leading-tight">
                          Scan merchant QR &amp; staff verifies
                        </p>
                      </button>
                    )}

                    {/* Option 4: Pay at Counter */}
                    {paymentSettings.counterPaymentEnabled && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('counter')}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          paymentMethod === 'counter'
                            ? 'border-amber-600 bg-amber-50/60 dark:bg-amber-950/30 ring-1 ring-amber-600'
                            : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <Banknote className="w-4 h-4 text-orange-600" />
                          <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                            Pay at Counter
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 leading-tight">
                          Cash or POS card swipe after meal
                        </p>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Bill Summary */}
              <div className="bg-stone-50 dark:bg-stone-950 p-3.5 rounded-2xl space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span>Item Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span>GST (5%)</span>
                  <span>₹{gstAmount}</span>
                </div>
                {tipAmount > 0 && (
                  <div className="flex justify-between text-stone-600 dark:text-stone-400">
                    <span>Staff Gratuity / Tip</span>
                    <span>₹{tipAmount}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex justify-between font-bold text-sm text-stone-900 dark:text-stone-100">
                  <span>Grand Total</span>
                  <span>₹{grandTotal}</span>
                </div>
              </div>
            </div>

            {/* Bottom Checkout Actions */}
            <div className="p-4 border-t border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900">
              <button
                disabled={isSubmitting || totalCartCount === 0 || !hasAnyPaymentMethod}
                onClick={handlePlaceOrder}
                className="w-full py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-sm shadow-lg flex items-center justify-center space-x-2 active:scale-[0.99] transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Verifying with Server...'
                    : !hasAnyPaymentMethod
                    ? 'No Payment Options Available'
                    : paymentMethod === 'upi_app' || paymentMethod === 'card'
                    ? `Pay ₹${grandTotal} via Razorpay`
                    : paymentMethod === 'upi_qr'
                    ? `View UPI QR & Pay ₹${grandTotal}`
                    : `Confirm Order (Pay at Counter ₹${grandTotal})`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Static UPI QR Modal */}
      {showUpiQrModal && createdOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border border-stone-200 dark:border-stone-800 relative">
            <button
              onClick={() => {
                setShowUpiQrModal(false);
                router.push(`/r/${slug}/order/${createdOrderDetails.id}`);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 mx-auto flex items-center justify-center mb-2">
              <QrCode className="w-6 h-6" />
            </div>

            <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
              Transfer ₹{createdOrderDetails.total} via UPI
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Order Ref: <strong className="text-amber-600 font-mono">{createdOrderDetails.orderCode}</strong>
            </p>

            <div className="my-4 p-3 bg-white rounded-2xl border border-stone-200 shadow-inner flex justify-center">
              <img
                src={staticQrImage}
                alt="Merchant UPI QR Code"
                className="w-48 h-48 rounded-xl object-contain"
              />
            </div>

            <div className="text-xs text-left bg-stone-50 dark:bg-stone-950 p-3 rounded-xl border border-stone-200 dark:border-stone-800 space-y-1 mb-4 text-stone-600 dark:text-stone-300">
              <p>
                <strong>VPA:</strong> {paymentSettings.upiId || 'spicegarden@okhdfcbank'}
              </p>
              <p>
                <strong>Payee:</strong> {paymentSettings.payeeName || restaurant.name}
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 pt-1 border-t border-stone-200 dark:border-stone-800">
                ℹ️ <em>If required, enter ₹{createdOrderDetails.total} manually. Your order is sent to the kitchen and will be marked paid upon staff confirmation.</em>
              </p>
            </div>

            <button
              onClick={() => {
                setShowUpiQrModal(false);
                setCart({});
                router.push(`/r/${slug}/order/${createdOrderDetails.id}`);
              }}
              className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              I Have Completed UPI Payment
            </button>
          </div>
        </div>
      )}

      {/* Razorpay Test Simulation Modal (Fallback for offline / blocked environment) */}
      {showRazorpayFallbackModal && pendingRazorpayOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border border-stone-200 dark:border-stone-800 relative">
            <button
              onClick={() => setShowRazorpayFallbackModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 mx-auto flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
              Razorpay Secure Checkout
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Order ID: <span className="font-mono text-stone-600 dark:text-stone-300">{pendingRazorpayOrder.razorpayOrderId}</span>
            </p>
            <p className="text-xl font-black text-amber-600 mt-2">
              ₹{pendingRazorpayOrder.amount}
            </p>

            <p className="text-xs text-stone-500 my-4">
              Testing mode active. Completing this will send cryptographic payment verification to the backend.
            </p>

            <button
              disabled={isSubmitting}
              onClick={handleSimulateRazorpaySuccess}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying with Server...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Simulate Successful Razorpay Payment</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Call Waiter Sheet */}
      {isAssistanceOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-t-3xl p-5 max-w-md w-full shadow-2xl border-t border-stone-200 dark:border-stone-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  Request Table Assistance
                </h3>
                <p className="text-xs text-stone-500">Service staff will be notified immediately</p>
              </div>
              <button
                onClick={() => setIsAssistanceOpen(false)}
                className="p-1 rounded-full text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {assistanceSent ? (
              <div className="py-6 text-center text-emerald-600 font-bold text-sm flex flex-col items-center">
                <Check className="w-8 h-8 mb-2" />
                <span>Staff has been notified for Table {tableNumber}!</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: '💧 Water Refill', val: 'Water' },
                  { label: '🍴 Extra Plates / Cutlery', val: 'Extra Cutlery' },
                  { label: '🧹 Clean Table', val: 'Clean Table' },
                  { label: '🧾 Request Bill', val: 'Bring Bill' },
                ].map((req) => (
                  <button
                    key={req.val}
                    onClick={() => handleRequestService(req.val)}
                    className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 font-medium text-xs text-stone-800 dark:text-stone-200 hover:border-amber-500 active:scale-95 transition-all text-left"
                  >
                    {req.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerMenuPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-stone-500">Loading menu...</div>}>
      <CustomerMenuContent />
    </Suspense>
  );
}
