import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Message, Conversation, Product, CartItem, Negotiation, NegotiationType } from '@/types';
import { useApp } from './AppContext';
import { loadFromStorage, saveToStorage } from '@/lib/storage';

const STORAGE_KEY = '@app/conversations';
const QUERY_KEYS = {
  CONVERSATIONS: ['messages', 'conversations'] as const,
  MESSAGES: ['messages', 'messages'] as const,
  NEGOTIATIONS: ['messages', 'negotiations'] as const,
};

export const [MessagesProvider, useMessages] = createContextHook(() => {
  const { user, addToCart } = useApp();
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: QUERY_KEYS.CONVERSATIONS,
    queryFn: async () => {
      const data = await loadFromStorage<Conversation[]>(STORAGE_KEY);
      return data ?? [];
    },
    staleTime: Infinity,
  });

  const { data: messages = {}, isLoading: messagesLoading } = useQuery({
    queryKey: QUERY_KEYS.MESSAGES,
    queryFn: async () => {
      const data = await loadFromStorage<{ [conversationId: string]: Message[] }>(`${STORAGE_KEY}_messages`);
      return data ?? {};
    },
    staleTime: Infinity,
  });

  const { data: negotiations = [] } = useQuery({
    queryKey: QUERY_KEYS.NEGOTIATIONS,
    queryFn: async () => {
      const data = await loadFromStorage<Negotiation[]>(`${STORAGE_KEY}_negotiations`);
      return data ?? [];
    },
    staleTime: Infinity,
  });

  const isLoading = conversationsLoading || messagesLoading;

  const saveConversationsMutation = useMutation({
    mutationFn: async (newConversations: Conversation[]) => {
      await saveToStorage(STORAGE_KEY, newConversations);
      return newConversations;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.CONVERSATIONS, data);
    },
  });

  const saveMessagesMutation = useMutation({
    mutationFn: async (newMessages: { [conversationId: string]: Message[] }) => {
      await saveToStorage(`${STORAGE_KEY}_messages`, newMessages);
      return newMessages;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.MESSAGES, data);
    },
  });

  const saveNegotiationsMutation = useMutation({
    mutationFn: async (newNegotiations: Negotiation[]) => {
      await saveToStorage(`${STORAGE_KEY}_negotiations`, newNegotiations);
      return newNegotiations;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.NEGOTIATIONS, data);
    },
  });

  const createOrGetConversation = useCallback(
    async (product: Product): Promise<Conversation> => {
      if (!user) {
        throw new Error('User not logged in');
      }

      const currentConvs = queryClient.getQueryData<Conversation[]>(QUERY_KEYS.CONVERSATIONS) ?? [];

      const existingConversation = currentConvs.find(
        (conv) =>
          conv.productId === product.id &&
          ((conv.buyerId === user.id && conv.sellerId === product.shopId) ||
            (conv.sellerId === user.id && conv.buyerId === product.shopId))
      );

      if (existingConversation) {
        return existingConversation;
      }

      const newConversation: Conversation = {
        id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        productId: product.id,
        productName: product.name,
        productImage: product.images[0],
        productPrice: product.price,
        currency: product.currency,
        buyerId: user.id,
        buyerName: user.name,
        sellerId: product.shopId,
        sellerName: product.shop.name,
        unreadCount: 0,
        createdAt: new Date().toISOString(),
      };

      saveConversationsMutation.mutate([newConversation, ...currentConvs]);

      return newConversation;
    },
    [user, queryClient, saveConversationsMutation]
  );

  const sendMessage = useCallback(
    async (
      conversationId: string,
      content: string,
      type: 'text' | 'image' | 'voice' | 'offer' = 'text',
      metadata?: {
        imageUrl?: string;
        voiceUrl?: string;
        voiceDuration?: number;
        offer?: { price: number; currency: string };
      }
    ) => {
      if (!user) {
        throw new Error('User not logged in');
      }

      const currentConvs = queryClient.getQueryData<Conversation[]>(QUERY_KEYS.CONVERSATIONS) ?? [];
      const conversation = currentConvs.find((c) => c.id === conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const newMessage: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        conversationId,
        senderId: user.id,
        senderName: user.name,
        type,
        content,
        imageUrl: metadata?.imageUrl,
        voiceUrl: metadata?.voiceUrl,
        voiceDuration: metadata?.voiceDuration,
        offer: metadata?.offer
          ? { ...metadata.offer, status: 'pending' }
          : undefined,
        createdAt: new Date().toISOString(),
      };

      const currentMsgs = queryClient.getQueryData<{ [id: string]: Message[] }>(QUERY_KEYS.MESSAGES) ?? {};
      const updatedMessages = {
        ...currentMsgs,
        [conversationId]: [...(currentMsgs[conversationId] || []), newMessage],
      };

      const updatedConversations = currentConvs.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              lastMessage: content,
              lastMessageAt: newMessage.createdAt,
              unreadCount: c.buyerId === user.id ? c.unreadCount : c.unreadCount + 1,
            }
          : c
      );

      saveMessagesMutation.mutate(updatedMessages);
      saveConversationsMutation.mutate(updatedConversations);

      return newMessage;
    },
    [user, queryClient, saveMessagesMutation, saveConversationsMutation]
  );

  const markAsRead = useCallback(
    async (conversationId: string) => {
      const currentConvs = queryClient.getQueryData<Conversation[]>(QUERY_KEYS.CONVERSATIONS) ?? [];
      const conversation = currentConvs.find((c) => c.id === conversationId);

      if (!conversation || conversation.unreadCount === 0) {
        return;
      }

      saveConversationsMutation.mutate(
        currentConvs.map((c) =>
          c.id === conversationId ? { ...c, unreadCount: 0 } : c
        )
      );
    },
    [queryClient, saveConversationsMutation]
  );

  const updateOfferStatus = useCallback(
    async (
      messageId: string,
      conversationId: string,
      status: 'accepted' | 'rejected'
    ) => {
      const currentMsgs = queryClient.getQueryData<{ [id: string]: Message[] }>(QUERY_KEYS.MESSAGES) ?? {};
      const conversationMessages = currentMsgs[conversationId] || [];
      const updatedMessages = {
        ...currentMsgs,
        [conversationId]: conversationMessages.map((msg) =>
          msg.id === messageId && msg.offer
            ? { ...msg, offer: { ...msg.offer, status } }
            : msg
        ),
      };

      saveMessagesMutation.mutate(updatedMessages);
    },
    [queryClient, saveMessagesMutation]
  );

  const acceptOfferAndAddToCart = useCallback(
    async (
      messageId: string,
      conversationId: string,
      product: Product,
      offerPrice: number
    ) => {
      await updateOfferStatus(messageId, conversationId, 'accepted');

      const productWithOfferPrice = {
        ...product,
        price: offerPrice,
      };

      const cartItem: CartItem = {
        product: productWithOfferPrice,
        quantity: 1,
      };

      await addToCart(cartItem);
    },
    [updateOfferStatus, addToCart]
  );

  const createNegotiation = useCallback(
    async (
      conversationId: string,
      productId: string,
      productName: string,
      type: NegotiationType,
      requestedQuantity: number,
      proposedPrice: number,
      notes?: string
    ): Promise<Negotiation> => {
      if (!user) {
        throw new Error('User not logged in');
      }

      const currentConvs = queryClient.getQueryData<Conversation[]>(QUERY_KEYS.CONVERSATIONS) ?? [];
      const conversation = currentConvs.find((c) => c.id === conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const newNegotiation: Negotiation = {
        id: `neg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        conversationId,
        productId,
        productName,
        buyerId: conversation.buyerId,
        buyerName: conversation.buyerName,
        sellerId: conversation.sellerId,
        sellerName: conversation.sellerName,
        type,
        requestedQuantity,
        originalPrice: conversation.productPrice,
        proposedPrice,
        status: 'pending',
        notes,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const currentNegs = queryClient.getQueryData<Negotiation[]>(QUERY_KEYS.NEGOTIATIONS) ?? [];
      saveNegotiationsMutation.mutate([newNegotiation, ...currentNegs]);

      await sendMessage(
        conversationId,
        `Demande de négociation: ${requestedQuantity} unités à ${proposedPrice} ${conversation.currency}`,
        'text'
      );

      return newNegotiation;
    },
    [user, queryClient, saveNegotiationsMutation, sendMessage]
  );

  const respondToNegotiation = useCallback(
    async (
      negotiationId: string,
      status: 'accepted' | 'rejected' | 'counter_offer',
      counterPrice?: number
    ) => {
      const currentNegs = queryClient.getQueryData<Negotiation[]>(QUERY_KEYS.NEGOTIATIONS) ?? [];
      const negotiation = currentNegs.find((n) => n.id === negotiationId);

      const updatedNegotiations = currentNegs.map((neg) =>
        neg.id === negotiationId
          ? {
              ...neg,
              status,
              counterPrice,
              respondedAt: new Date().toISOString(),
            }
          : neg
      );

      saveNegotiationsMutation.mutate(updatedNegotiations);

      if (negotiation) {
        let messageContent = '';
        if (status === 'accepted') {
          messageContent = `Négociation acceptée! Prix: ${negotiation.proposedPrice}`;
        } else if (status === 'rejected') {
          messageContent = 'Négociation refusée';
        } else if (status === 'counter_offer' && counterPrice) {
          messageContent = `Contre-offre: ${counterPrice} ${negotiation.originalPrice} par unité`;
        }

        await sendMessage(negotiation.conversationId, messageContent, 'text');
      }
    },
    [queryClient, saveNegotiationsMutation, sendMessage]
  );

  const getUserNegotiations = useMemo(() => {
    if (!user) return [];
    return negotiations.filter(
      (neg) => neg.buyerId === user.id || neg.sellerId === user.id
    );
  }, [negotiations, user]);

  const getUserConversations = useMemo(() => {
    if (!user) return [];
    return conversations.filter(
      (conv) => conv.buyerId === user.id || conv.sellerId === user.id
    );
  }, [conversations, user]);

  const getConversationMessages = useCallback(
    (conversationId: string) => {
      return messages[conversationId] || [];
    },
    [messages]
  );

  const totalUnreadCount = useMemo(() => {
    if (!user) return 0;
    return conversations
      .filter((conv) => conv.buyerId === user.id || conv.sellerId === user.id)
      .reduce((total, conv) => total + conv.unreadCount, 0);
  }, [conversations, user]);

  return useMemo(
    () => ({
      conversations: getUserConversations,
      messages,
      negotiations: getUserNegotiations,
      isLoading,
      createOrGetConversation,
      sendMessage,
      markAsRead,
      getConversationMessages,
      updateOfferStatus,
      acceptOfferAndAddToCart,
      createNegotiation,
      respondToNegotiation,
      totalUnreadCount,
    }),
    [
      getUserConversations,
      messages,
      getUserNegotiations,
      isLoading,
      createOrGetConversation,
      sendMessage,
      markAsRead,
      getConversationMessages,
      updateOfferStatus,
      acceptOfferAndAddToCart,
      createNegotiation,
      respondToNegotiation,
      totalUnreadCount,
    ]
  );
});
