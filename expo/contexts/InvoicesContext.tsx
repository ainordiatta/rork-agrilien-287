import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Invoice, Order } from '@/types';
import { useApp } from './AppContext';
import { loadFromStorage, saveToStorage } from '@/lib/storage';

const STORAGE_KEY = '@app/invoices';
const QUERY_KEY = ['invoices'] as const;

export const [InvoicesProvider, useInvoices] = createContextHook(() => {
  const { user } = useApp();
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const data = await loadFromStorage<Invoice[]>(STORAGE_KEY);
      return data ?? [];
    },
    staleTime: Infinity,
  });

  const saveMutation = useMutation({
    mutationFn: async (newInvoices: Invoice[]) => {
      await saveToStorage(STORAGE_KEY, newInvoices);
      return newInvoices;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data);
    },
  });

  const generateInvoiceNumber = (): string => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `INV-${year}${month}-${random}`;
  };

  const generateInvoice = useCallback(
    async (order: Order): Promise<Invoice> => {
      if (!user) {
        throw new Error('User must be logged in to generate invoice');
      }

      const shop = order.items[0]?.product.shop;
      if (!shop) {
        throw new Error('Shop information not found');
      }

      const newInvoice: Invoice = {
        id: `invoice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        orderId: order.id,
        invoiceNumber: generateInvoiceNumber(),
        userId: order.userId,
        userName: user.name,
        userEmail: user.email,
        userPhone: user.phone,
        shopId: shop.id,
        shopName: shop.name,
        shopEmail: shop.email,
        shopPhone: shop.phone,
        items: order.items.map((item) => ({
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.product.price,
          total: item.product.price * item.quantity,
        })),
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        total: order.total,
        currency: order.currency,
        paymentMethod: order.paymentMethod,
        deliveryAddress: order.deliveryAddress,
        createdAt: new Date().toISOString(),
      };

      const current = queryClient.getQueryData<Invoice[]>(QUERY_KEY) ?? [];
      saveMutation.mutate([newInvoice, ...current]);

      return newInvoice;
    },
    [user, queryClient, saveMutation]
  );

  const getInvoice = useCallback(
    (invoiceId: string): Invoice | undefined => {
      return invoices.find((inv) => inv.id === invoiceId);
    },
    [invoices]
  );

  const getInvoiceByOrderId = useCallback(
    (orderId: string): Invoice | undefined => {
      return invoices.find((inv) => inv.orderId === orderId);
    },
    [invoices]
  );

  const getUserInvoices = useMemo(() => {
    if (!user) return [];
    return invoices.filter((inv) => inv.userId === user.id);
  }, [invoices, user]);

  const getShopInvoices = useMemo(() => {
    if (!user) return [];
    return invoices.filter((inv) => inv.shopId === user.id);
  }, [invoices, user]);

  const deleteInvoice = useCallback(
    async (invoiceId: string) => {
      const current = queryClient.getQueryData<Invoice[]>(QUERY_KEY) ?? [];
      saveMutation.mutate(current.filter((inv) => inv.id !== invoiceId));
    },
    [queryClient, saveMutation]
  );

  return useMemo(
    () => ({
      invoices,
      userInvoices: getUserInvoices,
      shopInvoices: getShopInvoices,
      isLoading,
      generateInvoice,
      getInvoice,
      getInvoiceByOrderId,
      deleteInvoice,
    }),
    [
      invoices,
      getUserInvoices,
      getShopInvoices,
      isLoading,
      generateInvoice,
      getInvoice,
      getInvoiceByOrderId,
      deleteInvoice,
    ]
  );
});
