import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loadFromStorage, saveToStorage } from '@/lib/storage';
import { useApp } from './AppContext';

export type NotificationType = 'order' | 'message' | 'stock' | 'promotion' | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  read: boolean;
  createdAt: string;
}

const STORAGE_KEY = '@app/notifications';
const QUERY_KEY = ['notifications'] as const;

export const [NotificationsProvider, useNotifications] = createContextHook(() => {
  const { user } = useApp();
  const queryClient = useQueryClient();
  const [pushEnabled, setPushEnabled] = useState<boolean>(false);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const data = await loadFromStorage<AppNotification[]>(STORAGE_KEY);
      return data ?? [];
    },
    staleTime: Infinity,
  });

  const saveMutation = useMutation({
    mutationFn: async (newNotifications: AppNotification[]) => {
      await saveToStorage(STORAGE_KEY, newNotifications);
      return newNotifications;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data);
    },
  });

  const hasInitRef = useState({ done: false })[0];

  useEffect(() => {
    if (user && !hasInitRef.done && !isLoading && notifications.length === 0) {
      hasInitRef.done = true;
      const welcomeNotif: AppNotification = {
        id: `notif_welcome_${user.id}`,
        type: 'system',
        title: 'Bienvenue sur Agricien !',
        body: 'Découvrez les meilleurs produits agricoles de votre région.',
        read: false,
        createdAt: new Date().toISOString(),
      };
      const existing = queryClient.getQueryData<AppNotification[]>(QUERY_KEY) ?? [];
      if (!existing.find(n => n.id === welcomeNotif.id)) {
        saveMutation.mutate([welcomeNotif, ...existing]);
      }
    }
  }, [user, isLoading, notifications.length, hasInitRef, queryClient, saveMutation]);

  const addNotification = useCallback(
    (type: NotificationType, title: string, body: string, data?: Record<string, string>) => {
      const newNotif: AppNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        title,
        body,
        data,
        read: false,
        createdAt: new Date().toISOString(),
      };
      const current = queryClient.getQueryData<AppNotification[]>(QUERY_KEY) ?? [];
      saveMutation.mutate([newNotif, ...current.slice(0, 99)]);
      console.log('[Notifications] Added:', title);
      return newNotif;
    },
    [queryClient, saveMutation]
  );

  const markAsRead = useCallback(
    (notificationId: string) => {
      const current = queryClient.getQueryData<AppNotification[]>(QUERY_KEY) ?? [];
      const updated = current.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      saveMutation.mutate(updated);
    },
    [queryClient, saveMutation]
  );

  const markAllAsRead = useCallback(() => {
    const current = queryClient.getQueryData<AppNotification[]>(QUERY_KEY) ?? [];
    const updated = current.map(n => ({ ...n, read: true }));
    saveMutation.mutate(updated);
  }, [queryClient, saveMutation]);

  const deleteNotification = useCallback(
    (notificationId: string) => {
      const current = queryClient.getQueryData<AppNotification[]>(QUERY_KEY) ?? [];
      saveMutation.mutate(current.filter(n => n.id !== notificationId));
    },
    [queryClient, saveMutation]
  );

  const clearAll = useCallback(() => {
    saveMutation.mutate([]);
  }, [saveMutation]);

  const togglePushNotifications = useCallback(async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Info', 'Les notifications push ne sont pas disponibles sur le web.');
      return;
    }
    setPushEnabled(prev => !prev);
    Alert.alert(
      'Notifications',
      pushEnabled ? 'Notifications push désactivées' : 'Notifications push activées'
    );
  }, [pushEnabled]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const notifyNewOrder = useCallback(
    (orderId: string, total: number) => {
      addNotification(
        'order',
        'Nouvelle commande !',
        `Commande #${orderId.slice(-6)} reçue - ${total.toLocaleString('fr-FR')} FCFA`,
        { orderId }
      );
    },
    [addNotification]
  );

  const notifyLowStock = useCallback(
    (productName: string, currentStock: number) => {
      addNotification(
        'stock',
        'Stock bas !',
        `${productName} : il ne reste que ${currentStock} unité(s) en stock.`,
        { productName }
      );
    },
    [addNotification]
  );

  const notifyNewMessage = useCallback(
    (senderName: string, conversationId: string) => {
      addNotification(
        'message',
        'Nouveau message',
        `${senderName} vous a envoyé un message.`,
        { conversationId }
      );
    },
    [addNotification]
  );

  return useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      pushEnabled,
      addNotification,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAll,
      togglePushNotifications,
      notifyNewOrder,
      notifyLowStock,
      notifyNewMessage,
    }),
    [
      notifications,
      unreadCount,
      isLoading,
      pushEnabled,
      addNotification,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAll,
      togglePushNotifications,
      notifyNewOrder,
      notifyLowStock,
      notifyNewMessage,
    ]
  );
});
