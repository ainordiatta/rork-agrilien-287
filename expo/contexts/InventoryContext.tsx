import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  InventoryProduct, 
  Transaction, 
  Supplier, 
  Category,
  StockAlert,
  StockStatus 
} from '@/types';
import { CATEGORIES as DEFAULT_CATEGORIES } from '@/constants/categories';
import { loadFromStorage, saveToStorage } from '@/lib/storage';

const STORAGE_KEYS = {
  PRODUCTS: '@inventory/products',
  TRANSACTIONS: '@inventory/transactions',
  SUPPLIERS: '@inventory/suppliers',
  CATEGORIES: '@inventory/categories',
};

const QUERY_KEYS = {
  PRODUCTS: ['inventory', 'products'] as const,
  TRANSACTIONS: ['inventory', 'transactions'] as const,
  SUPPLIERS: ['inventory', 'suppliers'] as const,
  CATEGORIES: ['inventory', 'categories'] as const,
};

export const [InventoryProvider, useInventory] = createContextHook(() => {
  const queryClient = useQueryClient();

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: QUERY_KEYS.PRODUCTS,
    queryFn: async () => {
      const data = await loadFromStorage<InventoryProduct[]>(STORAGE_KEYS.PRODUCTS);
      return data ?? [];
    },
    staleTime: Infinity,
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: QUERY_KEYS.TRANSACTIONS,
    queryFn: async () => {
      const data = await loadFromStorage<Transaction[]>(STORAGE_KEYS.TRANSACTIONS);
      return data ?? [];
    },
    staleTime: Infinity,
  });

  const { data: suppliers = [], isLoading: suppliersLoading } = useQuery({
    queryKey: QUERY_KEYS.SUPPLIERS,
    queryFn: async () => {
      const data = await loadFromStorage<Supplier[]>(STORAGE_KEYS.SUPPLIERS);
      return data ?? [];
    },
    staleTime: Infinity,
  });

  const { data: categories = [] } = useQuery({
    queryKey: QUERY_KEYS.CATEGORIES,
    queryFn: async () => {
      const defaultCategories: Category[] = DEFAULT_CATEGORIES.map(cat => ({
        id: cat.id,
        name: cat.name,
        subcategories: cat.subcategories,
        productCount: 0,
      }));
      await saveToStorage(STORAGE_KEYS.CATEGORIES, defaultCategories);
      return defaultCategories;
    },
    staleTime: Infinity,
  });

  const isLoading = productsLoading || transactionsLoading || suppliersLoading;

  const saveProductsMutation = useMutation({
    mutationFn: async (newProducts: InventoryProduct[]) => {
      await saveToStorage(STORAGE_KEYS.PRODUCTS, newProducts);
      return newProducts;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.PRODUCTS, data);
    },
  });

  const saveTransactionsMutation = useMutation({
    mutationFn: async (newTransactions: Transaction[]) => {
      await saveToStorage(STORAGE_KEYS.TRANSACTIONS, newTransactions);
      return newTransactions;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.TRANSACTIONS, data);
    },
  });

  const saveSuppliersMutation = useMutation({
    mutationFn: async (newSuppliers: Supplier[]) => {
      await saveToStorage(STORAGE_KEYS.SUPPLIERS, newSuppliers);
      return newSuppliers;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.SUPPLIERS, data);
    },
  });

  const saveCategoriesMutation = useMutation({
    mutationFn: async (newCategories: Category[]) => {
      await saveToStorage(STORAGE_KEYS.CATEGORIES, newCategories);
      return newCategories;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.CATEGORIES, data);
    },
  });

  const addTransaction = useCallback(async (transaction: Transaction) => {
    const current = queryClient.getQueryData<Transaction[]>(QUERY_KEYS.TRANSACTIONS) ?? [];
    saveTransactionsMutation.mutate([transaction, ...current]);
  }, [queryClient, saveTransactionsMutation]);

  const addProduct = useCallback(async (product: Omit<InventoryProduct, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: InventoryProduct = {
      ...product,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const current = queryClient.getQueryData<InventoryProduct[]>(QUERY_KEYS.PRODUCTS) ?? [];
    saveProductsMutation.mutate([...current, newProduct]);

    const transaction: Transaction = {
      id: `trans-${Date.now()}`,
      type: 'achat',
      productId: newProduct.id,
      productName: newProduct.name,
      quantity: newProduct.quantity,
      amount: newProduct.price * newProduct.quantity,
      date: new Date().toISOString(),
    };
    await addTransaction(transaction);

    return newProduct;
  }, [queryClient, saveProductsMutation, addTransaction]);

  const updateProduct = useCallback(async (id: string, updates: Partial<InventoryProduct>) => {
    const current = queryClient.getQueryData<InventoryProduct[]>(QUERY_KEYS.PRODUCTS) ?? [];
    const updated = current.map(p =>
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    );
    saveProductsMutation.mutate(updated);
  }, [queryClient, saveProductsMutation]);

  const deleteProduct = useCallback(async (id: string) => {
    const current = queryClient.getQueryData<InventoryProduct[]>(QUERY_KEYS.PRODUCTS) ?? [];
    saveProductsMutation.mutate(current.filter(p => p.id !== id));
  }, [queryClient, saveProductsMutation]);

  const restockProduct = useCallback(async (id: string, quantity: number, supplierId?: string) => {
    const current = queryClient.getQueryData<InventoryProduct[]>(QUERY_KEYS.PRODUCTS) ?? [];
    const product = current.find(p => p.id === id);
    if (!product) return;

    const newQuantity = product.quantity + quantity;
    await updateProduct(id, { quantity: newQuantity });

    const transaction: Transaction = {
      id: `trans-${Date.now()}`,
      type: 'reapprovisionnement',
      productId: id,
      productName: product.name,
      quantity,
      amount: product.price * quantity,
      date: new Date().toISOString(),
      notes: supplierId ? `Fournisseur: ${supplierId}` : undefined,
    };
    await addTransaction(transaction);
  }, [queryClient, updateProduct, addTransaction]);

  const addSupplier = useCallback(async (supplier: Omit<Supplier, 'id' | 'createdAt'>) => {
    const newSupplier: Supplier = {
      ...supplier,
      id: `sup-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const current = queryClient.getQueryData<Supplier[]>(QUERY_KEYS.SUPPLIERS) ?? [];
    saveSuppliersMutation.mutate([...current, newSupplier]);
    return newSupplier;
  }, [queryClient, saveSuppliersMutation]);

  const updateSupplier = useCallback(async (id: string, updates: Partial<Supplier>) => {
    const current = queryClient.getQueryData<Supplier[]>(QUERY_KEYS.SUPPLIERS) ?? [];
    saveSuppliersMutation.mutate(current.map(s => s.id === id ? { ...s, ...updates } : s));
  }, [queryClient, saveSuppliersMutation]);

  const deleteSupplier = useCallback(async (id: string) => {
    const current = queryClient.getQueryData<Supplier[]>(QUERY_KEYS.SUPPLIERS) ?? [];
    saveSuppliersMutation.mutate(current.filter(s => s.id !== id));
  }, [queryClient, saveSuppliersMutation]);

  const addCategory = useCallback(async (category: Omit<Category, 'id' | 'productCount'>) => {
    const newCategory: Category = {
      ...category,
      id: `cat-${Date.now()}`,
      subcategories: category.subcategories || [],
      productCount: 0,
    };
    const current = queryClient.getQueryData<Category[]>(QUERY_KEYS.CATEGORIES) ?? [];
    saveCategoriesMutation.mutate([...current, newCategory]);
    return newCategory;
  }, [queryClient, saveCategoriesMutation]);

  const updateCategory = useCallback(async (id: string, updates: Partial<Category>) => {
    const current = queryClient.getQueryData<Category[]>(QUERY_KEYS.CATEGORIES) ?? [];
    saveCategoriesMutation.mutate(current.map(c => c.id === id ? { ...c, ...updates } : c));
  }, [queryClient, saveCategoriesMutation]);

  const deleteCategory = useCallback(async (id: string) => {
    const current = queryClient.getQueryData<Category[]>(QUERY_KEYS.CATEGORIES) ?? [];
    saveCategoriesMutation.mutate(current.filter(c => c.id !== id));
  }, [queryClient, saveCategoriesMutation]);

  const getStockStatus = useCallback((product: InventoryProduct): StockStatus => {
    if (product.quantity === 0) return 'out_of_stock';
    if (product.quantity <= product.minStockLevel) return 'low_stock';
    return 'in_stock';
  }, []);

  const stockAlerts = useMemo<StockAlert[]>(() => {
    return products
      .filter(p => p.quantity <= p.minStockLevel)
      .map(p => ({
        productId: p.id,
        productName: p.name,
        currentStock: p.quantity,
        minStock: p.minStockLevel,
        status: getStockStatus(p),
      }));
  }, [products, getStockStatus]);

  const totalValue = useMemo(() => {
    return products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  }, [products]);

  const categoriesWithCount = useMemo(() => {
    return categories.map(cat => ({
      ...cat,
      productCount: products.filter(p => p.category === cat.name).length,
    }));
  }, [categories, products]);

  const getSubcategoriesForCategory = useCallback((categoryName: string): string[] => {
    const category = categories.find(cat => cat.name === categoryName);
    return category ? category.subcategories : [];
  }, [categories]);

  return useMemo(
    () => ({
      products,
      transactions,
      suppliers,
      categories: categoriesWithCount,
      stockAlerts,
      totalValue,
      isLoading,
      addProduct,
      updateProduct,
      deleteProduct,
      restockProduct,
      addTransaction,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      addCategory,
      updateCategory,
      deleteCategory,
      getStockStatus,
      getSubcategoriesForCategory,
    }),
    [
      products,
      transactions,
      suppliers,
      categoriesWithCount,
      stockAlerts,
      totalValue,
      isLoading,
      addProduct,
      updateProduct,
      deleteProduct,
      restockProduct,
      addTransaction,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      addCategory,
      updateCategory,
      deleteCategory,
      getStockStatus,
      getSubcategoriesForCategory,
    ]
  );
});
