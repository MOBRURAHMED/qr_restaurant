export type OrderStatus = 'new' | 'pending' | 'accepted' | 'preparing' | 'ready' | 'served' | 'cancelled';
export type PaymentStatus = 'pending' | 'unpaid' | 'paid' | 'failed' | 'cancelled' | 'refunded';
export type PaymentMethod = 'upi_qr' | 'upi_app' | 'card' | 'counter' | 'online_upi' | 'online_card';

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface RestaurantMembership {
  id: string;
  restaurantId: string;
  userId: string;
  role: 'owner' | 'manager' | 'kitchen' | 'waiter';
  createdAt: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number; // in INR rupees
  isVeg: boolean;
  isAvailable: boolean;
  imageUrl: string;
  spicyLevel?: 1 | 2 | 3;
}

export interface MenuCategory {
  id: string;
  restaurantId: string;
  name: string;
  sortOrder: number;
}

export interface DiningTable {
  id: string;
  restaurantId: string;
  tableNumber: number | string;
  qrToken?: string;
  capacity: number;
  qrCodeUrl: string;
  isActive: boolean;
}

export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  phone: string;
  currency: string;
  logoUrl: string;
  coverUrl: string;
  address: string;
  upiId?: string;
  gstRate: number; // e.g. 0.05 for 5%
}

export interface RestaurantPaymentSettings {
  restaurantId: string;
  upiQrEnabled: boolean;
  upiAppEnabled: boolean;
  cardEnabled: boolean;
  counterPaymentEnabled: boolean;
  upiQrImagePath?: string;
  upiId?: string;
  payeeName?: string;
  razorpayKeyId?: string;
  razorpayConnectedAccountId?: string;
  updatedAt: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
  selectedSpice?: 'mild' | 'medium' | 'hot';
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  isVeg?: boolean;
}

export interface Order {
  id: string;
  restaurantId: string;
  tableNumber: string;
  orderCode: string;
  trackingToken?: string;
  idempotencyKey?: string;
  customerName?: string;
  customerPhone?: string;
  specialInstructions?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  tip?: number;
  total: number;
  totalAmount?: number;
  notes?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  customerSessionId?: string;
  roundNumber?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  restaurantId: string;
  amount: number; // in INR
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface PaymentWebhookEvent {
  id: string;
  eventId: string; // Razorpay webhook event ID for idempotency
  eventType: string;
  payload: Record<string, unknown>;
  processedAt: string;
  status: 'processed' | 'ignored' | 'failed';
}

export interface WaiterCall {
  id: string;
  restaurantId: string;
  tableNumber: string;
  requestType: string;
  createdAt: string;
}

export interface StaffAccount {
  id: string;
  restaurantId: string;
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'chef' | 'waiter';
  status: 'active' | 'invited' | 'offline';
  joinedAt: string;
}

export interface OrderStatusHistoryItem {
  id: string;
  orderId: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  changedByUserId?: string;
  changedByRole?: string;
  notes?: string;
  createdAt: string;
}
