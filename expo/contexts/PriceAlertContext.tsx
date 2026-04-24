import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotifications } from './NotificationsContext';

export interface PriceAlert {
  id: string;
  productId: string;
  productName: string;
  targetPrice: number;
  currency: string;
  createdAt: string;
}

const STORAGE_KEY = '@app/price_alerts';

export const [PriceAlertsProvider, usePriceAlerts] = createContextHook(() => {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const { addNotification } = useNotifications();

  useEffect(() => {
    void loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setAlerts(JSON.parse(stored));
      }
    } catch (e) {
      console.error('[PriceAlerts] Error loading', e);
    }
  };

  const saveAlerts = async (newAlerts: PriceAlert[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newAlerts));
      setAlerts(newAlerts);
    } catch (e) {
      console.error('[PriceAlerts] Error saving', e);
    }
  };

  const addAlert = useCallback((productId: string, productName: string, targetPrice: number, currency: string) => {
    const newAlert: PriceAlert = {
      id: Math.random().toString(36).substr(2, 9),
      productId,
      productName,
      targetPrice,
      currency,
      createdAt: new Date().toISOString(),
    };
    saveAlerts([...alerts, newAlert]);
    addNotification('system', 'Alerte créée', `Vous serez averti quand le prix de ${productName} descendra sous ${targetPrice} ${currency}.`);
  }, [alerts, addNotification]);

  const removeAlert = useCallback((alertId: string) => {
    saveAlerts(alerts.filter(a => a.id !== alertId));
  }, [alerts]);

  const hasAlertForProduct = useCallback((productId: string) => {
    return alerts.some(a => a.productId === productId);
  }, [alerts]);

  return useMemo(
    () => ({
      alerts,
      addAlert,
      removeAlert,
      hasAlertForProduct,
    }),
    [alerts, addAlert, removeAlert, hasAlertForProduct]
  );
});
