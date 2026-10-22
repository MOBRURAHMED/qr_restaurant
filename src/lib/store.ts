'use client';

import { Restaurant, MenuCategory, MenuItem, Order, OrderStatus, PaymentStatus, WaiterCall, RestaurantPaymentSettings, DiningTable } from '@/types';

export const INITIAL_RESTAURANTS: Restaurant[] = [
  {
    id: 'rest-1',
    slug: 'spice-garden',
    name: 'Spice Garden Bistro',
    tagline: 'Authentic Coastal & North Indian Flavours',
    phone: '+91 98765 43210',
    currency: '₹',
    logoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=160&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    address: 'Indiranagar 100ft Rd, Bengaluru',
    upiId: 'spicegarden@okhdfcbank',
    gstRate: 0.05,
  },
  {
    id: 'rest-2',
    slug: 'urban-chai-co',
    name: 'Urban Chai & Co',
    tagline: 'Specialty Teas, Street Bites & Artisanal Sourdough',
    phone: '+91 98765 12345',
    currency: '₹',
    logoUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=160&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
    address: 'Koramangala 4th Block, Bengaluru',
    upiId: 'urbanchai@icici',
    gstRate: 0.05,
  }
];

export const INITIAL_CATEGORIES: MenuCategory[] = [
  { id: 'cat-1', restaurantId: 'rest-1', name: 'Starters & Crisps', sortOrder: 1 },
  { id: 'cat-2', restaurantId: 'rest-1', name: 'Clay Oven Tandoor', sortOrder: 2 },
  { id: 'cat-3', restaurantId: 'rest-1', name: 'Curries & Dal', sortOrder: 3 },
  { id: 'cat-4', restaurantId: 'rest-1', name: 'Biryani & Rice', sortOrder: 4 },
  { id: 'cat-5', restaurantId: 'rest-1', name: 'Beverages & Coolers', sortOrder: 5 },
  { id: 'cat-6', restaurantId: 'rest-1', name: 'Desserts', sortOrder: 6 },
];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    id: 'item-1',
    restaurantId: 'rest-1',
    categoryId: 'cat-1',
    name: 'Crispy Corn & Water Chestnut',
    description: 'Golden spiced sweet corn tossed with scallions and crushed black pepper',
    price: 240,
    isVeg: true,
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80',
    spicyLevel: 1,
  },
  {
    id: 'item-2',
    restaurantId: 'rest-1',
    categoryId: 'cat-1',
    name: 'Gunpowder Chicken Bites',
    description: 'Tender chicken morsels tempered with curry leaves and Andhra podi spice',
    price: 320,
    isVeg: false,
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&auto=format&fit=crop&q=80',
    spicyLevel: 3,
  },
  {
    id: 'item-3',
    restaurantId: 'rest-1',
    categoryId: 'cat-2',
    name: 'Paneer Malai Tikka',
    description: 'Char-grilled cottage cheese marinated in cardamom, cashew paste & rich cream',
    price: 360,
    isVeg: true,
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=400&auto=format&fit=crop&q=80',
    spicyLevel: 1,
  },
  {
    id: 'item-4',
    restaurantId: 'rest-1',
    categoryId: 'cat-2',
    name: 'Bhatti Da Murgh',
    description: 'Traditional slow-roasted chicken thighs rubbed with freshly ground whole spices',
    price: 420,
    isVeg: false,
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=400&auto=format&fit=crop&q=80',
    spicyLevel: 2,
  },
  {
    id: 'item-5',
    restaurantId: 'rest-1',
    categoryId: 'cat-3',
    name: 'Dal Makhani Slow-Simmered',
    description: 'Black lentils slow-cooked overnight with churned butter and vine-ripened tomatoes',
    price: 290,
    isVeg: true,
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&auto=format&fit=crop&q=80',
    spicyLevel: 1,
  },
  {
    id: 'item-6',
    restaurantId: 'rest-1',
    categoryId: 'cat-3',
    name: 'Butter Chicken Old Delhi Style',
    description: 'Smoked tandoori chicken simmered in velvet satin tomato gravy with fenugreek',
    price: 440,
    isVeg: false,
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&auto=format&fit=crop&q=80',
    spicyLevel: 2,
  },
  {
    id: 'item-7',
    restaurantId: 'rest-1',
    categoryId: 'cat-4',
    name: 'Hyderabadi Dum Mutton Biryani',
    description: 'Long grain basmati layered with tender goat meat, saffron, and caramelized onions',
    price: 490,
    isVeg: false,
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&auto=format&fit=crop&q=80',
    spicyLevel: 3,
  },
  {
    id: 'item-8',
    restaurantId: 'rest-1',
    categoryId: 'cat-5',
    name: 'Alphonso Mango Lassi',
    description: 'Thick chilled yogurt blended with sweet Ratnagiri mango pulp and crushed pistachios',
    price: 160,
    isVeg: true,
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1570701564993-e00652af8aa7?w=400&auto=format&fit=crop&q=80',
    spicyLevel: 1,
  },
  {
    id: 'item-9',
    restaurantId: 'rest-1',
    categoryId: 'cat-6',
    name: 'Warm Gulab Jamun with Rabdi',
    description: 'Soft melt-in-mouth milk dumplings served with saffron-scented reduced milk',
    price: 180,
    isVeg: true,
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&auto=format&fit=crop&q=80',
    spicyLevel: 1,
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-101',
    restaurantId: 'rest-1',
    tableNumber: '4',
    orderCode: '#SG-101',
    customerName: 'Rahul Verma',
    customerPhone: '9876500001',
    specialInstructions: 'Please make the chicken extra crispy.',
    items: [
      { id: 'oi-1', menuItemId: 'item-2', name: 'Gunpowder Chicken Bites', price: 320, quantity: 1, notes: 'Extra podi powder' },
      { id: 'oi-2', menuItemId: 'item-8', name: 'Alphonso Mango Lassi', price: 160, quantity: 2 }
    ],
    subtotal: 640,
    tax: 32,
    tip: 20,
    total: 692,
    status: 'preparing',
    paymentStatus: 'paid',
    paymentMethod: 'online_upi',
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'ord-102',
    restaurantId: 'rest-1',
    tableNumber: '7',
    orderCode: '#SG-102',
    customerName: 'Priya Sharma',
    customerPhone: '9876500002',
    specialInstructions: 'Less spicy for kids',
    items: [
      { id: 'oi-3', menuItemId: 'item-3', name: 'Paneer Malai Tikka', price: 360, quantity: 1 },
      { id: 'oi-4', menuItemId: 'item-5', name: 'Dal Makhani Slow-Simmered', price: 290, quantity: 1 }
    ],
    subtotal: 650,
    tax: 32.5,
    tip: 0,
    total: 682.5,
    status: 'pending',
    paymentStatus: 'unpaid',
    paymentMethod: 'counter',
    createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
  }
];

