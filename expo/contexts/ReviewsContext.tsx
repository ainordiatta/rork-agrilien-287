import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Review } from '@/types';
import { useApp } from './AppContext';
import { loadFromStorage, saveToStorage } from '@/lib/storage';

const STORAGE_KEY = '@app/reviews';
const QUERY_KEY = ['reviews'] as const;

export const [ReviewsProvider, useReviews] = createContextHook(() => {
  const { user } = useApp();
  const queryClient = useQueryClient();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const data = await loadFromStorage<Review[]>(STORAGE_KEY);
      return data ?? [];
    },
    staleTime: Infinity,
  });

  const saveMutation = useMutation({
    mutationFn: async (newReviews: Review[]) => {
      await saveToStorage(STORAGE_KEY, newReviews);
      return newReviews;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data);
    },
  });

  const addReview = useCallback(
    async (
      productId: string | undefined,
      shopId: string | undefined,
      rating: number,
      comment: string,
      images?: string[]
    ) => {
      if (!user) {
        throw new Error('User must be logged in to add review');
      }

      if (!productId && !shopId) {
        throw new Error('Either productId or shopId must be provided');
      }

      const newReview: Review = {
        id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        productId,
        shopId,
        userId: user.id,
        userName: user.name,
        userPhoto: user.photo,
        rating,
        comment,
        images,
        verified: true,
        createdAt: new Date().toISOString(),
      };

      const current = queryClient.getQueryData<Review[]>(QUERY_KEY) ?? [];
      saveMutation.mutate([newReview, ...current]);

      return newReview;
    },
    [user, queryClient, saveMutation]
  );

  const getProductReviews = useCallback(
    (productId: string): Review[] => {
      return reviews.filter((r) => r.productId === productId);
    },
    [reviews]
  );

  const getShopReviews = useCallback(
    (shopId: string): Review[] => {
      return reviews.filter((r) => r.shopId === shopId);
    },
    [reviews]
  );

  const getProductRating = useCallback(
    (productId: string): { average: number; count: number } => {
      const productReviews = reviews.filter((r) => r.productId === productId);
      if (productReviews.length === 0) {
        return { average: 0, count: 0 };
      }
      const sum = productReviews.reduce((acc, r) => acc + r.rating, 0);
      return {
        average: sum / productReviews.length,
        count: productReviews.length,
      };
    },
    [reviews]
  );

  const getShopRating = useCallback(
    (shopId: string): { average: number; count: number } => {
      const shopReviews = reviews.filter((r) => r.shopId === shopId);
      if (shopReviews.length === 0) {
        return { average: 0, count: 0 };
      }
      const sum = shopReviews.reduce((acc, r) => acc + r.rating, 0);
      return {
        average: sum / shopReviews.length,
        count: shopReviews.length,
      };
    },
    [reviews]
  );

  const hasUserReviewedProduct = useCallback(
    (productId: string): boolean => {
      if (!user) return false;
      return reviews.some((r) => r.productId === productId && r.userId === user.id);
    },
    [reviews, user]
  );

  const hasUserReviewedShop = useCallback(
    (shopId: string): boolean => {
      if (!user) return false;
      return reviews.some((r) => r.shopId === shopId && r.userId === user.id);
    },
    [reviews, user]
  );

  const deleteReview = useCallback(
    async (reviewId: string) => {
      const review = reviews.find((r) => r.id === reviewId);
      if (!review || !user || review.userId !== user.id) {
        throw new Error('Cannot delete this review');
      }
      const current = queryClient.getQueryData<Review[]>(QUERY_KEY) ?? [];
      saveMutation.mutate(current.filter((r) => r.id !== reviewId));
    },
    [reviews, user, queryClient, saveMutation]
  );

  const getUserReviews = useMemo(() => {
    if (!user) return [];
    return reviews.filter((r) => r.userId === user.id);
  }, [reviews, user]);

  return useMemo(
    () => ({
      reviews,
      userReviews: getUserReviews,
      isLoading,
      addReview,
      getProductReviews,
      getShopReviews,
      getProductRating,
      getShopRating,
      hasUserReviewedProduct,
      hasUserReviewedShop,
      deleteReview,
    }),
    [
      reviews,
      getUserReviews,
      isLoading,
      addReview,
      getProductReviews,
      getShopReviews,
      getProductRating,
      getShopRating,
      hasUserReviewedProduct,
      hasUserReviewedShop,
      deleteReview,
    ]
  );
});
