'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { store } from '@/lib/store';
import { Order, OrderStatus } from '@/types';
import { 
  CheckCircle2, 
  Clock, 
  ChefHat, 
  UtensilsCrossed, 
  Check, 
  ArrowLeft, 
  CreditCard, 
  Banknote,
  Receipt,
  Share2,
  Bell,
  Sparkles,
  Plus,
  ShoppingBag
} from 'lucide-react';

const STATUS_STEPS: { key: OrderStatus; label: string; desc: string }[] = [
  { key: 'pending', label: 'Order Received', desc: 'Sent to the kitchen display' },
  { key: 'preparing', label: 'Cooking in Kitchen', desc: 'Chef is crafting your dishes' },
  { key: 'ready', label: 'Ready to Serve', desc: 'Dishes are plated and hot' },
  { key: 'served', label: 'Served & Enjoy', desc: 'Bon appétit!' },
];

function OrderTrackingContent() {
  const params = useParams();
  const router = useRouter();
  const slug = (params.slug as string) || 'spice-garden';
  const orderId = params.orderId as string;

  const [mounted, setMounted] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [tableOrders, setTableOrders] = useState<Order[]>([]);
  const [assistanceMsg, setAssistanceMsg] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);

  useEffect(() => {
    setMounted(true);
    const restaurant = store.getRestaurantBySlug(slug) || store.getRestaurants()[0];
    if (!restaurant) return;

    const syncFromStore = () => {
      const all = store.getOrders(restaurant.id);
      const match = all.find((o) => o.id === orderId);
      if (match) {
        setOrder({ ...match });
        const related = all.filter(
          (o) =>
            o.tableNumber === match.tableNumber &&
            (match.customerSessionId ? o.customerSessionId === match.customerSessionId : true) &&
            o.status !== 'cancelled'
        );
        setTableOrders(related);
      }
    };

    syncFromStore();

    // Direct fetch from server if local store does not have it
    const fetchFromServer = async () => {
      try {
        const res = await fetch(`/api/restaurants/${restaurant.id}/orders`);
        if (res.ok) {
          const data = await res.json();
          const serverOrders = data.orders as Order[];
          const match = serverOrders?.find((o) => o.id === orderId);
          if (match) {
            setOrder(match);
            const related = serverOrders.filter(
              (o) =>
                o.tableNumber === match.tableNumber &&
                (match.customerSessionId ? o.customerSessionId === match.customerSessionId : true) &&
                o.status !== 'cancelled'
            );
            setTableOrders(related);
            return;
          }
        }
      } catch {
        // fallback to store
      }
    };

    fetchFromServer();

    // Store sync listener (immediate local tab & broadcast updates)
    const unsub = store.subscribe(() => {
      syncFromStore();
    });

    // 2.5s Polling loop so cook bump bar updates on kitchen tablet reflect instantly on diner phone
    const pollTimer = setInterval(() => {
      syncFromStore();
      fetchFromServer();
    }, 2500);

    const timeout = setTimeout(() => {
      setIsTimedOut(true);
    }, 3500);

    return () => {
      unsub();
      clearInterval(pollTimer);
      clearTimeout(timeout);
    };
  }, [slug, orderId]);

  const handleRetryLookup = () => {
    setIsTimedOut(false);
    const restaurant = store.getRestaurantBySlug(slug) || store.getRestaurants()[0];
    if (restaurant) {
      const found = store.getOrderById(restaurant.id, orderId);
      if (found) setOrder(found);
    }
  };

  const handleRequestAssistance = (type: string) => {
    if (!order) return;
    store.callWaiter(order.restaurantId, order.tableNumber, type);
    setAssistanceMsg(`Staff notified for: ${type}`);
    setTimeout(() => setAssistanceMsg(null), 3500);
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-stone-50 dark:bg-stone-950 text-stone-600 dark:text-stone-400 text-center">
        <Receipt className="w-12 h-12 mb-3 text-amber-500 opacity-60 animate-pulse" />
        <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
          {isTimedOut ? 'Order Record Not Found' : 'Connecting to Kitchen Feed...'}
        </h2>
        <p className="text-xs text-stone-500 mt-1 max-w-xs">
          {isTimedOut
            ? `Order ID "${orderId}" could not be located in this restaurant session.`
            : 'Synchronizing real-time order status and table billing details.'}
        </p>

        {isTimedOut && (
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={handleRetryLookup}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-sm"
            >
              Retry Sync
            </button>
            <button
              onClick={() => router.push(`/r/${slug}/t/1`)}
              className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-bold hover:bg-stone-300"
            >
              Back to Menu
            </button>
          </div>
        )}
      </div>
    );
  }

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'new':
      case 'pending':
        return 0;
      case 'accepted':
      case 'preparing':
        return 1;
      case 'ready':
        return 2;
      case 'served':
        return 3;
      default:
        return 0;
    }
  };

  const currentStep = getStepIndex(order.status);
  const runningTableTotal = tableOrders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 pb-16">
      {/* Top Header */}
      <div className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <button
            onClick={() => router.push(`/r/${slug}/t/${order.tableNumber}`)}
            className="flex items-center space-x-1.5 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-amber-600"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Order More</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleShare}
              className="flex items-center space-x-1 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 px-2 py-1 rounded-lg border border-stone-200 dark:border-stone-800"
              title="Share order link"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedShare ? 'Copied Link!' : 'Share'}</span>
            </button>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-900">
              Table {order.tableNumber}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-5 space-y-4">
        {/* Assistance notification banner */}
        {assistanceMsg && (
          <div className="p-3 bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-md animate-fade-in">
            <Check className="w-4 h-4" />
            <span>{assistanceMsg}</span>
          </div>
        )}

        {/* Order Status Hero Card */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 mb-3">
            {order.status === 'served' ? (
              <UtensilsCrossed className="w-7 h-7" />
            ) : order.status === 'ready' ? (
              <CheckCircle2 className="w-7 h-7 text-emerald-500" />
            ) : order.status === 'preparing' ? (
              <ChefHat className="w-7 h-7 animate-pulse" />
            ) : (
              <Clock className="w-7 h-7 animate-spin" />
            )}
          </div>

          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest">
            Order Reference {order.orderCode}
          </p>
          <h2 className="text-xl font-black mt-0.5 capitalize text-stone-900 dark:text-stone-100">
            {STATUS_STEPS[currentStep].label}
          </h2>
          <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
            {STATUS_STEPS[currentStep].desc}
          </p>

          {/* Payment Status Pill */}
          <div className="mt-4 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border">
            {order.paymentStatus === 'paid' ? (
              <span className="flex items-center space-x-1 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Paid &amp; Verified</span>
              </span>
            ) : order.paymentStatus === 'pending' ? (
              <span className="flex items-center space-x-1 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 animate-pulse">
                <Clock className="w-3.5 h-3.5" />
                <span>UPI Payment Pending Staff Verification</span>
              </span>
            ) : order.paymentStatus === 'unpaid' ? (
              <span className="flex items-center space-x-1 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200">
                <Banknote className="w-3.5 h-3.5" />
                <span>Pay at Counter (Unpaid)</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200">
                <span>Payment Failed</span>
              </span>
            )}
          </div>
        </div>

        {/* Order More Items / Running Tab */}
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 rounded-3xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-amber-600 text-white shadow-xs">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <span>Want more dishes or drinks?</span>
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                Add starters, extra naan, or beverages to Table {order.tableNumber}.
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push(`/r/${slug}/t/${order.tableNumber}`)}
            className="px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center space-x-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Order More Dishes</span>
          </button>
        </div>

        {/* Multi-Order Round History for this Table (if customer placed multiple rounds) */}
        {tableOrders.length > 1 && (
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-4 border border-stone-200/80 dark:border-stone-800 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-100 dark:border-stone-800">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
                <span>Table {order.tableNumber} Dining Session ({tableOrders.length} Rounds)</span>
              </span>
              <span className="text-xs font-black text-stone-900 dark:text-stone-100">
                Running Total: ₹{runningTableTotal}
              </span>
            </div>
            <div className="space-y-2">
              {tableOrders.map((to, roundIdx) => (
                <button
                  key={to.id}
                  onClick={() => router.push(`/r/${slug}/order/${to.id}`)}
                  className={`w-full p-2.5 rounded-2xl text-left text-xs border transition-all flex items-center justify-between ${
                    to.id === order.id
                      ? 'bg-amber-50/60 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 font-bold'
                      : 'bg-stone-50 dark:bg-stone-950/50 border-stone-200 dark:border-stone-800 hover:border-amber-400'
                  }`}
                >
                  <div>
                    <span className="text-[11px] text-stone-400 font-medium">Round {tableOrders.length - roundIdx}: </span>
                    <span className="font-mono text-stone-800 dark:text-stone-200">{to.orderCode}</span>
                    <span className="ml-2 text-stone-500 text-[11px]">
                      ({to.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')})
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-extrabold ${
                      to.status === 'served'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : to.status === 'ready'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        : to.status === 'preparing'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                    }`}>
                      {to.status}
                    </span>
                    <span className="font-bold">₹{to.total}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Status Stepper Progression */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-4">
            Live Kitchen Tracking
          </h3>

          <div className="space-y-4">
            {STATUS_STEPS.map((step, idx) => {
              const isDone = idx < currentStep;
              const isCurrent = idx === currentStep;

              return (
                <div key={step.key} className="flex items-start space-x-3.5">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isDone
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-amber-600 text-white ring-4 ring-amber-100 dark:ring-amber-950'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-400'
                      }`}
                    >
                      {isDone ? <Check className="w-4 h-4" /> : idx + 1}
                    </div>
                    {idx < STATUS_STEPS.length - 1 && (
                      <div
                        className={`w-0.5 h-7 mt-1 ${
                          idx < currentStep ? 'bg-emerald-600' : 'bg-stone-200 dark:bg-stone-800'
                        }`}
                      />
                    )}
                  </div>

                  <div className="flex-1 pt-0.5">
                    <p
                      className={`text-sm font-semibold ${
                        isCurrent
                          ? 'text-amber-700 dark:text-amber-400'
                          : isDone
                          ? 'text-stone-900 dark:text-stone-100'
                          : 'text-stone-400'
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-xs text-stone-500 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Assistance Actions */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-4 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2.5 flex items-center space-x-1.5">
            <Bell className="w-3.5 h-3.5 text-amber-500" />
            <span>Need Table Assistance?</span>
          </p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              onClick={() => handleRequestAssistance('Water Refill')}
              className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-500 font-medium active:scale-95 transition-all text-stone-700 dark:text-stone-300 text-center"
            >
              💧 Water
            </button>
            <button
              onClick={() => handleRequestAssistance('Extra Cutlery')}
              className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-500 font-medium active:scale-95 transition-all text-stone-700 dark:text-stone-300 text-center"
            >
              🍴 Cutlery
            </button>
            <button
              onClick={() => handleRequestAssistance('Bring Bill')}
              className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-500 font-medium active:scale-95 transition-all text-stone-700 dark:text-stone-300 text-center"
            >
              🧾 Bill
            </button>
          </div>
        </div>

        {/* Order Details & Receipt */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">
            Ordered Items
          </h3>

          <div className="divide-y divide-stone-100 dark:divide-stone-800 text-xs">
            {order.items.map((item) => (
              <div key={item.id} className="py-2.5 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-stone-800 dark:text-stone-200">
                    {item.name} <span className="text-stone-400 font-normal">× {item.quantity}</span>
                  </p>
                  {item.notes && <p className="text-[11px] text-amber-600 mt-0.5">Note: {item.notes}</p>}
                </div>
                <p className="font-semibold text-stone-900 dark:text-stone-100">
                  ₹{item.price * item.quantity}
                </p>
              </div>
            ))}

            <div className="pt-3 space-y-1.5 text-stone-500">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>GST Tax (5%)</span>
                <span>₹{order.tax}</span>
              </div>
              {order.tip && order.tip > 0 ? (
                <div className="flex justify-between">
                  <span>Staff Gratuity / Tip</span>
                  <span>₹{order.tip}</span>
                </div>
              ) : null}
              <div className="flex justify-between font-bold text-sm text-stone-900 dark:text-stone-100 pt-1.5 border-t border-stone-200 dark:border-stone-800">
                <span>Total Amount</span>
                <span>₹{order.total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-stone-500">Loading order tracker...</div>}>
      <OrderTrackingContent />
    </Suspense>
  );
}