const BROADCAST_CHANNEL_NAME = 'qr_dine_sync_channel';

class LocalDineStore {
  private isClient = typeof window !== 'undefined';
  private channel: BroadcastChannel | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (this.isClient) {
      if (typeof BroadcastChannel !== 'undefined') {
        this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.channel.onmessage = () => {
          this.notify();
        };
      }
      window.addEventListener('storage', (e) => {
        if (e.key?.startsWith('qrdine_')) {
          this.notify();
        }
      });
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  private broadcast() {
    this.notify();
    this.channel?.postMessage({ timestamp: Date.now() });
  }

  getRestaurants(): Restaurant[] {
    if (!this.isClient) return INITIAL_RESTAURANTS;
    const stored = localStorage.getItem('qrdine_restaurants');
    if (!stored) {
      localStorage.setItem('qrdine_restaurants', JSON.stringify(INITIAL_RESTAURANTS));
      return INITIAL_RESTAURANTS;
    }
    return JSON.parse(stored);
  }

  getRestaurantBySlug(slug: string): Restaurant | undefined {
    return this.getRestaurants().find((r) => r.slug === slug);
  }

  getCategories(restaurantId: string): MenuCategory[] {
    if (!this.isClient) return INITIAL_CATEGORIES.filter((c) => c.restaurantId === restaurantId);
    const stored = localStorage.getItem(`qrdine_categories_${restaurantId}`);
    if (!stored) {
      const filtered = INITIAL_CATEGORIES.filter((c) => c.restaurantId === restaurantId);
      localStorage.setItem(`qrdine_categories_${restaurantId}`, JSON.stringify(filtered));
      return filtered;
    }
    return JSON.parse(stored);
  }

  getMenuItems(restaurantId: string): MenuItem[] {
    if (!this.isClient) return INITIAL_MENU_ITEMS.filter((i) => i.restaurantId === restaurantId);
    const stored = localStorage.getItem(`qrdine_menu_${restaurantId}`);
    if (!stored) {
      const filtered = INITIAL_MENU_ITEMS.filter((i) => i.restaurantId === restaurantId);
      localStorage.setItem(`qrdine_menu_${restaurantId}`, JSON.stringify(filtered));
      return filtered;
    }
    return JSON.parse(stored);
  }

  addMenuItem(restaurantId: string, itemData: Omit<MenuItem, 'id' | 'restaurantId'>): MenuItem {
    const items = this.getMenuItems(restaurantId);
    const newItem: MenuItem = {
      ...itemData,
      id: `item-${Date.now()}`,
      restaurantId,
    };
    const updated = [newItem, ...items];
    localStorage.setItem(`qrdine_menu_${restaurantId}`, JSON.stringify(updated));
    this.broadcast();

    if (this.isClient) {
      fetch(`/api/restaurants/${restaurantId}/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      }).catch((err) => console.warn('Failed to sync new dish to server:', err));
    }

    return newItem;
  }

  deleteMenuItem(restaurantId: string, itemId: string): void {
    const items = this.getMenuItems(restaurantId);
    const updated = items.filter((i) => i.id !== itemId);
    localStorage.setItem(`qrdine_menu_${restaurantId}`, JSON.stringify(updated));
    this.broadcast();

    if (this.isClient) {
      fetch(`/api/restaurants/${restaurantId}/menu?itemId=${encodeURIComponent(itemId)}`, {
        method: 'DELETE',
      }).catch((err) => console.warn('Failed to sync deleted dish to server:', err));
    }
  }

  toggleItemAvailability(restaurantId: string, itemId: string): void {
    const items = this.getMenuItems(restaurantId);
    const updated = items.map((i) => (i.id === itemId ? { ...i, isAvailable: !i.isAvailable } : i));
    localStorage.setItem(`qrdine_menu_${restaurantId}`, JSON.stringify(updated));
    this.broadcast();

    if (this.isClient) {
      fetch(`/api/restaurants/${restaurantId}/menu`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, action: 'toggle_stock' }),
      }).catch((err) => console.warn('Failed to sync stock toggle to server:', err));
    }
  }

  updateItemPrice(restaurantId: string, itemId: string, newPrice: number): void {
    const items = this.getMenuItems(restaurantId);
    const updated = items.map((i) => (i.id === itemId ? { ...i, price: newPrice } : i));
    localStorage.setItem(`qrdine_menu_${restaurantId}`, JSON.stringify(updated));
    this.broadcast();

    if (this.isClient) {
      fetch(`/api/restaurants/${restaurantId}/menu`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, action: 'update_price', price: newPrice }),
      }).catch((err) => console.warn('Failed to sync price update to server:', err));
    }
  }

  getOrders(restaurantId: string): Order[] {
    if (!this.isClient) return INITIAL_ORDERS.filter((o) => o.restaurantId === restaurantId);
    const stored = localStorage.getItem(`qrdine_orders_${restaurantId}`);
    if (!stored) {
      const filtered = INITIAL_ORDERS.filter((o) => o.restaurantId === restaurantId);
      localStorage.setItem(`qrdine_orders_${restaurantId}`, JSON.stringify(filtered));
      return filtered;
    }
    return JSON.parse(stored);
  }

  getOrderById(restaurantId: string, orderId: string): Order | undefined {
    return this.getOrders(restaurantId).find((o) => o.id === orderId);
  }

  // Dining Tables & Opaque QR Tokens
  getTables(restaurantId: string): DiningTable[] {
    if (!this.isClient) return [];
    const stored = localStorage.getItem(`qrdine_tables_${restaurantId}`);
    if (!stored) {
      const defaultTbls: DiningTable[] = [
        { id: 'tab-1', restaurantId, tableNumber: '1', qrToken: `tok_${restaurantId}_tbl1`, capacity: 2, qrCodeUrl: `/r/spice-garden/t/1`, isActive: true },
        { id: 'tab-2', restaurantId, tableNumber: '2', qrToken: `tok_${restaurantId}_tbl2`, capacity: 4, qrCodeUrl: `/r/spice-garden/t/2`, isActive: true },
        { id: 'tab-4', restaurantId, tableNumber: '4', qrToken: `tok_${restaurantId}_tbl4`, capacity: 6, qrCodeUrl: `/r/spice-garden/t/4`, isActive: true },
        { id: 'tab-6', restaurantId, tableNumber: '6', qrToken: `tok_${restaurantId}_tbl6`, capacity: 8, qrCodeUrl: `/r/spice-garden/t/6`, isActive: true },
      ];
      localStorage.setItem(`qrdine_tables_${restaurantId}`, JSON.stringify(defaultTbls));
      return defaultTbls;
    }
    return JSON.parse(stored);
  }

  addTable(restaurantId: string, tableNumber: string, capacity = 4): DiningTable {
    const tables = this.getTables(restaurantId);
    const qrToken = `tok_${restaurantId}_tbl${tableNumber}_${Date.now().toString(36)}`;
    const newTable: DiningTable = {
      id: `tab-${Date.now()}`,
      restaurantId,
      tableNumber,
      qrToken,
      capacity,
      qrCodeUrl: `/r/spice-garden/t/${tableNumber}?token=${qrToken}`,
      isActive: true,
    };
    const updated = [...tables, newTable];
    if (this.isClient) {
      localStorage.setItem(`qrdine_tables_${restaurantId}`, JSON.stringify(updated));
      this.broadcast();
    }
    return newTable;
  }

  createOrder(order: Omit<Order, 'id' | 'orderCode' | 'createdAt' | 'updatedAt'> & { id?: string; orderCode?: string; trackingToken?: string; idempotencyKey?: string }): Order {
    const orders = this.getOrders(order.restaurantId);
    const count = orders.length + 101;
    const newOrder: Order = {
      ...order,
      id: order.id || `ord-${Date.now()}`,
      orderCode: order.orderCode || `#SG-${count}`,
      trackingToken: order.trackingToken || `trk_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newOrder, ...orders.filter((o) => o.id !== newOrder.id)];
    localStorage.setItem(`qrdine_orders_${order.restaurantId}`, JSON.stringify(updated));
    this.broadcast();
    return newOrder;
  }

  updateOrderStatus(restaurantId: string, orderId: string, status: OrderStatus, actingUserId = 'user-chef-1'): void {
    const orders = this.getOrders(restaurantId);
    const updated = orders.map((o) =>
      o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o
    );
    localStorage.setItem(`qrdine_orders_${restaurantId}`, JSON.stringify(updated));
    this.broadcast();

    // Sync to backend status transition validator
    if (this.isClient) {
      fetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetStatus: status, actingUserId }),
      }).catch((err) => console.warn('Server status transition sync skipped:', err));
    }
  }

  verifyManualPayment(restaurantId: string, orderId: string, actingUserId = 'user-owner-1'): void {
    const orders = this.getOrders(restaurantId);
    const updated = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          paymentStatus: 'paid' as PaymentStatus,
          status: (o.status === 'new' || o.status === 'pending') ? 'accepted' as OrderStatus : o.status,
          updatedAt: new Date().toISOString(),
        };
      }
      return o;
    });
    localStorage.setItem(`qrdine_orders_${restaurantId}`, JSON.stringify(updated));
    this.broadcast();

    if (this.isClient) {
      fetch(`/api/orders/${orderId}/verify-manual-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actingUserId }),
      }).catch((err) => console.warn('Server payment verification sync skipped:', err));
    }
  }

  updatePaymentStatus(restaurantId: string, orderId: string, paymentStatus: PaymentStatus): void {
    const orders = this.getOrders(restaurantId);
    const updated = orders.map((o) =>
      o.id === orderId ? { ...o, paymentStatus, updatedAt: new Date().toISOString() } : o
    );
    localStorage.setItem(`qrdine_orders_${restaurantId}`, JSON.stringify(updated));
    this.broadcast();
  }

  // Waiter Calls / Table Assistance
  callWaiter(restaurantId: string, tableNumber: string, requestType: string): void {
    if (!this.isClient) return;
    const existing = this.getWaiterCalls(restaurantId);
    const newCall: WaiterCall = {
      id: `call-${Date.now()}`,
      restaurantId,
      tableNumber,
      requestType,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(`qrdine_waiter_${restaurantId}`, JSON.stringify([newCall, ...existing]));
    this.broadcast();
  }

  getWaiterCalls(restaurantId: string): WaiterCall[] {
    if (!this.isClient) return [];
    const stored = localStorage.getItem(`qrdine_waiter_${restaurantId}`);
    return stored ? JSON.parse(stored) : [];
  }

  dismissWaiterCall(restaurantId: string, callId: string): void {
    if (!this.isClient) return;
    const existing = this.getWaiterCalls(restaurantId);
    const updated = existing.filter((c) => c.id !== callId);
    localStorage.setItem(`qrdine_waiter_${restaurantId}`, JSON.stringify(updated));
    this.broadcast();
  }

  // Base URL for QR codes
  getBaseUrl(): string {
    if (!this.isClient) return '';
    return localStorage.getItem('qrdine_base_url') || '';
  }

  setBaseUrl(url: string): void {
    if (!this.isClient) return;
    localStorage.setItem('qrdine_base_url', url);
    this.broadcast();
  }

  // Restaurant Payment Settings (4 Toggles & UPI QR Config)
  getPaymentSettings(restaurantId: string): RestaurantPaymentSettings {
    const defaultSettings: RestaurantPaymentSettings = {
      restaurantId,
      upiQrEnabled: true,
      upiAppEnabled: true,
      cardEnabled: true,
      counterPaymentEnabled: true,
      upiId: 'spicegarden@okhdfcbank',
      payeeName: 'Spice Garden Bistro',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    if (!this.isClient) return defaultSettings;
    const stored = localStorage.getItem(`qrdine_payment_settings_${restaurantId}`);
    if (!stored) {
      localStorage.setItem(`qrdine_payment_settings_${restaurantId}`, JSON.stringify(defaultSettings));
      return defaultSettings;
    }
    return JSON.parse(stored);
  }

  updatePaymentSettings(
    restaurantId: string,
    settings: Partial<RestaurantPaymentSettings>
  ): RestaurantPaymentSettings {
    const current = this.getPaymentSettings(restaurantId);
    const updated: RestaurantPaymentSettings = {
      ...current,
      ...settings,
      restaurantId,
      updatedAt: new Date().toISOString(),
    };
    if (this.isClient) {
      localStorage.setItem(`qrdine_payment_settings_${restaurantId}`, JSON.stringify(updated));
      this.broadcast();

      // Fire background sync to server endpoint
      fetch(`/api/restaurants/${restaurantId}/payment-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch((err) => console.warn('Server settings sync skipped:', err));
    }
    return updated;
  }
}

export const store = new LocalDineStore();
