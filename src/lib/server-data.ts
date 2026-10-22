import crypto from 'crypto';
import {
  Restaurant,
  MenuItem,
  RestaurantPaymentSettings,
  Order,
  PaymentStatus,
  OrderStatus,
  PaymentMethod,
  PaymentWebhookEvent,
  PaymentRecord,
  UserProfile,
  RestaurantMembership,
  DiningTable,
  OrderStatusHistoryItem,
} from '@/types';

// ==============================================================================
// DEFAULT AUTHORITATIVE SEED DATA
// ==============================================================================

const DEFAULT_RESTAURANTS: Restaurant[] = [
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
  },
];

const DEFAULT_PROFILES: UserProfile[] = [
  { id: 'user-owner-1', email: 'rajesh@spicegarden.in', fullName: 'Rajesh Mehra', createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'user-chef-1', email: 'harpal@spicegarden.in', fullName: 'Chef Harpal Singh', createdAt: '2026-01-05T00:00:00.000Z' },
  { id: 'user-waiter-1', email: 'sunil@spicegarden.in', fullName: 'Sunil Kumar', createdAt: '2026-01-10T00:00:00.000Z' },
  { id: 'user-owner-2', email: 'tanvi@urbanchai.in', fullName: 'Tanvi Kapoor', createdAt: '2026-01-15T00:00:00.000Z' },
];

const DEFAULT_MEMBERSHIPS: RestaurantMembership[] = [
  { id: 'mem-1', restaurantId: 'rest-1', userId: 'user-owner-1', role: 'owner', createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'mem-2', restaurantId: 'rest-1', userId: 'user-chef-1', role: 'kitchen', createdAt: '2026-01-05T00:00:00.000Z' },
  { id: 'mem-3', restaurantId: 'rest-1', userId: 'user-waiter-1', role: 'waiter', createdAt: '2026-01-10T00:00:00.000Z' },
  { id: 'mem-4', restaurantId: 'rest-2', userId: 'user-owner-2', role: 'owner', createdAt: '2026-01-15T00:00:00.000Z' },
];

const DEFAULT_TABLES: DiningTable[] = [
  { id: 'tab-1-1', restaurantId: 'rest-1', tableNumber: '1', qrToken: 'tok_rest1_tbl1_a9f8e7d6c5b4', capacity: 2, qrCodeUrl: '/r/spice-garden/t/1', isActive: true },
  { id: 'tab-1-2', restaurantId: 'rest-1', tableNumber: '2', qrToken: 'tok_rest1_tbl2_b8e7d6c5b4a3', capacity: 4, qrCodeUrl: '/r/spice-garden/t/2', isActive: true },
  { id: 'tab-1-4', restaurantId: 'rest-1', tableNumber: '4', qrToken: 'tok_rest1_tbl4_c7d6b5a4f3e2', capacity: 6, qrCodeUrl: '/r/spice-garden/t/4', isActive: true },
  { id: 'tab-2-1', restaurantId: 'rest-2', tableNumber: '1', qrToken: 'tok_rest2_tbl1_d6c5b4a3f2e1', capacity: 4, qrCodeUrl: '/r/urban-chai-co/t/1', isActive: true },
];

