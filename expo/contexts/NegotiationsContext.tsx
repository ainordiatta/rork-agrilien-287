import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Negotiation, NegotiationType, NegotiationStatus } from '@/types';
import { useApp } from './AppContext';
import { loadFromStorage, saveToStorage } from '@/lib/storage';

const STORAGE_KEY = '@app/negotiations';
const QUERY_KEY = ['negotiations'] as const;

export const [NegotiationsProvider, useNegotiations] = createContextHook(() => {
  const { user } = useApp();
  const queryClient = useQueryClient();

  const { data: negotiations = [], isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const data = await loadFromStorage<Negotiation[]>(STORAGE_KEY);
      return data ?? [];
    },
    staleTime: Infinity,
  });

  const saveMutation = useMutation({
    mutationFn: async (newNegotiations: Negotiation[]) => {
      await saveToStorage(STORAGE_KEY, newNegotiations);
      return newNegotiations;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data);
    },
  });

  const createNegotiation = useCallback(
    async (
      conversationId: string,
      productId: string,
      productName: string,
      sellerId: string,
      sellerName: string,
      type: NegotiationType,
      requestedQuantity: number,
      originalPrice: number,
      proposedPrice: number,
      notes?: string
    ): Promise<Negotiation> => {
      if (!user) {
        throw new Error('User must be logged in to create negotiation');
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const newNegotiation: Negotiation = {
        id: `nego_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        conversationId,
        productId,
        productName,
        buyerId: user.id,
        buyerName: user.name,
        sellerId,
        sellerName,
        type,
        requestedQuantity,
        originalPrice,
        proposedPrice,
        status: 'pending',
        notes,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
      };

      const current = queryClient.getQueryData<Negotiation[]>(QUERY_KEY) ?? [];
      saveMutation.mutate([newNegotiation, ...current]);

      return newNegotiation;
    },
    [user, queryClient, saveMutation]
  );

  const respondToNegotiation = useCallback(
    async (
      negotiationId: string,
      status: NegotiationStatus,
      counterPrice?: number
    ) => {
      if (!user) {
        throw new Error('User must be logged in to respond to negotiation');
      }

      const current = queryClient.getQueryData<Negotiation[]>(QUERY_KEY) ?? [];
      const negotiation = current.find((n) => n.id === negotiationId);
      if (!negotiation) {
        throw new Error('Negotiation not found');
      }

      if (negotiation.sellerId !== user.id) {
        throw new Error('Only seller can respond to negotiation');
      }

      const updatedNegotiation: Negotiation = {
        ...negotiation,
        status,
        counterPrice,
        respondedAt: new Date().toISOString(),
      };

      saveMutation.mutate(current.map((n) =>
        n.id === negotiationId ? updatedNegotiation : n
      ));

      return updatedNegotiation;
    },
    [user, queryClient, saveMutation]
  );

  const acceptCounterOffer = useCallback(
    async (negotiationId: string) => {
      if (!user) {
        throw new Error('User must be logged in to accept counter offer');
      }

      const current = queryClient.getQueryData<Negotiation[]>(QUERY_KEY) ?? [];
      const negotiation = current.find((n) => n.id === negotiationId);
      if (!negotiation) {
        throw new Error('Negotiation not found');
      }

      if (negotiation.buyerId !== user.id) {
        throw new Error('Only buyer can accept counter offer');
      }

      if (negotiation.status !== 'counter_offer') {
        throw new Error('No counter offer to accept');
      }

      const updatedNegotiation: Negotiation = {
        ...negotiation,
        status: 'accepted',
        proposedPrice: negotiation.counterPrice!,
      };

      saveMutation.mutate(current.map((n) =>
        n.id === negotiationId ? updatedNegotiation : n
      ));

      return updatedNegotiation;
    },
    [user, queryClient, saveMutation]
  );

  const cancelNegotiation = useCallback(
    async (negotiationId: string) => {
      if (!user) {
        throw new Error('User must be logged in to cancel negotiation');
      }

      const current = queryClient.getQueryData<Negotiation[]>(QUERY_KEY) ?? [];
      const negotiation = current.find((n) => n.id === negotiationId);
      if (!negotiation) {
        throw new Error('Negotiation not found');
      }

      if (negotiation.buyerId !== user.id && negotiation.sellerId !== user.id) {
        throw new Error('Only buyer or seller can cancel negotiation');
      }

      saveMutation.mutate(current.map((n) =>
        n.id === negotiationId ? { ...n, status: 'rejected' as const } : n
      ));
    },
    [user, queryClient, saveMutation]
  );

  const getUserNegotiations = useMemo(() => {
    if (!user) return [];
    return negotiations.filter(
      (n) => n.buyerId === user.id || n.sellerId === user.id
    );
  }, [negotiations, user]);

  const getConversationNegotiations = useCallback(
    (conversationId: string): Negotiation[] => {
      return negotiations.filter((n) => n.conversationId === conversationId);
    },
    [negotiations]
  );

  const getProductNegotiations = useCallback(
    (productId: string): Negotiation[] => {
      return negotiations.filter((n) => n.productId === productId);
    },
    [negotiations]
  );

  const getPendingNegotiations = useMemo(() => {
    if (!user) return [];
    return negotiations.filter(
      (n) =>
        n.sellerId === user.id &&
        (n.status === 'pending' || n.status === 'counter_offer')
    );
  }, [negotiations, user]);

  const getActiveBuyerNegotiations = useMemo(() => {
    if (!user) return [];
    return negotiations.filter(
      (n) =>
        n.buyerId === user.id &&
        (n.status === 'pending' || n.status === 'counter_offer')
    );
  }, [negotiations, user]);

  return useMemo(
    () => ({
      negotiations: getUserNegotiations,
      pendingNegotiations: getPendingNegotiations,
      activeBuyerNegotiations: getActiveBuyerNegotiations,
      isLoading,
      createNegotiation,
      respondToNegotiation,
      acceptCounterOffer,
      cancelNegotiation,
      getConversationNegotiations,
      getProductNegotiations,
    }),
    [
      getUserNegotiations,
      getPendingNegotiations,
      getActiveBuyerNegotiations,
      isLoading,
      createNegotiation,
      respondToNegotiation,
      acceptCounterOffer,
      cancelNegotiation,
      getConversationNegotiations,
      getProductNegotiations,
    ]
  );
});
