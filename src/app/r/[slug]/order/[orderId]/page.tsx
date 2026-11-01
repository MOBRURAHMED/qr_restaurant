'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { store } from '@/lib/store';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
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

    // Fetch order directly from API (which queries Supabase first)
    const fetchFromServer = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.order) {
            setOrder(data.order);
            return;
          }
        }
      } catch {
        // fallback to store
      }
    };

    fetchFromServer();

    // Connect to Supabase Realtime WebSocket for this specific order
    const supabase = getSupabaseBrowserClient();
    let channel: ReturnType<NonNullable<typeof supabase>['channel']> | null = null;

    if (supabase) {
      channel = supabase
        .channel(`order-track-${orderId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${orderId}`,
          },
          (payload) => {
            if (payload.new) {
              setOrder((prev) => (prev ? { ...prev, status: payload.new.status, paymentStatus: payload.new.payment_status } : null));
            }
          }
        )
        .subscribe();
    }

    // Store sync listener (immediate local tab & broadcast updates)
    const unsub = store.subscribe(() => {
      syncFromStore();
    });

    const pollTimer = setInterval(() => {
      syncFromStore();
      fetchFromServer();
    }, 3000);

    const timeout = setTimeout(() => {
      setIsTimedOut(true);
    }, 4000);

    return () => {
      unsub();
      clearInterval(pollTimer);
      clearTimeout(timeout);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
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
              className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-bold transition-all"
            >
              Return to Menu
            </button>
          </div>
        )}
      </div>
    );
  }

  // Active step computation
  const currentStepIndex = Math.max(
    0,
    STATUS_STEPS.findIndex((s) => s.key === order.status)
  );

  // Consolidated table billing calculation
  const sessionTotal = tableOrders.length > 0 
    ? tableOrders.reduce((sum, o) => sum + o.total, 0)
    : order.total;

  const currentRoundIndex = tableOrders.findIndex((o) => o.id === order.id);
  const roundDisplay = currentRoundIndex !== -1 ? currentRoundIndex + 1 : 1;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col items-center justify-start p-4 sm:p-6 pb-24 font-sans">
      <div className="w-full max-w-md space-y-4">
        {/* Top Navigation */}
        <div className="flex items-center justify-between py-2">
          <button
            onClick={() => router.push(`/r/${slug}/t/${order.tableNumber}`)}
            className="flex items-center space-x-1.5 text-xs font-semibold text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Table {order.tableNumber} Menu</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center space-x-1 text-xs font-semibold text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copiedShare ? 'Copied Link!' : 'Share'}</span>
          </button>
        </div>

        {/* Status Hero Card */}
        <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm font-extrabold text-amber-600 dark:text-amber-400">
                  {order.orderCode}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                  Round {roundDisplay}
                </span>
              </div>
              <h1 className="text-2xl font-black mt-1 text-stone-950 dark:text-white">
                Table {order.tableNumber}
              </h1>
            </div>

            {/* Payment badge */}
            <div className="text-right">
              {order.paymentStatus === 'paid' ? (
                <span className="inline-flex items-center space-x-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80">
                  <Check className="w-3 h-3" />
                  <span>PAID</span>
                </span>
              ) : order.paymentMethod === 'counter' ? (
                <span className="inline-flex items-center space-x-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/80">
                  <Banknote className="w-3 h-3" />
                  <span>PAY AT COUNTER</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/80">
                  <CreditCard className="w-3 h-3" />
                  <span>UPI PENDING</span>
                </span>
              )}
            </div>
          </div>

          {/* Stepper Timeline */}
          <div className="mt-8 space-y-4">
            {STATUS_STEPS.map((step, idx) => {
              const isPast = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              const isFuture = idx > currentStepIndex;

              return (
                <div key={step.key} className="flex items-start space-x-3 relative">
                  {/* Vertical connector line */}
                  {idx < STATUS_STEPS.length - 1 && (
                    <div
                      className={`absolute left-3.5 top-7 w-0.5 h-6 transition-colors ${
                        isPast ? 'bg-amber-500' : 'bg-stone-200 dark:bg-stone-800'
                      }`}
                    />
                  )}

                  {/* Dot */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                      isPast
                        ? 'bg-amber-500 text-white shadow-sm'
                        : isCurrent
                        ? 'bg-amber-500 text-white ring-4 ring-amber-500/20 shadow-md animate-pulse'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-400 border border-stone-300 dark:border-stone-700'
                    }`}
                  >
                    {isPast ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : isCurrent ? (
                      <ChefHat className="w-3.5 h-3.5" />
                    ) : (
                      <span className="text-[10px] font-bold">{idx + 1}</span>
                    )}
                  </div>

                  {/* Label & Description */}
                  <div className="pt-0.5">
                    <p
                      className={`text-xs font-bold leading-tight ${
                        isCurrent
                          ? 'text-stone-950 dark:text-white'
                          : isPast
                          ? 'text-stone-700 dark:text-stone-300'
                          : 'text-stone-400 dark:text-stone-600'
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-500 mt-0.5">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order More Dishes CTA */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-xs text-stone-900 dark:text-white flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Still Hungry? Add More Items</span>
            </h3>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
              Keep your table session open and order dessert or drinks
            </p>
          </div>
          <button
            onClick={() => router.push(`/r/${slug}/t/${order.tableNumber}`)}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all flex items-center space-x-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Order More</span>
          </button>
        </div>

        {/* Table Billing Summary (Rounds Breakdown) */}
        <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
            <span className="font-bold text-xs text-stone-900 dark:text-white flex items-center space-x-1.5">
              <Receipt className="w-3.5 h-3.5 text-stone-500" />
              <span>Table {order.tableNumber} Bill Details</span>
            </span>
            <span className="font-mono font-black text-sm text-amber-600 dark:text-amber-400">
              ₹{sessionTotal} Total
            </span>
          </div>

          <div className="mt-3 space-y-2 text-xs">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-stone-700 dark:text-stone-300">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                    {item.quantity}x
                  </span>
                  <span>{item.name}</span>
                </div>
                <span className="font-mono text-stone-900 dark:text-stone-200">
                  ₹{item.price * item.quantity}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 space-y-1.5 text-xs text-stone-500">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono">₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>GST &amp; Taxes (5%)</span>
              <span className="font-mono">₹{order.tax}</span>
            </div>
            {order.tip ? (
              <div className="flex justify-between text-amber-600 dark:text-amber-400">
                <span>Staff Tip</span>
                <span className="font-mono">+₹{order.tip}</span>
              </div>
            ) : null}
            <div className="flex justify-between font-bold text-stone-900 dark:text-white pt-2 border-t border-stone-200 dark:border-stone-800">
              <span>This Order Total</span>
              <span className="font-mono text-amber-600 dark:text-amber-400">₹{order.total}</span>
            </div>
          </div>
        </div>

        {/* Assistance / Service Request */}
        <div className="flex gap-2">
          {['Need Water', 'Call Waiter', 'Ask for Bill'].map((reqType) => (
            <button
              key={reqType}
              onClick={() => handleRequestAssistance(reqType)}
              className="flex-1 py-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:border-amber-500 text-[11px] font-bold transition-all shadow-sm"
            >
              {reqType}
            </button>
          ))}
        </div>

        {assistanceMsg && (
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-xs text-center font-bold animate-in fade-in">
            {assistanceMsg}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <OrderTrackingContent />
    </Suspense>
  );
}
