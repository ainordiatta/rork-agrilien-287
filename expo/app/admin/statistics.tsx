import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Stack } from 'expo-router';
import { useState, useMemo } from 'react';
import { TrendingUp, Package, DollarSign, Calendar, Award, BarChart2, TrendingDown, Minus } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useInventory } from '@/contexts/InventoryContext';

// #15 Indice de prix du marché — données de référence (ANSD / FAO)
const MARKET_PRICES: Record<string, { name: string; unit: string; refPrice: number; min: number; max: number; trend: 'up' | 'down' | 'stable'; emoji: string }> = {
  mil:       { name: 'Mil',         unit: 'kg',   refPrice: 210, min: 180, max: 250, trend: 'up',     emoji: '🌾' },
  arachide:  { name: 'Arachide',    unit: 'kg',   refPrice: 450, min: 380, max: 500, trend: 'stable', emoji: '🥜' },
  riz:       { name: 'Riz local',   unit: 'kg',   refPrice: 350, min: 300, max: 420, trend: 'down',   emoji: '🍚' },
  mais:      { name: 'Maïs',        unit: 'kg',   refPrice: 175, min: 140, max: 210, trend: 'up',     emoji: '🌽' },
  niebe:     { name: 'Niébé',       unit: 'kg',   refPrice: 600, min: 500, max: 720, trend: 'stable', emoji: '🫘' },
  tomate:    { name: 'Tomate',      unit: 'kg',   refPrice: 280, min: 150, max: 400, trend: 'down',   emoji: '🍅' },
  oignon:    { name: 'Oignon',      unit: 'kg',   refPrice: 190, min: 140, max: 260, trend: 'up',     emoji: '🧅' },
  manioc:    { name: 'Manioc',      unit: 'kg',   refPrice: 80,  min: 60,  max: 110, trend: 'stable', emoji: '🟫' },
};


const { width } = Dimensions.get('window');

type Period = '7d' | '30d' | '90d' | '1y';

