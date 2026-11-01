'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { store } from '@/lib/store';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Order, OrderStatus, PaymentStatus, WaiterCall, Restaurant } from '@/types';
import { 
  ChefHat, 
  Clock, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  Coffee, 
  CreditCard, 
  Banknote, 
  Bell, 
  Play,
  Wifi,
  WifiOff
} from 'lucide-react';

function KitchenDisplayContent() {
  const [mounted, setMounted] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestId, setSelectedRestId] = useState<string>('rest-1');

  const [orders, setOrders] = useState<Order[]>([]);
  const [waiterCalls, setWaiterCalls] = useState<WaiterCall[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'preparing' | 'ready'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [realtimeActive, setRealtimeActive] = useState(false);

  // Audio Chime Function
  const playChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;
      const audioCtx = new AudioCtxClass();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
      setAudioUnlocked(true);
    } catch {
      // AudioContext may require prior user interaction
    }
  }, [soundEnabled]);

  // Initial Data Fetch
  const fetchOrders = useCallback(async (restId: string) => {
    try {
      const res = await fetch(`/api/restaurants/${restId}/orders`);
      if (res.ok) {
        const data = await res.json();
        if (data.orders) {
          setOrders(data.orders);
          return;
        }
      }
    } catch (e) {
      console.warn('Fallback to local store orders:', e);
    }
    setOrders(store.getOrders(restId));
  }, []);

  useEffect(() => {
    setMounted(true);
    setRestaurants(store.getRestaurants());
    setWaiterCalls(store.getWaiterCalls(selectedRestId));
    setCurrentTime(Date.now());
    fetchOrders(selectedRestId);

    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 15000);
    return () => clearInterval(timer);
  }, [selectedRestId, fetchOrders]);

  // Supabase Realtime WebSocket Connection
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setRealtimeActive(false);
      return;
    }

    const channel = supabase
      .channel(`kitchen-orders-${selectedRestId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${selectedRestId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            playChime();
          }
          fetchOrders(selectedRestId);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeActive(true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setRealtimeActive(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedRestId, playChime, fetchOrders]);

  // Fallback Store Subscription
  useEffect(() => {
    const unsub = store.subscribe(() => {
      setWaiterCalls(store.getWaiterCalls(selectedRestId));
      fetchOrders(selectedRestId);
      playChime();
    });

    return unsub;
  }, [playChime, selectedRestId, fetchOrders]);

  // Status updates sent to backend API
  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    // 1. Optimistic UI update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
    );

    // 2. Call backend transition endpoint
    try {
      await fetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetStatus: nextStatus,
          actingUserId: 'user-chef-1',
          notes: `Kitchen transitioned status to ${nextStatus}`,
        }),
      });
    } catch (e) {
      console.warn('Status sync error:', e);
    }

    // 3. Sync memory store
    store.updateOrderStatus(selectedRestId, orderId, nextStatus, 'user-chef-1');
  };

  const handleDismissWaiter = (callId: string) => {
    store.dismissWaiterCall(selectedRestId, callId);
  };

  const filteredOrders = orders.filter((o) => {
    if (activeFilter === 'all') return o.status !== 'served' && o.status !== 'cancelled';
    return o.status === activeFilter;
  });

  const getElapsedMinutes = (isoString: string) => {
    if (!currentTime) return 0;
    return Math.floor((currentTime - new Date(isoString).getTime()) / 1000 / 60);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 p-4 md:p-6 font-sans">
        <div className="flex items-center space-x-3 pb-4 border-b border-stone-800">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <ChefHat className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Kitchen Display System (KDS)</span>
            </h1>
            <p className="text-xs text-stone-500">Initializing real-time kitchen stream...</p>
          </div>
        </div>
      </div>
    );
  }

  const currentRestaurant = restaurants.find((r) => r.id === selectedRestId) || restaurants[0] || {
    id: selectedRestId,
    name: 'Kitchen Station',
    slug: 'station',
    tagline: '',
    phone: '',
    currency: '₹',
    logoUrl: '',
    coverUrl: '',
    address: '',
    upiId: '',
    gstRate: 0.05
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 p-4 md:p-6 font-sans">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-stone-800 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Kitchen Display System (KDS)</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
                Live Station
              </span>
              {realtimeActive ? (
                <span className="flex items-center space-x-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/80">
                  <Wifi className="w-3 h-3 text-emerald-400" />
                  <span>Supabase Live</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-[11px] font-semibold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800/80">
                  <WifiOff className="w-3 h-3 text-amber-400" />
                  <span>Local Sync</span>
                </span>
              )}
            </h1>
            <p className="text-xs text-stone-400">{currentRestaurant.name} • Chef Station</p>
          </div>
        </div>

        {/* Audio and Controls */}
        <div className="flex items-center space-x-3">
          {!audioUnlocked && (
            <button
              onClick={playChime}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold flex items-center space-x-1.5 hover:bg-amber-500/20 transition-all"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Enable Chimes</span>
            </button>
          )}

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition-all ${
              soundEnabled
                ? 'bg-stone-900 border-stone-700 text-stone-300 hover:text-white'
                : 'bg-stone-900/40 border-stone-800 text-stone-600'
            }`}
            title={soundEnabled ? 'Chime sound enabled' : 'Chime sound muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 mt-4 pb-2 overflow-x-auto">
        {(['all', 'pending', 'preparing', 'ready'] as const).map((filter) => {
          const count = orders.filter((o) => {
            if (filter === 'all') return o.status !== 'served' && o.status !== 'cancelled';
            return o.status === filter;
          }).length;

          return (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeFilter === filter
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
              }`}
            >
              <span className="capitalize">{filter === 'all' ? 'Active Orders' : filter}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Waiter Calls Alerts */}
      {waiterCalls.length > 0 && (
        <div className="mt-4 p-3 bg-rose-950/40 border border-rose-800/80 rounded-2xl flex flex-wrap gap-2 items-center">
          <div className="flex items-center space-x-2 text-rose-300 text-xs font-bold">
            <Bell className="w-4 h-4 text-rose-400 animate-bounce" />
            <span>Assistance Requested:</span>
          </div>
          {waiterCalls.map((call) => (
            <div
              key={call.id}
              className="flex items-center space-x-2 bg-stone-900 px-3 py-1 rounded-xl border border-stone-800 text-xs"
            >
              <span className="font-extrabold text-white">Table {call.tableNumber}</span>
              <span className="text-stone-400">• {call.requestType}</span>
              <button
                onClick={() => handleDismissWaiter(call.id)}
                className="text-stone-500 hover:text-stone-300 ml-1 font-bold"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Order Tickets Grid */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full py-20 text-center text-stone-500">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-stone-600" />
            <p className="font-semibold text-sm">All Kitchen Orders Clear</p>
            <p className="text-xs text-stone-600">New orders from dining tables will chime here live</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const elapsed = getElapsedMinutes(order.createdAt);
            const isUrgent = elapsed > 20;

            return (
              <div
                key={order.id}
                className={`flex flex-col justify-between rounded-2xl bg-stone-900 border p-4 transition-all shadow-md ${
                  isUrgent
                    ? 'border-rose-500/60 shadow-rose-950/30'
                    : order.status === 'preparing'
                    ? 'border-amber-500/50'
                    : order.status === 'ready'
                    ? 'border-emerald-500/50'
                    : 'border-stone-800'
                }`}
              >
                <div>
                  {/* Ticket Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-black text-white">
                        Table {order.tableNumber}
                      </span>
                      <span className="text-xs font-mono font-bold text-stone-400">
                        {order.orderCode}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5 text-xs">
                      <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-rose-400 animate-pulse' : 'text-stone-500'}`} />
                      <span className={`font-mono font-bold ${isUrgent ? 'text-rose-400' : 'text-stone-400'}`}>
                        {elapsed}m
                      </span>
                    </div>
                  </div>

                  {/* Payment & Bill Badge (Read-Only for Kitchen) */}
                  <div className="pt-2 flex items-center space-x-2 text-[11px]">
                    {order.paymentStatus === 'paid' ? (
                      <span className="flex items-center space-x-1 text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/80 font-bold">
                        <CreditCard className="w-3 h-3 text-emerald-400" />
                        <span>PAID</span>
                      </span>
                    ) : order.paymentMethod === 'counter' ? (
                      <span className="flex items-center space-x-1 text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-800/80 font-bold">
                        <Banknote className="w-3 h-3 text-amber-400" />
                        <span>COUNTER BILL</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-blue-300 bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-800/80 font-bold">
                        <Coffee className="w-3 h-3 text-blue-400" />
                        <span>UPI PENDING</span>
                      </span>
                    )}

                    {order.customerName && (
                      <span className="text-stone-400 truncate">
                        • {order.customerName}
                      </span>
                    )}
                  </div>

                  {/* Special Cooking Instructions */}
                  {order.specialInstructions && (
                    <div className="mt-2 p-2 rounded-xl bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-300 font-medium">
                      ⚠️ Note: {order.specialInstructions}
                    </div>
                  )}

                  {/* Items List */}
                  <div className="mt-3 space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-start justify-between text-xs">
                        <div className="flex items-start space-x-2">
                          <span className="font-extrabold text-amber-400 font-mono text-sm leading-none">
                            {item.quantity}x
                          </span>
                          <div>
                            <span className="font-semibold text-stone-200 block leading-tight">
                              {item.name}
                            </span>
                            {item.notes && (
                              <span className="text-[10px] text-stone-400 italic block mt-0.5">
                                &quot;{item.notes}&quot;
                              </span>
                            )}
                          </div>
                        </div>

                        <span
                          className={`w-2.5 h-2.5 rounded-sm shrink-0 mt-0.5 ${
                            item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                          title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Culinary Action Buttons */}
                <div className="mt-5 pt-3 border-t border-stone-800">
                  {order.status === 'pending' || order.status === 'new' ? (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'preparing')}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs transition-all active:scale-95 shadow-md flex items-center justify-center space-x-1.5"
                    >
                      <ChefHat className="w-3.5 h-3.5" />
                      <span>Start Cooking</span>
                    </button>
                  ) : order.status === 'preparing' ? (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'ready')}
                      className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs transition-all active:scale-95 shadow-md flex items-center justify-center space-x-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark as Ready</span>
                    </button>
                  ) : order.status === 'ready' ? (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'served')}
                      className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white font-bold text-xs transition-all active:scale-95 flex items-center justify-center space-x-1.5"
                    >
                      <span>Mark as Served</span>
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function KitchenDisplaySystemPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <KitchenDisplayContent />
    </Suspense>
  );
}