const DEFAULT_MENU_ITEMS: Record<string, MenuItem[]> = {
  'rest-1': [
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
      name: 'Tandoori Malai Broccoli',
      description: 'Charred florets marinated in cardamom cream cheese, cashew paste and fresh herbs',
      price: 340,
      isVeg: true,
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&auto=format&fit=crop&q=80',
      spicyLevel: 1,
    },
    {
      id: 'item-4',
      restaurantId: 'rest-1',
      categoryId: 'cat-2',
      name: 'Bhatti Murgh Tikka',
      description: 'Boneless chicken thighs cured in charred onion, mustard oil and bhatti spices',
      price: 380,
      isVeg: false,
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=400&auto=format&fit=crop&q=80',
      spicyLevel: 2,
    },
    {
      id: 'item-5',
      restaurantId: 'rest-1',
      categoryId: 'cat-3',
      name: 'Smoked Butter Chicken',
      description: 'Tandoor-pulled chicken in slow-simmered vine tomato, butter and fenugreek gravy',
      price: 490,
      isVeg: false,
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=400&auto=format&fit=crop&q=80',
      spicyLevel: 1,
    },
    {
      id: 'item-6',
      restaurantId: 'rest-1',
      categoryId: 'cat-3',
      name: 'Dal Makhani 24-Hour',
      description: 'Black lentils slow cooked overnight over glowing charcoal, finished with churned butter',
      price: 380,
      isVeg: true,
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&auto=format&fit=crop&q=80',
      spicyLevel: 1,
    },
    {
      id: 'item-8',
      restaurantId: 'rest-1',
      categoryId: 'cat-4',
      name: 'Garlic Truffle Naan',
      description: 'Leavened clay oven flatbread brushed with crushed roasted garlic and white truffle butter',
      price: 120,
      isVeg: true,
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=400&auto=format&fit=crop&q=80',
      spicyLevel: 1,
    },
  ],
  'rest-2': [
    {
      id: 'item-201',
      restaurantId: 'rest-2',
      categoryId: 'cat-p-1',
      name: 'Artisanal Sourdough Toast & Burrata',
      description: 'Freshly baked levain with creamy burrata, basil pesto and blistered cherry tomatoes',
      price: 380,
      isVeg: true,
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80',
      spicyLevel: 1,
    },
    {
      id: 'item-202',
      restaurantId: 'rest-2',
      categoryId: 'cat-p-2',
      name: 'Smoked Pepperoni Sourdough Pizza',
      description: 'San Marzano DOP tomato base, artisanal pepperoni, mozzarella and chili honey',
      price: 620,
      isVeg: false,
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80',
      spicyLevel: 2,
    },
  ],
};

// ==============================================================================
// GLOBAL SERVER STORAGE (Survives hot-reloads via globalThis)
// ==============================================================================

const globalServerStore = globalThis as unknown as {
  __serverRestaurants?: Restaurant[];
  __serverProfiles?: UserProfile[];
  __serverMemberships?: RestaurantMembership[];
  __serverTables?: DiningTable[];
  __serverMenuItems?: Record<string, MenuItem[]>;
  __serverPaymentSettings?: Record<string, RestaurantPaymentSettings>;
  __serverOrders?: Record<string, Order>;
  __serverOrderHistory?: OrderStatusHistoryItem[];
  __serverProcessedEvents?: Set<string>;
  __serverPayments?: Record<string, PaymentRecord>;
  __serverIdempotencyIndex?: Record<string, string>; // idempotencyKey -> orderId
  __serverOrderCounters?: Record<string, number>;
};

if (!globalServerStore.__serverRestaurants) globalServerStore.__serverRestaurants = [...DEFAULT_RESTAURANTS];
if (!globalServerStore.__serverProfiles) globalServerStore.__serverProfiles = [...DEFAULT_PROFILES];
if (!globalServerStore.__serverMemberships) globalServerStore.__serverMemberships = [...DEFAULT_MEMBERSHIPS];
if (!globalServerStore.__serverTables) globalServerStore.__serverTables = [...DEFAULT_TABLES];
if (!globalServerStore.__serverMenuItems) globalServerStore.__serverMenuItems = { ...DEFAULT_MENU_ITEMS };
if (!globalServerStore.__serverOrders) globalServerStore.__serverOrders = {};
if (!globalServerStore.__serverOrderHistory) globalServerStore.__serverOrderHistory = [];
if (!globalServerStore.__serverProcessedEvents) globalServerStore.__serverProcessedEvents = new Set<string>();
if (!globalServerStore.__serverPayments) globalServerStore.__serverPayments = {};
if (!globalServerStore.__serverIdempotencyIndex) globalServerStore.__serverIdempotencyIndex = {};
if (!globalServerStore.__serverOrderCounters) globalServerStore.__serverOrderCounters = {};

