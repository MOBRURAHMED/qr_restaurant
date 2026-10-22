'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo } from 'react';
import { store } from '@/lib/store';
import { Restaurant, MenuItem, Order, MenuCategory, RestaurantPaymentSettings } from '@/types';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  QrCode, 
  ShoppingBag, 
  TrendingUp, 
  Printer, 
  ExternalLink,
  Edit2,
  Check,
  CreditCard,
  Banknote,
  Plus,
  Trash2,
  X,
  Globe,
  Store,
  ShieldCheck,
  Upload,
  Sliders,
  AlertCircle,
  ChefHat,
  Clock,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

export default function RestaurantAdminPage() {
  const [mounted, setMounted] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestId, setSelectedRestId] = useState<string>('rest-1');

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'kpi' | 'menu' | 'tables' | 'orders' | 'payments'>('kpi');

  // Payment Settings State (4 Toggles & UPI QR config)
  const [paymentSettings, setPaymentSettings] = useState<RestaurantPaymentSettings>({
    restaurantId: 'rest-1',
    upiQrEnabled: true,
    upiAppEnabled: true,
    cardEnabled: true,
    counterPaymentEnabled: true,
    updatedAt: '2026-01-01T00:00:00.000Z',
  });
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);

  // Custom Base URL configuration for phone cameras
  const [customBaseUrl, setCustomBaseUrl] = useState<string>('');

  // Table Generator State
  const [tableCount] = useState<number>(8);
  const [selectedTableForQr, setSelectedTableForQr] = useState<number>(4);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editPriceVal, setEditPriceVal] = useState<number>(0);

  // Add Item Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemPrice, setNewItemPrice] = useState<number>(250);
  const [newItemCategory, setNewItemCategory] = useState<string>('cat-1');
  const [newItemIsVeg, setNewItemIsVeg] = useState(true);

  useEffect(() => {
    setMounted(true);
    setRestaurants(store.getRestaurants());
    setMenuItems(store.getMenuItems(selectedRestId));
    setCategories(store.getCategories(selectedRestId));
    setOrders(store.getOrders(selectedRestId));
    setPaymentSettings(store.getPaymentSettings(selectedRestId));
    setCustomBaseUrl(store.getBaseUrl() || (typeof window !== 'undefined' ? window.location.origin : ''));
  }, [selectedRestId]);

  useEffect(() => {
    if (!mounted) return;
    const unsub = store.subscribe(() => {
      setMenuItems(store.getMenuItems(selectedRestId));
      setOrders(store.getOrders(selectedRestId));
      setCategories(store.getCategories(selectedRestId));
      setPaymentSettings(store.getPaymentSettings(selectedRestId));
    });

    return unsub;
  }, [mounted, selectedRestId]);

  const currentRestaurant = restaurants.find((r) => r.id === selectedRestId) || restaurants[0] || {
    id: selectedRestId,
    name: 'Spice Garden Bistro',
    slug: 'spice-garden',
    tagline: 'Authentic Coastal & North Indian Flavours',
    phone: '+91 98765 43210',
    currency: '₹',
    logoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=160&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    address: 'Indiranagar 100ft Rd, Bengaluru',
    upiId: 'spicegarden@okhdfcbank',
    gstRate: 0.05,
  };

  const totalRevenue = useMemo(() => {
    return orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.total, 0);
  }, [orders]);

  const onlineRevenue = useMemo(() => {
    return orders
      .filter((o) => (o.paymentMethod === 'online_upi' || o.paymentMethod === 'upi_app' || o.paymentMethod === 'card' || o.paymentMethod === 'online_card') && o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.total, 0);
  }, [orders]);

  const counterRevenue = useMemo(() => {
    return orders
      .filter((o) => o.paymentMethod === 'counter')
      .reduce((sum, o) => sum + o.total, 0);
  }, [orders]);

  const activeOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status !== 'served' && o.status !== 'cancelled').length;
  }, [orders]);

  const handleToggleStock = (itemId: string) => {
    store.toggleItemAvailability(selectedRestId, itemId);
  };

  const handleSavePrice = (itemId: string) => {
    if (editPriceVal > 0) {
      store.updateItemPrice(selectedRestId, itemId, editPriceVal);
    }
    setEditingPriceId(null);
  };

  const handleDeleteItem = (itemId: string) => {
    store.deleteMenuItem(selectedRestId, itemId);
  };

  const handleVerifyPayment = (orderId: string) => {
    store.verifyManualPayment(selectedRestId, orderId, 'user-owner-1');
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || newItemPrice <= 0) return;

    store.addMenuItem(selectedRestId, {
      name: newItemName.trim(),
      description: newItemDesc.trim(),
      price: newItemPrice,
      categoryId: newItemCategory,
      isVeg: newItemIsVeg,
      isAvailable: true,
      imageUrl: newItemIsVeg
        ? 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&auto=format&fit=crop&q=80',
      spicyLevel: 1,
    });

    setNewItemName('');
    setNewItemDesc('');
    setNewItemPrice(250);
    setIsAddModalOpen(false);
  };

  const handleBaseUrlChange = (val: string) => {
    setCustomBaseUrl(val);
    store.setBaseUrl(val);
  };

  // Payment Toggle Handler (Updates Supabase / Store)
  const handleTogglePaymentMethod = (key: keyof RestaurantPaymentSettings) => {
    const currentValue = Boolean(paymentSettings[key]);
    const updated = store.updatePaymentSettings(selectedRestId, {
      [key]: !currentValue,
    });
    setPaymentSettings(updated);
    showSavedToast();
  };

  const handleUpdatePaymentField = (field: keyof RestaurantPaymentSettings, value: string) => {
    const updated = store.updatePaymentSettings(selectedRestId, {
      [field]: value,
    });
    setPaymentSettings(updated);
    showSavedToast();
  };

  const handleQrImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64 = uploadEvent.target?.result as string;
        handleUpdatePaymentField('upiQrImagePath', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveQrImage = () => {
    const updated = store.updatePaymentSettings(selectedRestId, {
      upiQrImagePath: undefined,
    });
    setPaymentSettings(updated);
    showSavedToast();
  };

  const showSavedToast = () => {
    setSettingsSavedToast(true);
    setTimeout(() => setSettingsSavedToast(false), 2500);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex items-center justify-center font-sans">
        <div className="text-center p-8">
          <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-600 dark:text-stone-400 font-medium text-sm">Loading Merchant Portal...</p>
        </div>
      </div>
    );
  }

  const targetHost = customBaseUrl.trim() || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  const qrTargetUrl = `${targetHost}/r/${currentRestaurant.slug}/t/${selectedTableForQr}`;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=15&data=${encodeURIComponent(
    qrTargetUrl
  )}`;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2.5 mb-6">
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black">
              QD
            </div>
            <div>
              <h2 className="font-bold text-sm leading-tight text-stone-900 dark:text-stone-100">
                {currentRestaurant.name}
              </h2>
              <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                Merchant Portal
              </span>
            </div>
          </div>

          {/* Restaurant switcher dropdown */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-stone-500 mb-1 flex items-center space-x-1">
              <Store className="w-3 h-3" />
              <span>Active Restaurant</span>
            </label>
            <select
              value={selectedRestId}
              onChange={(e) => {
                const restId = e.target.value;
                setSelectedRestId(restId);
                setMenuItems(store.getMenuItems(restId));
                setOrders(store.getOrders(restId));
                setCategories(store.getCategories(restId));
                setPaymentSettings(store.getPaymentSettings(restId));
              }}
              className="w-full text-xs p-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 font-medium text-stone-800 dark:text-stone-200 focus:outline-none"
            >
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <nav className="space-y-1.5 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('kpi')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition-all ${
                activeTab === 'kpi'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview &amp; Sales</span>
            </button>

            <button
              onClick={() => setActiveTab('menu')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition-all ${
                activeTab === 'menu'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Menu Management</span>
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition-all ${
                activeTab === 'payments'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Payment Settings</span>
            </button>

            <button
              onClick={() => setActiveTab('tables')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition-all ${
                activeTab === 'tables'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Table QR Generator</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition-all ${
                activeTab === 'orders'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Order Ledger</span>
            </button>
          </nav>
        </div>

        <div className="pt-4 border-t border-stone-200 dark:border-stone-800 text-xs">
          <Link
            href="/staff/kds"
            target="_blank"
            className="flex items-center justify-between p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-amber-500 hover:text-white transition-all font-semibold"
          >
            <span>Open Kitchen Screen (KDS)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-5 md:p-8 overflow-y-auto">
        {/* Toast Notification */}
        {settingsSavedToast && (
          <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-bold flex items-center space-x-2 animate-fade-in">
            <Check className="w-4 h-4" />
            <span>Settings saved &amp; applied to live customer checkout!</span>
          </div>
        )}

        {/* 1. KPI Dashboard Tab */}
        {activeTab === 'kpi' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                {currentRestaurant.name} — Live Metrics
              </h1>
              <p className="text-xs text-stone-500">Real-time revenue, tables, and order splits</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                <div className="flex items-center justify-between text-stone-400 mb-2">
                  <span className="text-xs font-semibold">Total Revenue</span>
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-2xl font-black text-stone-900 dark:text-stone-100">
                  ₹{totalRevenue.toLocaleString()}
                </p>
                <p className="text-[11px] text-stone-500 mt-1">Across all tables today</p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                <div className="flex items-center justify-between text-stone-400 mb-2">
                  <span className="text-xs font-semibold">Active Orders</span>
                  <ShoppingBag className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-2xl font-black text-amber-600">{activeOrdersCount}</p>
                <p className="text-[11px] text-stone-500 mt-1">Currently in prep or pending</p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                <div className="flex items-center justify-between text-stone-400 mb-2">
                  <span className="text-xs font-semibold">Digital UPI &amp; Cards</span>
                  <CreditCard className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-2xl font-black text-emerald-600">
                  ₹{onlineRevenue.toLocaleString()}
                </p>
                <p className="text-[11px] text-stone-500 mt-1">Razorpay verified settlements</p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                <div className="flex items-center justify-between text-stone-400 mb-2">
                  <span className="text-xs font-semibold">Counter / Cash Due</span>
                  <Banknote className="w-4 h-4 text-orange-500" />
                </div>
                <p className="text-2xl font-black text-stone-900 dark:text-stone-100">
                  ₹{counterRevenue.toLocaleString()}
                </p>
                <p className="text-[11px] text-stone-500 mt-1">To collect at counter</p>
              </div>
            </div>

            {/* Cash Counter Collection Banner */}
            {counterRevenue > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-amber-600 text-white shadow-xs">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                      <span>Uncollected Counter Cash: ₹{counterRevenue.toLocaleString()}</span>
                      <span className="text-[10px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full font-extrabold">
                        Action Required
                      </span>
                    </h3>
                    <p className="text-xs text-stone-600 dark:text-stone-400">
                      Guests chose &quot;Pay at Counter&quot;. Cooks prepare food, while you collect cash or swipe card at the register.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-xs active:scale-95 transition-all"
                >
                  View Unsettled Tables
                </button>
              </div>
            )}

            {/* Live Order Feed */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5">
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 mb-3">
                Live Order Feed
              </h2>
              <div className="divide-y divide-stone-100 dark:divide-stone-800 text-xs">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-stone-900 dark:text-stone-100">
                          Table {order.tableNumber}
                        </span>
                        {order.roundNumber && order.roundNumber > 1 ? (
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-1.5 py-0.5 rounded">
                            Round {order.roundNumber}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                            New Guest
                          </span>
                        )}
                        <span className="text-stone-400 font-mono text-[11px]">{order.orderCode}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center space-x-1 ${
                          order.status === 'preparing'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : order.status === 'ready'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : order.status === 'served'
                            ? 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          <span>{order.status === 'preparing' ? '🍳 Cooking' : order.status === 'ready' ? '🔔 Ready' : order.status === 'served' ? '🍽️ Served' : '⏳ New'}</span>
                        </span>
                      </div>
                      <p className="text-stone-500 mt-0.5">
                        {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-sm text-stone-900 dark:text-stone-100">
                        ₹{order.total}
                      </p>
                      {order.paymentStatus === 'paid' ? (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-end space-x-1">
                          <Check className="w-3 h-3" />
                          <span>PAID</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleVerifyPayment(order.id)}
                          className="mt-1 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] shadow-xs active:scale-95 transition-all flex items-center space-x-1"
                        >
                          <Banknote className="w-3 h-3" />
                          <span>{order.paymentMethod === 'counter' ? 'Collect Cash' : 'Verify UPI'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. Menu Management Tab */}
        {activeTab === 'menu' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                  Menu &amp; Stock Management
                </h1>
                <p className="text-xs text-stone-500">
                  Add new dishes, toggle items out-of-stock (86), or update prices
                </p>
              </div>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 font-bold text-xs text-white shadow-sm flex items-center space-x-1.5 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Dish</span>
              </button>
            </div>

            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
              <div className="divide-y divide-stone-100 dark:divide-stone-800">
                {menuItems.map((item) => (
                  <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-3.5">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                            {item.name}
                          </h3>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                              item.isVeg
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                            }`}
                          >
                            {item.isVeg ? 'Veg' : 'Non-Veg'}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 line-clamp-1">{item.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {/* Price editor */}
                      <div className="text-right">
                        {editingPriceId === item.id ? (
                          <div className="flex items-center space-x-1">
                            <input
                              type="number"
                              value={editPriceVal}
                              onChange={(e) => setEditPriceVal(Number(e.target.value))}
                              className="w-20 px-2 py-1 text-xs border rounded-lg bg-stone-50 dark:bg-stone-950 font-bold"
                            />
                            <button
                              onClick={() => handleSavePrice(item.id)}
                              className="p-1 bg-emerald-600 text-white rounded-lg text-xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                              ₹{item.price}
                            </span>
                            <button
                              onClick={() => {
                                setEditingPriceId(item.id);
                                setEditPriceVal(item.price);
                              }}
                              className="text-stone-400 hover:text-stone-600"
                              title="Edit price"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Out of stock toggle */}
                      <button
                        onClick={() => handleToggleStock(item.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          item.isAvailable
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
                        }`}
                      >
                        {item.isAvailable ? 'In Stock' : 'Sold Out (86)'}
                      </button>

                      {/* Delete dish button */}
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
                        title="Delete dish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. PAYMENT SETTINGS TAB (4 Independent Toggles & UPI Configuration) */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>Restaurant Payment Settings</span>
                <span className="text-xs bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                  Supabase RLS Synced
                </span>
              </h1>
              <p className="text-xs text-stone-500">
                Configure which payment methods are accepted at customer checkout for {currentRestaurant.name}
              </p>
            </div>

            {/* Section A: 4 Independent Toggles */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 space-y-4">
              <div className="flex items-center space-x-2 text-sm font-bold text-stone-900 dark:text-stone-100">
                <Sliders className="w-4 h-4 text-amber-600" />
                <span>Customer Checkout Payment Toggles</span>
              </div>
              <p className="text-xs text-stone-500">
                Enable or disable each method independently. Disabled options are hidden immediately from customer phones and rejected on the backend.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                {/* 1. UPI QR Code Toggle */}
                <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/40 flex items-center justify-between">
                  <div className="space-y-1 pr-3">
                    <div className="flex items-center space-x-2">
                      <QrCode className="w-4 h-4 text-amber-600" />
                      <span className="font-bold text-xs text-stone-900 dark:text-stone-100">
                        1. UPI QR Code
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 leading-tight">
                      Display your restaurant&apos;s static UPI QR code on the customer screen to scan and pay.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePaymentMethod('upiQrEnabled')}
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      paymentSettings.upiQrEnabled ? 'bg-emerald-600 justify-end' : 'bg-stone-300 dark:bg-stone-700 justify-start'
                    }`}
                  >
                    <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                  </button>
                </div>

                {/* 2. UPI App Payment Toggle */}
                <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/40 flex items-center justify-between">
                  <div className="space-y-1 pr-3">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4 text-amber-600" />
                      <span className="font-bold text-xs text-stone-900 dark:text-stone-100">
                        2. UPI App Payment
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 leading-tight">
                      Direct GPay, PhonePe, Paytm intent checkout via Razorpay with automated payment confirmation.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePaymentMethod('upiAppEnabled')}
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      paymentSettings.upiAppEnabled ? 'bg-emerald-600 justify-end' : 'bg-stone-300 dark:bg-stone-700 justify-start'
                    }`}
                  >
                    <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                  </button>
                </div>

                {/* 3. Debit / Credit Card Toggle */}
                <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/40 flex items-center justify-between">
                  <div className="space-y-1 pr-3">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-xs text-stone-900 dark:text-stone-100">
                        3. Debit / Credit Card
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 leading-tight">
                      Accept Visa, Mastercard, and RuPay cards through PCI-DSS compliant Razorpay Checkout.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePaymentMethod('cardEnabled')}
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      paymentSettings.cardEnabled ? 'bg-emerald-600 justify-end' : 'bg-stone-300 dark:bg-stone-700 justify-start'
                    }`}
                  >
                    <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                  </button>
                </div>

                {/* 4. Pay at Counter Toggle */}
                <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/40 flex items-center justify-between">
                  <div className="space-y-1 pr-3">
                    <div className="flex items-center space-x-2">
                      <Banknote className="w-4 h-4 text-orange-600" />
                      <span className="font-bold text-xs text-stone-900 dark:text-stone-100">
                        4. Pay at Counter
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 leading-tight">
                      Customers place orders immediately and settle in cash or physical POS swipe with your cashier.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePaymentMethod('counterPaymentEnabled')}
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      paymentSettings.counterPaymentEnabled ? 'bg-emerald-600 justify-end' : 'bg-stone-300 dark:bg-stone-700 justify-start'
                    }`}
                  >
                    <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                  </button>
                </div>
              </div>

              {!paymentSettings.upiQrEnabled &&
                !paymentSettings.upiAppEnabled &&
                !paymentSettings.cardEnabled &&
                !paymentSettings.counterPaymentEnabled && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 rounded-xl flex items-center space-x-2 text-rose-700 dark:text-rose-300 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>
                      <strong>Warning:</strong> All payment methods are currently disabled. Customer checkout will be blocked with an explanatory notice until at least one option is turned on.
                    </span>
                  </div>
                )}
            </div>

            {/* Section B: Static UPI QR Code Configuration */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 space-y-4">
              <div className="flex items-center space-x-2 text-sm font-bold text-stone-900 dark:text-stone-100">
                <QrCode className="w-4 h-4 text-amber-600" />
                <span>UPI QR Code &amp; Payee Configuration</span>
              </div>
              <p className="text-xs text-stone-500">
                Upload your merchant UPI QR stand photo or specify your UPI VPA address. Displayed at customer checkout when UPI QR is enabled.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start pt-2">
                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">
                      Merchant UPI ID (VPA)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. spicegarden@okhdfcbank"
                      value={paymentSettings.upiId || ''}
                      onChange={(e) => handleUpdatePaymentField('upiId', e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">
                      Payee Display Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Spice Garden Bistro"
                      value={paymentSettings.payeeName || ''}
                      onChange={(e) => handleUpdatePaymentField('payeeName', e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">
                      Upload Custom Stand QR Code Image
                    </label>
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 font-semibold cursor-pointer border border-stone-300 dark:border-stone-700">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Choose QR Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleQrImageUpload}
                          className="hidden"
                        />
                      </label>

                      {paymentSettings.upiQrImagePath && (
                        <button
                          type="button"
                          onClick={handleRemoveQrImage}
                          className="px-3 py-2 rounded-xl text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 font-semibold"
                        >
                          Remove Image
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* QR Preview Card */}
                <div className="bg-stone-50 dark:bg-stone-950 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
                    Customer Static QR Preview
                  </span>

                  <div className="w-44 h-44 mx-auto bg-white p-2 rounded-xl shadow-md border flex items-center justify-center">
                    {paymentSettings.upiQrImagePath ? (
                      <img
                        src={paymentSettings.upiQrImagePath}
                        alt="Uploaded UPI QR"
                        className="w-full h-full object-contain rounded-lg"
                      />
                    ) : (
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                          `upi://pay?pa=${paymentSettings.upiId || 'merchant@okhdfcbank'}&pn=${encodeURIComponent(
                            paymentSettings.payeeName || currentRestaurant.name
                          )}&cu=INR`
                        )}`}
                        alt="Generated UPI QR"
                        className="w-full h-full object-contain rounded-lg"
                      />
                    )}
                  </div>

                  <p className="font-bold text-xs mt-2 text-stone-900 dark:text-stone-100">
                    {paymentSettings.payeeName || currentRestaurant.name}
                  </p>
                  <p className="text-[11px] font-mono text-stone-500">
                    {paymentSettings.upiId || 'merchant@okhdfcbank'}
                  </p>
                  <p className="text-[10px] text-amber-600 mt-1">
                    ⚠️ Static QR requires staff confirmation before order is marked paid.
                  </p>
                </div>
              </div>
            </div>

            {/* Section C: Razorpay Multi-Merchant Gateway Architecture */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 space-y-3">
              <div className="flex items-center space-x-2 text-sm font-bold text-stone-900 dark:text-stone-100">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Razorpay Gateway Architecture (Multi-Tenant Onboarding)</span>
              </div>
              <p className="text-xs text-stone-500 leading-relaxed">
                Online payments (Cards &amp; UPI App Intent) are processed via Razorpay APIs. Each restaurant can be associated with its own approved Razorpay Merchant Account or routed through platform settlement.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2">
                <div>
                  <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Merchant Key ID (Optional Restaurant Override)
                  </label>
                  <input
                    type="text"
                    placeholder="rzp_live_... or rzp_test_..."
                    value={paymentSettings.razorpayKeyId || ''}
                    onChange={(e) => handleUpdatePaymentField('razorpayKeyId', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 font-mono"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">Leave blank to use platform gateway account.</p>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Connected Account ID (Razorpay Route / Marketplace)
                  </label>
                  <input
                    type="text"
                    placeholder="acc_..."
                    value={paymentSettings.razorpayConnectedAccountId || ''}
                    onChange={(e) => handleUpdatePaymentField('razorpayConnectedAccountId', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 font-mono"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">Direct payout transfer to restaurant bank account.</p>
                </div>
              </div>

              <div className="p-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-[11px] text-stone-500 mt-2">
                🔒 <strong>Security Enforced:</strong> Key Secrets and webhook secrets are stored exclusively in server environment variables or encrypted secrets vaults. Key Secrets are never exposed to browser memory or client bundles.
              </div>
            </div>
          </div>
        )}

        {/* 4. Table QR Generator Tab */}
        {activeTab === 'tables' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                Table QR Code Generator &amp; Stands
              </h1>
              <p className="text-xs text-stone-500">
                Configure your server IP/domain and generate high-resolution QR tent cards
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Controls */}
              <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 space-y-4">
                {/* Domain / IP setting */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1 flex items-center space-x-1.5">
                    <Globe className="w-3.5 h-3.5 text-amber-600" />
                    <span>Public Server Domain or Wi-Fi IP (for phone scanning)</span>
                  </label>
                  <input
                    type="text"
                    value={customBaseUrl}
                    onChange={(e) => handleBaseUrlChange(e.target.value)}
                    placeholder="e.g. http://192.168.1.15:3000 or https://mycafe.com"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 font-mono text-stone-800 dark:text-stone-200"
                  />
                  <p className="text-[11px] text-stone-400 mt-1">
                    Phone cameras scanning the QR will open this address.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                      Select Table to Preview
                    </label>
                    <span className="text-xs text-stone-400">Total {tableCount} tables</span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {Array.from({ length: tableCount }).map((_, idx) => {
                      const tNum = idx + 1;
                      return (
                        <button
                          key={tNum}
                          onClick={() => setSelectedTableForQr(tNum)}
                          className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                            selectedTableForQr === tNum
                              ? 'bg-amber-600 border-amber-600 text-white shadow-sm'
                              : 'bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
                          }`}
                        >
                          Table {tNum}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-200 dark:border-stone-800">
                  <p className="text-xs text-stone-500 mb-1">Customer Target URL:</p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={qrTargetUrl}
                      className="flex-1 text-xs p-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 font-mono text-stone-600 select-all"
                    />
                    <Link
                      href={`/r/${currentRestaurant.slug}/t/${selectedTableForQr}`}
                      target="_blank"
                      className="px-3 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold flex items-center space-x-1"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                <button
                  onClick={() => window.print()}
                  className="w-full py-3 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold text-xs flex items-center justify-center space-x-2 shadow-sm active:scale-95 transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Table {selectedTableForQr} Stand Card</span>
                </button>
              </div>

              {/* Printable Table Card Preview (Mock Acrylic Stand) */}
              <div className="bg-stone-100 dark:bg-stone-800/50 p-6 rounded-3xl flex justify-center">
                <div className="w-64 bg-white text-stone-900 rounded-3xl p-6 shadow-2xl border border-stone-200 text-center flex flex-col items-center">
                  <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white font-bold flex items-center justify-center mb-2">
                    QD
                  </div>
                  <h3 className="font-extrabold text-base tracking-tight">{currentRestaurant.name}</h3>
                  <div className="mt-1 px-3 py-0.5 rounded-full bg-amber-100 text-amber-800 font-black text-xs uppercase tracking-wider">
                    Table {selectedTableForQr}
                  </div>

                  <div className="my-5 p-2 bg-white rounded-2xl border-2 border-stone-900/10 shadow-inner">
                    <img
                      src={qrCodeImageUrl}
                      alt={`Table ${selectedTableForQr} QR Code`}
                      className="w-44 h-44 rounded-xl"
                    />
                  </div>

                  <p className="font-bold text-xs text-stone-900">
                    SCAN TO BROWSE &amp; PAY
                  </p>
                  <p className="text-[10px] text-stone-500 mt-0.5">
                    No App Needed • Open Phone Camera
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. Orders Ledger Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-5">
            <div>
              <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                Orders &amp; Payment Ledger
              </h1>
              <p className="text-xs text-stone-500">Comprehensive log of table activity for {currentRestaurant.name}</p>
            </div>

            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 dark:bg-stone-950 text-stone-500 font-semibold border-b border-stone-200 dark:border-stone-800">
                  <tr>
                    <th className="p-3.5">Code</th>
                    <th className="p-3.5">Table</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Dishes</th>
                    <th className="p-3.5">Method</th>
                    <th className="p-3.5">Payment</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Total</th>
                    <th className="p-3.5 text-right">Cashier Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/50">
                      <td className="p-3.5 font-mono font-semibold">{order.orderCode}</td>
                      <td className="p-3.5 font-bold">
                        <div>Table {order.tableNumber}</div>
                        <div className="text-[10px] text-stone-400 font-normal">
                          {order.roundNumber && order.roundNumber > 1 ? `Round ${order.roundNumber}` : 'New Guest'}
                        </div>
                      </td>
                      <td className="p-3.5 text-stone-500">{order.customerName || 'Walk-in'}</td>
                      <td className="p-3.5 text-stone-600 dark:text-stone-300 max-w-xs truncate">
                        {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                      </td>
                      <td className="p-3.5 capitalize">
                        {order.paymentMethod === 'upi_app' || order.paymentMethod === 'online_upi'
                          ? 'UPI App'
                          : order.paymentMethod === 'card' || order.paymentMethod === 'online_card'
                          ? 'Debit/Credit Card'
                          : order.paymentMethod === 'upi_qr'
                          ? 'UPI QR Stand'
                          : 'Counter / Cash'}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            order.paymentStatus === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                          }`}
                        >
                          {order.paymentStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {order.status === 'preparing' ? (
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            <ChefHat className="w-3 h-3 text-blue-500 animate-pulse" />
                            <span>Cooking in Kitchen</span>
                          </span>
                        ) : order.status === 'ready' ? (
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>Ready to Serve</span>
                          </span>
                        ) : order.status === 'served' ? (
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                            <UtensilsCrossed className="w-3 h-3" />
                            <span>Served at Table</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Clock className="w-3 h-3 text-amber-500" />
                            <span>New in Queue</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right font-bold text-stone-900 dark:text-stone-100">
                        ₹{order.total}
                      </td>
                      <td className="p-3.5 text-right">
                        {order.paymentStatus === 'paid' ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            <Check className="w-3 h-3" />
                            <span>Settled</span>
                          </span>
                        ) : order.paymentMethod === 'counter' ? (
                          <button
                            onClick={() => handleVerifyPayment(order.id)}
                            className="px-2.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] shadow-xs active:scale-95 transition-all inline-flex items-center space-x-1"
                            title="Collect cash at register & settle table"
                          >
                            <Banknote className="w-3 h-3" />
                            <span>Collect Cash</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleVerifyPayment(order.id)}
                            className="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] shadow-xs active:scale-95 transition-all inline-flex items-center space-x-1"
                            title="Confirm merchant UPI payment received"
                          >
                            <Check className="w-3 h-3" />
                            <span>Verify UPI</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Add Dish Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-200 dark:border-stone-800 relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-stone-400"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 mb-1">
              Add New Dish to Menu
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Item will immediately become visible to dining customers
            </p>

            <form onSubmit={handleCreateItem} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">
                  Dish Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Saffron Malai Kofta"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cottage cheese dumplings in aromatic cashew saffron gravy"
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min={10}
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Category
                  </label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">
                  Dietary Classification
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewItemIsVeg(true)}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      newItemIsVeg
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    Vegetarian
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewItemIsVeg(false)}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      !newItemIsVeg
                        ? 'bg-rose-600 border-rose-600 text-white'
                        : 'bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    Non-Vegetarian
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-md active:scale-95 transition-all"
                >
                  Publish Dish to Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
