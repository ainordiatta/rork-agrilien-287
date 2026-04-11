import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertCircle,
  ArrowRight,
  Users,
  ShoppingCart,
  Activity
} from 'lucide-react-native';
import { useMemo } from 'react';
import Colors from '@/constants/colors';
import { useInventory } from '@/contexts/InventoryContext';

export default function DashboardScreen() {
  const router = useRouter();
  const { products, transactions, totalValue, stockAlerts } = useInventory();

  const stats = useMemo(() => {
    const today = new Date();
    const lastMonth = new Date(today.setMonth(today.getMonth() - 1));
    
    const recentTransactions = transactions.filter(
      t => new Date(t.date) >= lastMonth
    );
    
    const sales = recentTransactions.filter(t => t.type === 'vente');
    const purchases = recentTransactions.filter(t => t.type === 'achat');
    
    const totalSales = sales.reduce((sum, t) => sum + t.amount, 0);
    const totalPurchases = purchases.reduce((sum, t) => sum + t.amount, 0);
    const totalRevenue = totalSales - totalPurchases;
    
    const lowStockCount = products.filter(p => p.quantity <= p.minStockLevel).length;
    const outOfStockCount = products.filter(p => p.quantity === 0).length;

    return {
      totalSales,
      totalPurchases,
      totalRevenue,
      salesCount: sales.length,
      purchasesCount: purchases.length,
      lowStockCount,
      outOfStockCount,
      recentTransactions: recentTransactions.slice(0, 5),
    };
  }, [products, transactions]);

  const formatPrice = (price: number) => {
    return `${price.toLocaleString('fr-FR')} FCFA`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
    }).format(date);
  };

  const quickActions = [
    {
      title: 'Ajouter un produit',
      icon: Package,
      color: '#2196F3',
      onPress: () => router.push('/admin/add-product'),
    },
    {
      title: 'Voir les rapports',
      icon: Activity,
      color: '#9C27B0',
      onPress: () => router.push('/admin/reports'),
    },
    {
      title: 'Gérer le stock',
      icon: ShoppingCart,
      color: '#FF9800',
      onPress: () => router.push('/admin/stock'),
    },
    {
      title: 'Comptes utilisateurs',
      icon: Users,
      color: '#4CAF50',
      onPress: () => router.push('/admin/accounts'),
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vue d&apos;ensemble</Text>
        <Text style={styles.sectionSubtitle}>Statistiques du dernier mois</Text>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
            <View style={styles.statIconContainer}>
              <TrendingUp size={24} color="#2196F3" />
            </View>
            <Text style={styles.statValue}>{formatPrice(stats.totalSales)}</Text>
            <Text style={styles.statLabel}>Ventes</Text>
            <Text style={styles.statSubtext}>{stats.salesCount} transactions</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
            <View style={styles.statIconContainer}>
              <TrendingDown size={24} color="#FF9800" />
            </View>
            <Text style={styles.statValue}>{formatPrice(stats.totalPurchases)}</Text>
            <Text style={styles.statLabel}>Achats</Text>
            <Text style={styles.statSubtext}>{stats.purchasesCount} transactions</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
            <View style={styles.statIconContainer}>
              <DollarSign size={24} color="#4CAF50" />
            </View>
            <Text style={[
              styles.statValue,
              { color: stats.totalRevenue >= 0 ? '#4CAF50' : Colors.error }
            ]}>
              {formatPrice(stats.totalRevenue)}
            </Text>
            <Text style={styles.statLabel}>Bénéfice</Text>
            <Text style={styles.statSubtext}>
              {stats.totalRevenue >= 0 ? 'Positif' : 'Négatif'}
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#F3E5F5' }]}>
            <View style={styles.statIconContainer}>
              <Package size={24} color="#9C27B0" />
            </View>
            <Text style={styles.statValue}>{formatPrice(totalValue)}</Text>
            <Text style={styles.statLabel}>Valeur stock</Text>
            <Text style={styles.statSubtext}>{products.length} produits</Text>
          </View>
        </View>
      </View>

      {stockAlerts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Alertes de stock</Text>
            <TouchableOpacity onPress={() => router.push('/admin/stock')} activeOpacity={0.8}>
              <Text style={styles.seeAllLink}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.alertBanner}>
            <AlertCircle size={20} color={Colors.error} />
            <Text style={styles.alertText}>
              {stockAlerts.length} produit(s) nécessitent votre attention
            </Text>
          </View>
          <View style={styles.alertsList}>
            {stockAlerts.slice(0, 3).map(alert => (
              <View key={alert.productId} style={styles.alertItem}>
                <View style={styles.alertDot} />
                <Text style={styles.alertItemText}>
                  {alert.productName} - {alert.currentStock} restant(s)
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionCard}
              onPress={action.onPress}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                <action.icon size={24} color={action.color} />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <ArrowRight size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transactions récentes</Text>
          <TouchableOpacity onPress={() => router.push('/admin/transactions')} activeOpacity={0.8}>
            <Text style={styles.seeAllLink}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        {stats.recentTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Aucune transaction récente</Text>
          </View>
        ) : (
          <View style={styles.transactionsList}>
            {stats.recentTransactions.map(transaction => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionName}>{transaction.productName}</Text>
                  <Text style={styles.transactionDate}>{formatDate(transaction.date)}</Text>
                </View>
                <View style={styles.transactionAmount}>
                  <Text style={[
                    styles.transactionValue,
                    { color: transaction.type === 'vente' ? '#4CAF50' : Colors.text }
                  ]}>
                    {transaction.type === 'vente' ? '+' : '-'}{formatPrice(transaction.amount)}
                  </Text>
                  <Text style={styles.transactionType}>{transaction.type}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  section: {
    padding: 16,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: -8,
  },
  seeAllLink: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  statSubtext: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 12,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    color: Colors.error,
    fontWeight: '600' as const,
  },
  alertsList: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.error,
  },
  alertItemText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
  },
  actionsGrid: {
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  transactionsList: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
    gap: 2,
  },
  transactionName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  transactionDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  transactionAmount: {
    alignItems: 'flex-end',
    gap: 2,
  },
  transactionValue: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  transactionType: {
    fontSize: 11,
    color: Colors.textSecondary,
    textTransform: 'capitalize' as const,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
