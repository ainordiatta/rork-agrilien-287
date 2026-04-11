import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '@/types';
import { mockProducts } from '@/mocks/data';

const OFFLINE_PRODUCTS_KEY = '@app/offline_products';
const OFFLINE_LAST_SYNC_KEY = '@app/offline_last_sync';

export const [OfflineProvider, useOffline] = createContextHook(() => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [cachedProducts, setCachedProducts] = useState<Product[]>([]);
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  useEffect(() => {
    void loadCachedData();
    void checkConnectivity();

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleOnline = () => {
        console.log('[Offline] Back online');
        setIsOnline(true);
      };
      const handleOffline = () => {
        console.log('[Offline] Gone offline');
        setIsOnline(false);
      };
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    const interval = setInterval(checkConnectivity, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkConnectivity = async () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
      return;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      await fetch('https://httpbin.org/get', { signal: controller.signal, method: 'HEAD' });
      clearTimeout(timeoutId);
      setIsOnline(true);
    } catch {
      setIsOnline(false);
    }
  };

  const loadCachedData = async () => {
    try {
      const [productsData, syncData] = await Promise.all([
        AsyncStorage.getItem(OFFLINE_PRODUCTS_KEY),
        AsyncStorage.getItem(OFFLINE_LAST_SYNC_KEY),
      ]);

      if (productsData) {
        const trimmed = productsData.trim();
        if (trimmed && trimmed.startsWith('[')) {
          setCachedProducts(JSON.parse(productsData) as Product[]);
        }
      }
      if (syncData) {
        setLastSyncDate(syncData);
      }
    } catch (error) {
      console.error('[Offline] Error loading cached data:', error);
    }
  };

  const syncProducts = useCallback(async (products: Product[]) => {
    setIsSyncing(true);
    try {
      await AsyncStorage.setItem(OFFLINE_PRODUCTS_KEY, JSON.stringify(products));
      const now = new Date().toISOString();
      await AsyncStorage.setItem(OFFLINE_LAST_SYNC_KEY, now);
      setCachedProducts(products);
      setLastSyncDate(now);
      console.log('[Offline] Synced', products.length, 'products');
    } catch (error) {
      console.error('[Offline] Error syncing products:', error);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const getProducts = useCallback((): Product[] => {
    if (isOnline) {
      return mockProducts;
    }
    return cachedProducts.length > 0 ? cachedProducts : mockProducts;
  }, [isOnline, cachedProducts]);

  const forceSync = useCallback(async () => {
    await syncProducts(mockProducts);
  }, [syncProducts]);

  return useMemo(
    () => ({
      isOnline,
      isSyncing,
      cachedProducts,
      lastSyncDate,
      syncProducts,
      getProducts,
      forceSync,
    }),
    [isOnline, isSyncing, cachedProducts, lastSyncDate, syncProducts, getProducts, forceSync]
  );
});