if (!globalServerStore.__serverPaymentSettings) {
  globalServerStore.__serverPaymentSettings = {
    'rest-1': {
      restaurantId: 'rest-1',
      upiQrEnabled: true,
      upiAppEnabled: true,
      cardEnabled: true,
      counterPaymentEnabled: true,
      upiId: 'spicegarden@okhdfcbank',
      payeeName: 'Spice Garden Bistro',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    'rest-2': {
      restaurantId: 'rest-2',
      upiQrEnabled: true,
      upiAppEnabled: true,
      cardEnabled: true,
      counterPaymentEnabled: true,
      upiId: 'urbanchai@icici',
      payeeName: 'Urban Chai & Co',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  };
}

// ==============================================================================
// 1. RESTAURANTS & MULTI-TENANCY MANAGEMENT
// ==============================================================================

export function getServerRestaurants(): Restaurant[] {
  return globalServerStore.__serverRestaurants!;
}

export function getServerRestaurant(restaurantId: string): Restaurant | undefined {
  return globalServerStore.__serverRestaurants!.find((r) => r.id === restaurantId);
}

export function getServerRestaurantBySlug(slug: string): Restaurant | undefined {
  return globalServerStore.__serverRestaurants!.find((r) => r.slug === slug);
}

export function createServerRestaurant(
  data: Omit<Restaurant, 'id'>,
  ownerUserId: string
): { restaurant: Restaurant; membership: RestaurantMembership } {
  const newRestaurant: Restaurant = {
    ...data,
    id: `rest-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
  };
  globalServerStore.__serverRestaurants!.push(newRestaurant);

  // Initialize payment settings
  globalServerStore.__serverPaymentSettings![newRestaurant.id] = {
    restaurantId: newRestaurant.id,
    upiQrEnabled: true,
    upiAppEnabled: true,
    cardEnabled: true,
    counterPaymentEnabled: true,
    upiId: newRestaurant.upiId || 'merchant@okhdfcbank',
    payeeName: newRestaurant.name,
    updatedAt: new Date().toISOString(),
  };

  // Assign Owner Membership
  const membership: RestaurantMembership = {
    id: `mem-${Date.now().toString(36)}`,
    restaurantId: newRestaurant.id,
    userId: ownerUserId,
    role: 'owner',
    createdAt: new Date().toISOString(),
  };
  globalServerStore.__serverMemberships!.push(membership);

  // Initialize empty menu catalogue
  globalServerStore.__serverMenuItems![newRestaurant.id] = [];

  return { restaurant: newRestaurant, membership };
}

// ==============================================================================
// 2. AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC)
// ==============================================================================

export function getServerProfile(userId: string): UserProfile | undefined {
  return globalServerStore.__serverProfiles!.find((p) => p.id === userId);
}

export function getServerUserMemberships(userId: string): RestaurantMembership[] {
  return globalServerStore.__serverMemberships!.filter((m) => m.userId === userId);
}

export function verifyMemberAccess(
  userId: string,
  restaurantId: string,
  allowedRoles?: Array<'owner' | 'manager' | 'kitchen' | 'waiter'>
): { authorized: boolean; role?: 'owner' | 'manager' | 'kitchen' | 'waiter'; error?: string } {
  const membership = globalServerStore.__serverMemberships!.find(
    (m) => m.userId === userId && m.restaurantId === restaurantId
  );

  if (!membership) {
    return { authorized: false, error: 'Forbidden: You do not have access to this restaurant' };
  }

  if (allowedRoles && !allowedRoles.includes(membership.role)) {
    return {
      authorized: false,
      role: membership.role,
      error: `Forbidden: Role '${membership.role}' is not authorized for this action`,
    };
  }

  return { authorized: true, role: membership.role };
}

export function assertTenantAccess(userId: string, targetRestaurantId: string): void {
  const check = verifyMemberAccess(userId, targetRestaurantId);
  if (!check.authorized) {
    throw new Error(check.error || 'Tenant isolation violation: cross-restaurant access denied');
  }
}

// ==============================================================================
// 3. DINING TABLES & OPAQUE TABLE TOKENS
// ==============================================================================

export function getServerTables(restaurantId: string): DiningTable[] {
  return globalServerStore.__serverTables!.filter((t) => t.restaurantId === restaurantId);
}

export function lookupTableByToken(token: string): {
  table: DiningTable;
  restaurant: Restaurant;
} | null {
  const table = globalServerStore.__serverTables!.find((t) => t.qrToken === token && t.isActive);
  if (!table) return null;

  const restaurant = getServerRestaurant(table.restaurantId);
  if (!restaurant) return null;

  return { table, restaurant };
}

export function createServerTable(
  restaurantId: string,
  tableNumber: string,
  capacity = 4,
  customBaseUrl?: string
): DiningTable {
  const existing = globalServerStore.__serverTables!.find(
    (t) => t.restaurantId === restaurantId && String(t.tableNumber) === String(tableNumber)
  );
  if (existing) {
    throw new Error(`Table number ${tableNumber} already exists for this restaurant`);
  }

  const qrToken = `tok_${restaurantId}_tbl${tableNumber}_${crypto.randomBytes(8).toString('hex')}`;
  const restaurant = getServerRestaurant(restaurantId);
  const base = customBaseUrl || '';
  const qrCodeUrl = `${base}/r/${restaurant?.slug || restaurantId}/t/${tableNumber}?token=${qrToken}`;

  const newTable: DiningTable = {
    id: `tab-${restaurantId}-${tableNumber}-${Date.now().toString(36)}`,
    restaurantId,
    tableNumber,
    qrToken,
    capacity,
    qrCodeUrl,
    isActive: true,
  };

  globalServerStore.__serverTables!.push(newTable);
  return newTable;
}

// ==============================================================================
// 4. MENU ITEMS & STOCK MANAGEMENT
// ==============================================================================

export function getServerMenuItems(restaurantId: string): MenuItem[] {
  return globalServerStore.__serverMenuItems![restaurantId] || [];
}

export function addServerMenuItem(restaurantId: string, itemData: Omit<MenuItem, 'id' | 'restaurantId'>): MenuItem {
  const newItem: MenuItem = {
    ...itemData,
    id: `item-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    restaurantId,
  };

  if (!globalServerStore.__serverMenuItems![restaurantId]) {
    globalServerStore.__serverMenuItems![restaurantId] = [];
  }
  globalServerStore.__serverMenuItems![restaurantId].push(newItem);
  return newItem;
}

export function updateServerMenuItem(
  restaurantId: string,
  itemId: string,
  updates: Partial<MenuItem>
): MenuItem {
  const items = globalServerStore.__serverMenuItems![restaurantId] || [];
  const idx = items.findIndex((i) => i.id === itemId);
  if (idx === -1) {
    throw new Error(`Menu item ${itemId} not found in restaurant ${restaurantId}`);
  }

  const updated = { ...items[idx], ...updates, id: itemId, restaurantId };
  items[idx] = updated;
  return updated;
}

export function toggleServerItemStock(restaurantId: string, itemId: string): MenuItem {
  const items = globalServerStore.__serverMenuItems![restaurantId] || [];
  const item = items.find((i) => i.id === itemId);
  if (!item) {
    throw new Error(`Menu item ${itemId} not found in restaurant ${restaurantId}`);
  }

  item.isAvailable = !item.isAvailable;
  return item;
}

export function deleteServerMenuItem(restaurantId: string, itemId: string): boolean {
  const items = globalServerStore.__serverMenuItems![restaurantId] || [];
  const initialLen = items.length;
  globalServerStore.__serverMenuItems![restaurantId] = items.filter((i) => i.id !== itemId);
  return globalServerStore.__serverMenuItems![restaurantId].length < initialLen;
}

// ==============================================================================
// 5. PAYMENT SETTINGS
// ==============================================================================

export function getServerPaymentSettings(restaurantId: string): RestaurantPaymentSettings {
  const current = globalServerStore.__serverPaymentSettings![restaurantId];
  if (current) return current;

  const initial: RestaurantPaymentSettings = {
    restaurantId,
    upiQrEnabled: true,
    upiAppEnabled: true,
    cardEnabled: true,
    counterPaymentEnabled: true,
    upiId: 'merchant@okhdfcbank',
    payeeName: 'Restaurant Dining',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
  globalServerStore.__serverPaymentSettings![restaurantId] = initial;
  return initial;
}

export function updateServerPaymentSettings(
  restaurantId: string,
  settings: Partial<RestaurantPaymentSettings>
): RestaurantPaymentSettings {
  const current = getServerPaymentSettings(restaurantId);
  const updated: RestaurantPaymentSettings = {
    ...current,
    ...settings,
    restaurantId,
    updatedAt: new Date().toISOString(),
  };
  globalServerStore.__serverPaymentSettings![restaurantId] = updated;
  return updated;
}

// ==============================================================================
// 6. ORDER VALIDATION, CALCULATION & IDEMPOTENCY
// ==============================================================================

export interface CartSubmitItem {
  menuItemId: string;
  quantity: number;
  notes?: string;
  clientItem?: {
    id?: string;
    name?: string;
    price?: number;
    isVeg?: boolean;
    description?: string;
    categoryId?: string;
    imageUrl?: string;
  };
}

export interface CalculatedOrderResult {
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  verifiedItems: Array<{
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    isVeg: boolean;
    notes?: string;
  }>;
}

export function validateAndCalculateServerOrder(
  restaurantId: string,
  submittedItems: CartSubmitItem[],
  tipAmount = 0
): CalculatedOrderResult {
  const authoritativeItems = getServerMenuItems(restaurantId);
  const itemMap = new Map(authoritativeItems.map((item) => [item.id, item]));

  if (!submittedItems || submittedItems.length === 0) {
    throw new Error('Order cart cannot be empty');
  }

  let subtotal = 0;
  const verifiedItems = [];

  for (const submitted of submittedItems) {
    let item = itemMap.get(submitted.menuItemId);

    // Dynamic registration for dishes added in merchant session
    if (!item && submitted.clientItem && submitted.clientItem.name && typeof submitted.clientItem.price === 'number') {
      item = {
        id: submitted.menuItemId,
        restaurantId,
        name: submitted.clientItem.name,
        price: submitted.clientItem.price,
        isVeg: Boolean(submitted.clientItem.isVeg),
        isAvailable: true,
        description: submitted.clientItem.description || '',
        categoryId: submitted.clientItem.categoryId || 'cat-1',
        imageUrl: submitted.clientItem.imageUrl || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&auto=format&fit=crop&q=80',
        spicyLevel: 1,
      };
      if (!globalServerStore.__serverMenuItems![restaurantId]) {
        globalServerStore.__serverMenuItems![restaurantId] = [];
      }
      globalServerStore.__serverMenuItems![restaurantId].push(item);
      itemMap.set(item.id, item);
    }

    if (!item) {
      throw new Error(`Menu item with ID ${submitted.menuItemId} does not exist in restaurant ${restaurantId}`);
    }
    if (!item.isAvailable) {
      throw new Error(`Dish "${item.name}" is currently sold out (86)`);
    }
    if (submitted.quantity <= 0 || !Number.isInteger(submitted.quantity)) {
      throw new Error(`Invalid quantity for dish "${item.name}"`);
    }

    const itemTotal = item.price * submitted.quantity;
    subtotal += itemTotal;

    verifiedItems.push({
      menuItemId: item.id,
      name: item.name,
      price: item.price, // Authoritative price snapshot
      quantity: submitted.quantity,
      isVeg: item.isVeg,
      notes: submitted.notes,
    });
  }

  const restaurant = getServerRestaurant(restaurantId);
  const gstRate = restaurant?.gstRate ?? 0.05;
  const tax = Math.round(subtotal * gstRate * 10) / 10;
  const cleanTip = Math.max(0, Math.round(tipAmount));
  const total = subtotal + tax + cleanTip;

  return {
    subtotal,
    tax,
    tip: cleanTip,
    total,
    verifiedItems,
  };
}

export function saveServerOrder(order: Order, idempotencyKey?: string): { order: Order; isDuplicate: boolean } {
  // Check duplicate submission
  if (idempotencyKey) {
    const existingOrderId = globalServerStore.__serverIdempotencyIndex![idempotencyKey];
    if (existingOrderId && globalServerStore.__serverOrders![existingOrderId]) {
      return { order: globalServerStore.__serverOrders![existingOrderId], isDuplicate: true };
    }
  }

  // Persist
  globalServerStore.__serverOrders![order.id] = order;
  if (idempotencyKey) {
    globalServerStore.__serverIdempotencyIndex![idempotencyKey] = order.id;
  }

  // Record initial audit status
  globalServerStore.__serverOrderHistory!.push({
    id: `aud-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    orderId: order.id,
    fromStatus: null,
    toStatus: order.status,
    notes: 'Order initiated at table checkout',
    createdAt: new Date().toISOString(),
  });

  return { order, isDuplicate: false };
}

export function getServerOrderById(orderId: string): Order | undefined {
  return globalServerStore.__serverOrders![orderId];
}

export function getServerOrderByRazorpayOrderId(razorpayOrderId: string): Order | undefined {
  return Object.values(globalServerStore.__serverOrders!).find(
    (o) => o.razorpayOrderId === razorpayOrderId
  );
}

export function getServerOrderByTrackingToken(trackingToken: string): Order | undefined {
  return Object.values(globalServerStore.__serverOrders!).find((o) => o.trackingToken === trackingToken);
}

export function getServerOrdersByRestaurant(restaurantId: string): Order[] {
  return Object.values(globalServerStore.__serverOrders!).filter((o) => o.restaurantId === restaurantId);
}

export function getNextServerOrderSerial(restaurantId: string): string {
  const restaurant = getServerRestaurant(restaurantId);
  const prefix = (restaurant?.name || 'SG').substring(0, 2).toUpperCase();
  if (!globalServerStore.__serverOrderCounters) {
    globalServerStore.__serverOrderCounters = {};
  }
  const current = globalServerStore.__serverOrderCounters[restaurantId] || 100;
  const next = current + 1;
  globalServerStore.__serverOrderCounters[restaurantId] = next;
  return `#${prefix}-${next}`;
}

// ==============================================================================
// 7. ORDER STATUS TRANSITIONS (State Machine & Validation)
// ==============================================================================

export const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new: ['accepted', 'preparing', 'cancelled'],
  pending: ['accepted', 'preparing', 'cancelled'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['served', 'cancelled'],
  served: [],
  cancelled: [],
};

export function transitionServerOrderStatus(
  orderId: string,
  targetStatus: OrderStatus,
  actingUserId: string,
  notes?: string
): Order {
  const order = globalServerStore.__serverOrders![orderId];
  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  // Verify acting user belongs to the restaurant
  const memberCheck = verifyMemberAccess(actingUserId, order.restaurantId, ['owner', 'manager', 'kitchen', 'waiter']);
  if (!memberCheck.authorized) {
    throw new Error(memberCheck.error || 'Unauthorized to update order status');
  }

  // Specific role constraints: only kitchen/manager/owner can accept or prepare
  if (['accepted', 'preparing', 'ready'].includes(targetStatus) && memberCheck.role === 'waiter') {
    throw new Error(`Role 'waiter' cannot transition orders to '${targetStatus}'. Kitchen or Manager required.`);
  }

  // State machine validation
  const currentStatus = order.status;
  const validTransitions = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
  if (!validTransitions.includes(targetStatus)) {
    throw new Error(`Invalid status transition: cannot change order from '${currentStatus}' to '${targetStatus}'`);
  }

  // Audit record
  globalServerStore.__serverOrderHistory!.push({
    id: `aud-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    orderId: order.id,
    fromStatus: currentStatus,
    toStatus: targetStatus,
    changedByUserId: actingUserId,
    changedByRole: memberCheck.role,
    notes: notes || `Status changed from ${currentStatus} to ${targetStatus}`,
    createdAt: new Date().toISOString(),
  });

  order.status = targetStatus;
  order.updatedAt = new Date().toISOString();
  globalServerStore.__serverOrders![orderId] = order;
  return order;
}

// ==============================================================================
// 8. MANUAL PAYMENT VERIFICATION (UPI QR & Counter Settlement)
// ==============================================================================

export function verifyManualPayment(
  orderId: string,
  actingUserId: string,
  notes?: string
): Order {
  const order = globalServerStore.__serverOrders![orderId];
  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  // Only authorized staff can verify payments (customers CANNOT)
  const memberCheck = verifyMemberAccess(actingUserId, order.restaurantId, ['owner', 'manager', 'waiter']);
  if (!memberCheck.authorized) {
    throw new Error('Forbidden: Only authorized restaurant staff can verify manual payments');
  }

  if (order.paymentStatus === 'paid') {
    return order; // Already paid
  }

  order.paymentStatus = 'paid';
  // If order was waiting in pending/new, automatically accept it into the kitchen
  if (order.status === 'new' || order.status === 'pending') {
    order.status = 'accepted';
  }
  order.updatedAt = new Date().toISOString();

  // Audit record
  globalServerStore.__serverOrderHistory!.push({
    id: `aud-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    orderId: order.id,
    fromStatus: null,
    toStatus: order.status,
    changedByUserId: actingUserId,
    changedByRole: memberCheck.role,
    notes: notes || `Manual payment confirmed (${order.paymentMethod}) by staff`,
    createdAt: new Date().toISOString(),
  });

  globalServerStore.__serverOrders![orderId] = order;
  return order;
}

export function updateServerOrderStatus(
  orderId: string,
  paymentStatus: PaymentStatus,
  orderStatus?: OrderStatus,
  razorpayPaymentId?: string
): Order | undefined {
  const order = globalServerStore.__serverOrders![orderId];
  if (!order) return undefined;

  order.paymentStatus = paymentStatus;
  if (orderStatus) {
    order.status = orderStatus;
  }
  if (razorpayPaymentId) {
    order.razorpayPaymentId = razorpayPaymentId;
  }
  order.updatedAt = new Date().toISOString();

  globalServerStore.__serverOrders![orderId] = order;
  return order;
}

// ==============================================================================
// 9. WEBHOOK IDEMPOTENCY
// ==============================================================================

export function isWebhookEventProcessed(eventId: string): boolean {
  return globalServerStore.__serverProcessedEvents!.has(eventId);
}

export function recordWebhookEvent(event: PaymentWebhookEvent): void {
  globalServerStore.__serverProcessedEvents!.add(event.eventId);
}
