import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Country, User, CartItem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_KEYS = {
  COUNTRY: '@app/country',
  CART: '@app/cart',
};

export const [AppProvider, useApp] = createContextHook(() => {
  const auth = useAuth();
  const [selectedCountry, setSelectedCountry] = useState<Country>('senegal');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isAppDataLoading, setIsAppDataLoading] = useState<boolean>(true);

  useEffect(() => {
    void loadPersistedData();
  }, []);

  const safeJSONParse = (data: string | null, key: string): unknown => {
    if (!data) return null;
    try {
      const trimmed = data.trim();
      if (!trimmed || trimmed === 'undefined' || trimmed === 'null') {
        console.log(`[AppContext] Invalid ${key} data: empty or null string`);
        return null;
      }
      if (!trimmed.startsWith('[') && !trimmed.startsWith('{') && !trimmed.startsWith('"')) {
        console.log(`[AppContext] Invalid ${key} data format: ${trimmed.substring(0, 50)}`);
        return null;
      }
      return JSON.parse(data);
    } catch (error) {
      console.error(`[AppContext] JSON parse error for ${key}:`, error, 'Data:', data?.substring(0, 100));
      return null;
    }
  };

  const loadPersistedData = async () => {
    try {
      const [countryData, cartData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.COUNTRY),
        AsyncStorage.getItem(STORAGE_KEYS.CART),
      ]);

      if (countryData) {
        const parsed = safeJSONParse(countryData, 'country');
        if (parsed) {
          setSelectedCountry(parsed as Country);
        } else if (countryData.trim() && !countryData.trim().startsWith('[') && !countryData.trim().startsWith('{')) {
          setSelectedCountry(countryData.trim() as Country);
        } else {
          await AsyncStorage.removeItem(STORAGE_KEYS.COUNTRY);
          setSelectedCountry('senegal');
        }
      }
      if (cartData) {
        const parsed = safeJSONParse(cartData, 'cart');
        if (parsed && Array.isArray(parsed)) {
          setCart(parsed as CartItem[]);
        } else {
          await AsyncStorage.removeItem(STORAGE_KEYS.CART);
          setCart([]);
        }
      }
    } catch {
    } finally {
      setIsAppDataLoading(false);
    }
  };

  const updateCountry = useCallback(async (country: Country) => {
    setSelectedCountry(country);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.COUNTRY, JSON.stringify(country));
    } catch {
    }
  }, []);

  const user = auth.user;
  const isOnboarded = auth.isAuthenticated;
  const isLoading = auth.isLoading || isAppDataLoading;

  const updateUser = useCallback(async (userData: User | null) => {
    if (userData) {
      await auth.updateProfile(userData);
    } else {
      await auth.logout();
    }
  }, [auth]);

  const logout = useCallback(async () => {
    setCart([]);
    await AsyncStorage.removeItem(STORAGE_KEYS.CART);
    await auth.logout();
  }, [auth]);

  const switchRole = useCallback((newRole: 'client' | 'shop') => {
    return newRole;
  }, []);

  const completeOnboarding = useCallback(async () => {
    console.log('[AppContext] Onboarding completed via Supabase auth');
  }, []);

  const addToCart = useCallback(async (item: CartItem) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (cartItem) => cartItem.product.id === item.product.id
      );

      let newCart: CartItem[];
      if (existingIndex >= 0) {
        newCart = [...prevCart];
        newCart[existingIndex].quantity += item.quantity;
      } else {
        newCart = [...prevCart, item];
      }

      AsyncStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(newCart)).catch(() => {});
      return newCart;
    });
  }, []);

  const removeFromCart = useCallback(async (productId: string) => {
    setCart((prevCart) => {
      const newCart = prevCart.filter((item) => item.product.id !== productId);
      AsyncStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(newCart)).catch(() => {});
      return newCart;
    });
  }, []);

  const updateCartItemQuantity = useCallback(async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    setCart((prevCart) => {
      const newCart = prevCart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      );
      AsyncStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(newCart)).catch(() => {});
      return newCart;
    });
  }, [removeFromCart]);

  const clearCart = useCallback(async () => {
    setCart([]);
    await AsyncStorage.removeItem(STORAGE_KEYS.CART);
  }, []);

  const cartTotal = cart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);

  return useMemo(
    () => ({
      selectedCountry,
      updateCountry,
      user,
      updateUser,
      isOnboarded,
      completeOnboarding,
      logout,
      switchRole,
      cart,
      addToCart,
      removeFromCart,
      updateCartItemQuantity,
      clearCart,
      cartTotal,
      cartItemCount,
      isLoading,
    }),
    [
      selectedCountry,
      updateCountry,
      user,
      updateUser,
      isOnboarded,
      completeOnboarding,
      logout,
      switchRole,
      cart,
      addToCart,
      removeFromCart,
      updateCartItemQuantity,
      clearCart,
      cartTotal,
      cartItemCount,
      isLoading,
    ]
  );
});
