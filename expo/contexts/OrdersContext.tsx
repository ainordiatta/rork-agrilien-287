import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loadFromStorage, saveToStorage } from '@/lib/storage';
import { useApp } from './AppContext';
import { Order, CartItem, PaymentMethod, DeliveryMethod, OrderStatus } from '@/types';

export interface OrderTracking {
  orderId: string;
  status: OrderStatus;
  timeline: OrderTimelineEvent[];
  estimatedDelivery?: string;
  trackingCode?: string;
}

export interface OrderTimelineEvent {
  status: OrderStatus;
  label: string;
  description: string;
  date: string;
  completed: boolean;
}

const STORAGE_KEY = '@app/orders';
const QUERY_KEY = ['orders'] as const;

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  shipped: 'En livraison',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

function generateTimeline(status: OrderStatus, createdAt: string): OrderTimelineEvent[] {
  const statuses: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered'];
  const descriptions: Record<OrderStatus, string> = {
    pending: 'Votre commande a été reçue et est en attente de confirmation.',
    confirmed: 'Le vendeur a confirmé votre commande.',
    shipped: 'Votre commande est en cours de livraison.',
    delivered: 'Votre commande a été livrée avec succès.',
    cancelled: 'La commande a été annulée.',
  };

  const currentIndex = statuses.indexOf(status);
  const baseDate = new Date(createdAt);

  return statuses.map((s, index) => ({
    status: s,
    label: STATUS_LABELS[s],
    description: descriptions[s],
    date: new Date(baseDate.getTime() + index * 24 * 60 * 60 * 1000).toISOString(),
    completed: index <= currentIndex,
  }));
}

export const [OrdersProvider, useOrders] = createContextHook(() => {
  const { user } = useApp();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const data = await loadFromStorage<Order[]>(STORAGE_KEY);
      return data ?? [];
    },
    staleTime: Infinity,
  });

  const saveMutation = useMutation({
    mutationFn: async (newOrders: Order[]) => {
      await saveToStorage(STORAGE_KEY, newOrders);
      return newOrders;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data);
    },
  });

  const createOrder = useCallback(
    (
      items: CartItem[],
      paymentMethod: PaymentMethod,
      deliveryMethod: DeliveryMethod,
      deliveryAddress?: string,
      deliveryRegion?: string,
      deliveryFee?: number,
    ) => {
      if (!user) throw new Error('User must be logged in');

      const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      const fee = deliveryFee ?? 0;

      const newOrder: Order = {
        id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        items,
        total: subtotal + fee,
        subtotal,
        deliveryFee: fee,
        currency: 'XOF',
        status: 'pending',
        paymentMethod,
        deliveryMethod,
        deliveryAddress,
        deliveryRegion,
        createdAt: new Date().toISOString(),
      };

      const current = queryClient.getQueryData<Order[]>(QUERY_KEY) ?? [];
      saveMutation.mutate([newOrder, ...current]);
      console.log('[Orders] Created order:', newOrder.id);
      return newOrder;
    },
    [user, queryClient, saveMutation]
  );

  const updateOrderStatus = useCallback(
    (orderId: string, status: OrderStatus) => {
      const current = queryClient.getQueryData<Order[]>(QUERY_KEY) ?? [];
      const updated = current.map(o =>
        o.id === orderId
          ? { ...o, status, ...(status === 'delivered' ? { deliveredAt: new Date().toISOString() } : {}) }
          : o
      );
      saveMutation.mutate(updated);
      console.log('[Orders] Updated status:', orderId, status);
    },
    [queryClient, saveMutation]
  );

  const getOrderTracking = useCallback(
    (orderId: string): OrderTracking | null => {
      const order = orders.find(o => o.id === orderId);
      if (!order) return null;

      return {
        orderId: order.id,
        status: order.status,
        timeline: generateTimeline(order.status, order.createdAt),
        estimatedDelivery: new Date(
          new Date(order.createdAt).getTime() + 3 * 24 * 60 * 60 * 1000
        ).toISOString(),
        trackingCode: `AGR-${order.id.slice(-8).toUpperCase()}`,
      };
    },
    [orders]
  );

  const myOrders = useMemo(() => {
    if (!user) return [];
    return orders.filter(o => o.userId === user.id);
  }, [orders, user]);

  return useMemo(
    () => ({
      orders,
      myOrders,
      isLoading,
      createOrder,
      updateOrderStatus,
      getOrderTracking,
    }),
    [orders, myOrders, isLoading, createOrder, updateOrderStatus, getOrderTracking]
  );
});
