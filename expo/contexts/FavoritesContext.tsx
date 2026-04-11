import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Product } from '@/types';
import { loadFromStorage, saveToStorage, removeFromStorage } from '@/lib/storage';

const STORAGE_KEY = '@app/favorites';
const QUERY_KEY = ['favorites'] as const;

export const [FavoritesProvider, useFavorites] = createContextHook(() => {
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      console.log('[Favorites] Loading favorites from storage');
      const data = await loadFromStorage<Product[]>(STORAGE_KEY);
      return data ?? [];
    },
    staleTime: Infinity,
  });

  const saveMutation = useMutation({
    mutationFn: async (newFavorites: Product[]) => {
      await saveToStorage(STORAGE_KEY, newFavorites);
      return newFavorites;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data);
    },
  });

  const addFavorite = useCallback(async (product: Product) => {
    const current = queryClient.getQueryData<Product[]>(QUERY_KEY) ?? [];
    const exists = current.find((p) => p.id === product.id);
    if (exists) return;
    const updated = [...current, product];
    saveMutation.mutate(updated);
  }, [queryClient, saveMutation]);

  const removeFavorite = useCallback(async (productId: string) => {
    const current = queryClient.getQueryData<Product[]>(QUERY_KEY) ?? [];
    const updated = current.filter((p) => p.id !== productId);
    saveMutation.mutate(updated);
  }, [queryClient, saveMutation]);

  const toggleFavorite = useCallback(async (product: Product) => {
    const current = queryClient.getQueryData<Product[]>(QUERY_KEY) ?? [];
    const exists = current.find((p) => p.id === product.id);
    if (exists) {
      await removeFavorite(product.id);
    } else {
      await addFavorite(product);
    }
  }, [queryClient, addFavorite, removeFavorite]);

  const isFavorite = useCallback((productId: string): boolean => {
    return favorites.some((p) => p.id === productId);
  }, [favorites]);

  const clearFavorites = useCallback(async () => {
    await removeFromStorage(STORAGE_KEY);
    queryClient.setQueryData(QUERY_KEY, []);
  }, [queryClient]);

  const favoritesByShop = useMemo(() => {
    const grouped: Record<string, Product[]> = {};
    favorites.forEach((product) => {
      const shopId = product.shopId;
      if (!grouped[shopId]) {
        grouped[shopId] = [];
      }
      grouped[shopId].push(product);
    });
    return grouped;
  }, [favorites]);

  return useMemo(
    () => ({
      favorites,
      isLoading,
      addFavorite,
      removeFavorite,
      toggleFavorite,
      isFavorite,
      clearFavorites,
      favoritesByShop,
      favoriteCount: favorites.length,
    }),
    [
      favorites,
      isLoading,
      addFavorite,
      removeFavorite,
      toggleFavorite,
      isFavorite,
      clearFavorites,
      favoritesByShop,
    ]
  );
});