export default function StatisticsScreen() {
  const { transactions, products } = useInventory();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('30d');

  const periodOptions: { value: Period; label: string; days: number }[] = [
    { value: '7d', label: '7 jours', days: 7 },
    { value: '30d', label: '30 jours', days: 30 },
    { value: '90d', label: '90 jours', days: 90 },
    { value: '1y', label: '1 an', days: 365 },
  ];

  const selectedDays = periodOptions.find((p) => p.value === selectedPeriod)?.days || 30;

  const stats = useMemo(() => {
    const now = new Date();
    const startDate = new Date(now.getTime() - selectedDays * 24 * 60 * 60 * 1000);

    const periodTransactions = transactions.filter(
      (t) => new Date(t.date) >= startDate
    );

    const sales = periodTransactions.filter((t) => t.type === 'vente');
    const totalRevenue = sales.reduce((sum, t) => sum + t.amount, 0);
    const totalOrders = sales.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const productSales = sales.reduce((acc, sale) => {
      const existing = acc.find((p) => p.productId === sale.productId);
      if (existing) {
        existing.quantity += sale.quantity;
        existing.revenue += sale.amount;
      } else {
        acc.push({
          productId: sale.productId,
          productName: sale.productName,
          quantity: sale.quantity,
          revenue: sale.amount,
        });
      }
      return acc;
    }, [] as { productId: string; productName: string; quantity: number; revenue: number }[]);

    const topProducts = productSales
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const revenueByMonth: { [key: string]: { revenue: number; orders: number } } = {};
    sales.forEach((sale) => {
      const date = new Date(sale.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!revenueByMonth[monthKey]) {
        revenueByMonth[monthKey] = { revenue: 0, orders: 0 };
      }
      revenueByMonth[monthKey].revenue += sale.amount;
      revenueByMonth[monthKey].orders += 1;
    });

    const revenueByPeriod = Object.entries(revenueByMonth)
      .map(([period, data]) => ({
        period,
        revenue: data.revenue,
        orders: data.orders,
      }))
      .sort((a, b) => a.period.localeCompare(b.period))
      .slice(-6);

    const categoryBreakdown = products.reduce((acc, product) => {
      const existing = acc.find((c) => c.category === product.category);
      const productRevenue = sales
        .filter((s) => s.productId === product.id)
        .reduce((sum, s) => sum + s.amount, 0);

      if (existing) {
        existing.revenue += productRevenue;
      } else {
        acc.push({
          category: product.category,
          revenue: productRevenue,
        });
      }
      return acc;
    }, [] as { category: string; revenue: number }[]);

    const totalCategoryRevenue = categoryBreakdown.reduce((sum, c) => sum + c.revenue, 0);
    const categoryWithPercentage = categoryBreakdown.map((c) => ({
      ...c,
      percentage: totalCategoryRevenue > 0 ? (c.revenue / totalCategoryRevenue) * 100 : 0,
    }));

    const conversionRate = totalOrders > 0
      ? Math.min(100, Math.round((totalOrders / Math.max(products.length, 1)) * 10))
      : 0;

    return {
      totalProducts: products.length,
      totalRevenue,
      totalOrders,
      averageOrderValue,
      conversionRate,
      topProducts,
      revenueByPeriod,
      categoryBreakdown: categoryWithPercentage.sort((a, b) => b.revenue - a.revenue),
    };
  }, [transactions, products, selectedDays]);

  const formatPrice = (price: number) => {
    return `${price.toLocaleString('fr-FR')} FCFA`;
  };

  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const maxRevenue = Math.max(...stats.revenueByPeriod.map((r) => r.revenue), 1);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Statistiques',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: '#fff',
        }}
      />

      <View style={styles.periodSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodScroll}>
          {periodOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.periodChip,
                selectedPeriod === option.value && styles.periodChipActive,
              ]}
              onPress={() => setSelectedPeriod(option.value)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.periodChipText,
                  selectedPeriod === option.value && styles.periodChipTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* #23 4ème KPI : Taux de conversion */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
            <Package size={24} color="#2196F3" />
            <Text style={styles.statValue}>{stats.totalProducts}</Text>
            <Text style={styles.statLabel}>Produits</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
            <DollarSign size={24} color="#4CAF50" />
            <Text style={styles.statValue}>{formatPrice(stats.totalRevenue)}</Text>
            <Text style={styles.statLabel}>Revenus</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
            <TrendingUp size={24} color="#FF9800" />
            <Text style={styles.statValue}>{stats.totalOrders}</Text>
            <Text style={styles.statLabel}>Commandes</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#F3E5F5' }]}>
            <Award size={24} color="#9C27B0" />
            <Text style={styles.statValue}>{formatPrice(stats.averageOrderValue)}</Text>
            <Text style={styles.statLabel}>Panier moyen</Text>
          </View>

          <View style={[styles.statCard, styles.statCardWide, { backgroundColor: '#E0F7FA' }]}>
            <BarChart2 size={24} color="#00ACC1" />
            <Text style={styles.statValue}>{stats.conversionRate}%</Text>
            <Text style={styles.statLabel}>Taux de conversion</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Revenus par période</Text>
          </View>
          <View style={styles.chartContainer}>
            {stats.revenueByPeriod.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Aucune donnée pour cette période</Text>
              </View>
            ) : (
              <View style={styles.chart}>
                {stats.revenueByPeriod.map((item, index) => {
                  const barHeight = (item.revenue / maxRevenue) * 150;
                  return (
                    <View key={index} style={styles.chartBar}>
                      <View style={styles.barContainer}>
                        <View
                          style={[
                            styles.bar,
                            { height: barHeight, backgroundColor: Colors.primary },
                          ]}
                        />
                      </View>
                      <Text style={styles.chartLabel}>{formatMonth(item.period)}</Text>
                      <Text style={styles.chartValue}>{item.orders}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Award size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Produits les plus vendus</Text>
          </View>
          {stats.topProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Aucune vente pour cette période</Text>
            </View>
          ) : (
            <View style={styles.topProductsList}>
              {stats.topProducts.map((product, index) => (
                <View key={product.productId} style={styles.topProductItem}>
                  <View style={styles.topProductRank}>
                    <Text style={styles.topProductRankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.topProductInfo}>
                    <Text style={styles.topProductName} numberOfLines={1}>
                      {product.productName}
                    </Text>
                    <Text style={styles.topProductQuantity}>
                      {product.quantity} unités vendues
                    </Text>
                  </View>
                  <Text style={styles.topProductRevenue}>
                    {formatPrice(product.revenue)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Package size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Revenus par catégorie</Text>
          </View>
          {stats.categoryBreakdown.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Aucune donnée disponible</Text>
            </View>
          ) : (
            <View style={styles.categoryList}>
              {stats.categoryBreakdown.map((category) => (
                <View key={category.category} style={styles.categoryItem}>
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryName}>{category.category}</Text>
                    <Text style={styles.categoryRevenue}>
                      {formatPrice(category.revenue)}
                    </Text>
                  </View>
                  <View style={styles.categoryBar}>
                    <View
                      style={[
                        styles.categoryBarFill,
                        { width: `${category.percentage}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.categoryPercentage}>
                    {category.percentage.toFixed(1)}%
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* #15 Indice prix inclus en bas */}
        <MarketPriceSection />
      </ScrollView>
    </View>
  );
}

function MarketPriceSection() {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <BarChart2 size={20} color={Colors.primary} />
        <Text style={styles.sectionTitle}>Indice prix du marché</Text>
      </View>
      <Text style={styles.priceIndexNote}>Source : ANSD / FAO (référence saisonnière)</Text>
      <View style={styles.priceIndexList}>
        {Object.values(MARKET_PRICES).map((item) => (
          <View key={item.name} style={styles.priceIndexRow}>
            <Text style={styles.priceEmoji}>{item.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.priceIndexName}>{item.name}</Text>
              <Text style={styles.priceIndexRange}>{item.min}–{item.max} FCFA/{item.unit}</Text>
            </View>
            <View style={styles.priceIndexRight}>
              <Text style={styles.priceIndexRef}>{item.refPrice} FCFA</Text>
              {item.trend === 'up'     && <TrendingUp   size={16} color="#EF4444" />}
              {item.trend === 'down'   && <TrendingDown size={16} color="#22C55E" />}
              {item.trend === 'stable' && <Minus        size={16} color="#F59E0B" />}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  periodSelector: {
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  periodScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  periodChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
    marginRight: 8,
  },
  periodChipActive: {
    backgroundColor: Colors.primary,
  },
  periodChipText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  periodChipTextActive: {
    color: Colors.surface,
  },
  content: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 44) / 2,
    padding: 16,
    borderRadius: 12,
    gap: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    padding: 16,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  chartContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    minHeight: 200,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 180,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
  },
  bar: {
    width: 24,
    borderRadius: 4,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  chartValue: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  topProductsList: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  topProductItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topProductRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topProductRankText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.surface,
  },
  topProductInfo: {
    flex: 1,
    gap: 2,
  },
  topProductName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  topProductQuantity: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  topProductRevenue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  categoryList: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  categoryItem: {
    gap: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  categoryRevenue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  categoryBar: {
    height: 8,
    backgroundColor: Colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  categoryPercentage: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
});
