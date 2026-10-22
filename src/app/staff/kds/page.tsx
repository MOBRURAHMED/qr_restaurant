'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { store } from '@/lib/store';
import { Order, OrderStatus, PaymentStatus, WaiterCall, Restaurant } from '@/types';
import { 
  ChefHat, 
  Clock, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  Coffee,
  Check, 
  CreditCard, 
  Banknote,
  Bell,
  AlertTriangle,
  Play
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

  useEffect(() => {
    setMounted(true);
    setRestaurants(store.getRestaurants());
    setOrders(store.getOrders(selectedRestId));
    setWaiterCalls(store.getWaiterCalls(selectedRestId));
    setCurrentTime(Date.now());
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 15000);
    return () => clearInterval(timer);
  }, [selectedRestId]);

  // Play audio chime when order is created/received
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
      // AudioContext might require user gesture
    }
  }, [soundEnabled]);

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setOrders(store.getOrders(selectedRestId));
      setWaiterCalls(store.getWaiterCalls(selectedRestId));
      playChime();
    });

    return unsub;
  }, [playChime, selectedRestId]);

  const handleUpdateStatus = (orderId: string, nextStatus: OrderStatus) => {
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
        <div className="mt-8 flex flex-col items-center justify-center py-24 text-stone-600">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium text-stone-400">Loading active kitchen tickets...</p>
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
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Kitchen Display System (KDS)</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                LIVE
              </span>
            </h1>
            <div className="flex items-center space-x-2 mt-0.5">
              <select
                value={selectedRestId}
                onChange={(e) => {
                  setSelectedRestId(e.target.value);
                  setOrders(store.getOrders(e.target.value));
                  setWaiterCalls(store.getWaiterCalls(e.target.value));
                }}
                className="bg-stone-900 border border-stone-800 text-stone-300 text-xs rounded-lg px-2 py-0.5 focus:outline-none"
              >
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <span className="text-stone-500 text-xs">• Real-time Kitchen Feed</span>
            </div>
          </div>
        </div>

        {/* Audio Toggle & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {!audioUnlocked && (
            <button
              onClick={playChime}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center space-x-1.5 animate-pulse shadow-md"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Click to Enable Audio</span>
            </button>
          )}

          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playChime();
            }}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border transition-all ${
              soundEnabled
                ? 'bg-stone-800 text-stone-200 border-stone-700'
                : 'bg-stone-900 text-stone-500 border-stone-800'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? 'Chime Active' : 'Muted'}</span>
          </button>

          <div className="bg-stone-900 p-1 rounded-xl border border-stone-800 flex space-x-1 text-xs">
            {(['all', 'pending', 'preparing', 'ready'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-all ${
                  activeFilter === filter
                    ? 'bg-amber-600 text-white font-bold shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {filter === 'all' ? 'Active' : filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Waiter Calls Alert Strip */}
      {waiterCalls.length > 0 && (
        <div className="mt-4 p-3 bg-rose-950/40 border border-rose-800/80 rounded-2xl flex flex-wrap items-center justify-between gap-2 animate-pulse">
          <div className="flex items-center space-x-2 text-rose-300 text-xs font-bold">
            <Bell className="w-4 h-4 text-rose-400 animate-bounce" />
            <span>Table Assistance Requested:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {waiterCalls.map((call) => (
              <div
                key={call.id}
                className="flex items-center space-x-2 bg-rose-900/60 px-3 py-1 rounded-xl text-xs text-white border border-rose-700"
              >
                <span className="font-extrabold">Table {call.tableNumber}:</span>
                <span>{call.requestType}</span>
                <button
                  onClick={() => handleDismissWaiter(call.id)}
                  className="ml-1 p-0.5 bg-white/20 hover:bg-white/40 rounded-full"
                  title="Mark Completed"
                >
                  <Check className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Order Grid */}
      <div className="mt-6">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20 text-stone-600">
            <Coffee className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <h3 className="text-base font-semibold text-stone-400">All caught up!</h3>
            <p className="text-xs text-stone-500 mt-1">
              No orders waiting for {currentRestaurant.name}. New orders will arrive with sound alerts.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredOrders.map((order) => {
              const minutes = getElapsedMinutes(order.createdAt);
              const elapsed = minutes < 1 ? 'Just now' : `${minutes}m ago`;
              const isOverdue = minutes >= 15;
              const isWarning = minutes >= 10 && minutes < 15;

              return (
                <div
                  key={order.id}
                  className={`flex flex-col justify-between rounded-2xl bg-stone-900 border transition-all ${
                    isOverdue
                      ? 'border-rose-500 ring-2 ring-rose-500/40'
                      : isWarning
                      ? 'border-amber-400 ring-1 ring-amber-400/40'
                      : order.status === 'pending'
                      ? 'border-amber-500/60 shadow-lg shadow-amber-500/5'
                      : order.status === 'preparing'
                      ? 'border-blue-500/50'
                      : 'border-emerald-500/50'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-stone-800/80">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-black tracking-tight text-white bg-stone-800 px-3 py-1 rounded-xl">
                          TABLE {order.tableNumber}
                        </span>
                        {order.roundNumber && order.roundNumber > 1 ? (
                          <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-lg border border-amber-800">
                            Round {order.roundNumber}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-800">
                            New Guest
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-1.5 text-xs font-semibold">
                        <Clock className={`w-3.5 h-3.5 ${isOverdue ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-stone-400'}`} />
                        <span className={isOverdue ? 'text-rose-400 font-bold' : isWarning ? 'text-amber-400' : 'text-stone-400'}>
                          {elapsed}
                        </span>
                        {isOverdue && (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
                        )}
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-xs">
                      <span className="font-mono text-stone-400">{order.orderCode}</span>

                      {/* Payment Status Badge (Cook Read-Only: Cash handled by Owner at Counter) */}
                      <div
                        className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wide border ${
                          order.paymentStatus === 'paid'
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60'
                            : order.paymentMethod === 'counter'
                            ? 'bg-amber-950/60 text-amber-300 border-amber-700/60'
                            : 'bg-blue-950/60 text-blue-300 border-blue-700/60'
                        }`}
                        title="Billing & cash handled at front counter by Cashier/Owner"
                      >
                        {order.paymentStatus === 'paid' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Paid</span>
                          </>
                        ) : order.paymentMethod === 'counter' ? (
                          <>
                            <Banknote className="w-3 h-3 text-amber-400" />
                            <span>Counter Bill</span>
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-3 h-3 text-blue-400" />
                            <span>UPI Pending</span>
                          </>
                        )}
                      </div>
                    </div>

                    {order.customerName && (
                      <p className="text-xs text-stone-400 mt-1">
                        Guest: <span className="text-stone-200">{order.customerName}</span>
                      </p>
                    )}
                  </div>

                  {/* Order Items List */}
                  <div className="p-4 flex-1 space-y-3">
                    <div className="divide-y divide-stone-800/50">
                      {order.items.map((item) => (
                        <div key={item.id} className="py-2 first:pt-0 last:pb-0">
                          <div className="flex items-baseline justify-between">
                            <span className="font-bold text-sm text-stone-100">
                              <span className="text-amber-400 mr-2 text-base">
                                {item.quantity}×
                              </span>
                              {item.name}
                            </span>
                          </div>
                          {item.notes && (
                            <p className="text-xs font-medium text-amber-300/90 bg-amber-950/30 px-2 py-0.5 rounded-md mt-1 border border-amber-900/40">
                              ⚠️ Note: {item.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    {order.specialInstructions && (
                      <div className="mt-2 p-2 rounded-xl bg-stone-800/80 border border-stone-700/60 text-xs text-stone-300">
                        <span className="font-semibold text-amber-400">Order Instructions: </span>
                        {order.specialInstructions}
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="p-3 border-t border-stone-800/80 bg-stone-950/50 rounded-b-2xl flex items-center gap-2">
                    {(order.status === 'pending' || order.status === 'new' || order.status === 'accepted') && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'preparing')}
                        className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 font-bold text-xs text-white shadow-sm flex items-center justify-center space-x-1.5 active:scale-95 transition-all"
                      >
                        <ChefHat className="w-4 h-4" />
                        <span>Start Cooking</span>
                      </button>
                    )}

                    {order.status === 'preparing' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'ready')}
                        className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white shadow-sm flex items-center justify-center space-x-1.5 active:scale-95 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark as Ready</span>
                      </button>
                    )}

                    {order.status === 'ready' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'served')}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white shadow-sm flex items-center justify-center space-x-1.5 active:scale-95 transition-all"
                      >
                        <Check className="w-4 h-4" />
                        <span>Mark as Served</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function KitchenDisplaySystemPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-stone-500">Loading KDS...</div>}>
      <KitchenDisplayContent />
    </Suspense>
  );
}
