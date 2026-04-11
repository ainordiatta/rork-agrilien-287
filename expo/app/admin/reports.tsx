import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { TrendingUp, TrendingDown, DollarSign, Package, FileText, Download, Home } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useInventory } from '@/contexts/InventoryContext';

export default function ReportsScreen() {
  const router = useRouter();
  const { products, transactions, totalValue } = useInventory();

  const stats = useMemo(() => {
    const sales = transactions.filter(t => t.type === 'vente');
    const purchases = transactions.filter(t => t.type === 'achat');
    
    const totalSales = sales.reduce((sum, t) => sum + t.amount, 0);
    const totalPurchases = purchases.reduce((sum, t) => sum + t.amount, 0);
    const totalRevenue = totalSales - totalPurchases;
    
    const lowStockProducts = products.filter(p => p.quantity <= p.minStockLevel);
    const outOfStockProducts = products.filter(p => p.quantity === 0);

    const categoriesStats = products.reduce((acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = {
          count: 0,
          value: 0,
        };
      }
      acc[product.category].count += 1;
      acc[product.category].value += product.price * product.quantity;
      return acc;
    }, {} as Record<string, { count: number; value: number }>);

    return {
      totalSales,
      totalPurchases,
      totalRevenue,
      salesCount: sales.length,
      purchasesCount: purchases.length,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      categoriesStats,
    };
  }, [products, transactions]);

  const formatPrice = (price: number) => {
    return `${price.toLocaleString('fr-FR')} FCFA`;
  };

  const handleExport = async (format: 'csv' | 'pdf' | 'excel') => {
    try {
      let content = '';
      let filename = '';
      let mimeType = '';

      if (format === 'csv') {
        content = generateCSVReport();
        filename = `rapport-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
      } else if (format === 'pdf' || format === 'excel') {
        alert(`Export en ${format.toUpperCase()} - Fonctionnalité à venir`);
        return;
      }

      if (Platform.OS === 'web') {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        alert('Rapport téléchargé avec succès!');
      } else {
        alert('Le téléchargement est uniquement disponible sur le web pour le moment');
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export du rapport');
    }
  };

  const generateCSVReport = () => {
    const lines = [];
    
    lines.push('RAPPORT FINANCIER');
    lines.push(`Date: ${new Date().toLocaleDateString('fr-FR')}`);
    lines.push('');
    
    lines.push('VUE D\'ENSEMBLE FINANCIÈRE');
    lines.push('Indicateur,Valeur,Transactions');
    lines.push(`Total des ventes,${stats.totalSales} FCFA,${stats.salesCount}`);
    lines.push(`Total des achats,${stats.totalPurchases} FCFA,${stats.purchasesCount}`);
    lines.push(`Bénéfice net,${stats.totalRevenue} FCFA,`);
    lines.push(`Valeur du stock,${totalValue} FCFA,${products.length}`);
    lines.push('');
    
    lines.push('ÉTAT DES STOCKS');
    lines.push('Type,Nombre');
    lines.push(`Stock faible,${stats.lowStockCount}`);
    lines.push(`Rupture de stock,${stats.outOfStockCount}`);
    lines.push('');
    
    lines.push('STATISTIQUES PAR CATÉGORIE');
    lines.push('Catégorie,Nombre de produits,Valeur');
    Object.entries(stats.categoriesStats).forEach(([category, data]) => {
      lines.push(`${category},${data.count},${data.value} FCFA`);
    });
    lines.push('');
    
    lines.push('DÉTAIL DES TRANSACTIONS');
    lines.push('Date,Type,Produit,Quantité,Montant,Notes');
    transactions.forEach(t => {
      const date = new Date(t.date).toLocaleString('fr-FR');
      const notes = t.notes?.replace(/,/g, ';') || '';
      lines.push(`${date},${t.type},${t.productName},${t.quantity},${t.amount} FCFA,${notes}`);
    });
    
    return lines.join('\n');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.push('/(tabs)')}
        activeOpacity={0.8}
      >
        <Home size={20} color={Colors.surface} />
        <Text style={styles.backButtonText}>Retour à l&apos;accueil</Text>
      </TouchableOpacity>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vue d&apos;ensemble financière</Text>
          
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#E3F2FD' }]}>
              <TrendingUp size={24} color="#2196F3" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>Total des ventes</Text>
              <Text style={styles.statValue}>{formatPrice(stats.totalSales)}</Text>
              <Text style={styles.statSubtext}>{stats.salesCount} transaction(s)</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#FFF3E0' }]}>
              <TrendingDown size={24} color="#FF9800" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>Total des achats</Text>
              <Text style={styles.statValue}>{formatPrice(stats.totalPurchases)}</Text>
              <Text style={styles.statSubtext}>{stats.purchasesCount} transaction(s)</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#E8F5E9' }]}>
              <DollarSign size={24} color="#4CAF50" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>Bénéfice net</Text>
              <Text style={[
                styles.statValue,
                { color: stats.totalRevenue >= 0 ? '#4CAF50' : Colors.error }
              ]}>
                {formatPrice(stats.totalRevenue)}
              </Text>
              <Text style={styles.statSubtext}>
                {stats.totalRevenue >= 0 ? 'Positif' : 'Négatif'}
              </Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#F3E5F5' }]}>
              <Package size={24} color="#9C27B0" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>Valeur du stock</Text>
              <Text style={styles.statValue}>{formatPrice(totalValue)}</Text>
              <Text style={styles.statSubtext}>{products.length} produit(s)</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>État des stocks</Text>
          
          <View style={styles.row}>
            <View style={[styles.smallCard, { borderLeftColor: '#FF9800', borderLeftWidth: 4 }]}>
              <Text style={styles.smallCardValue}>{stats.lowStockCount}</Text>
              <Text style={styles.smallCardLabel}>Stock faible</Text>
            </View>
            <View style={[styles.smallCard, { borderLeftColor: Colors.error, borderLeftWidth: 4 }]}>
              <Text style={styles.smallCardValue}>{stats.outOfStockCount}</Text>
              <Text style={styles.smallCardLabel}>Rupture</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Par catégorie</Text>
          {Object.entries(stats.categoriesStats).map(([category, data]) => (
            <View key={category} style={styles.categoryCard}>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{category}</Text>
                <View style={styles.categoryStats}>
                  <Text style={styles.categoryValue}>{data.count} produits</Text>
                  <Text style={styles.categorySeparator}>•</Text>
                  <Text style={styles.categoryValue}>{formatPrice(data.value)}</Text>
                </View>
              </View>
              <View style={styles.categoryProgress}>
                <View
                  style={[
                    styles.categoryProgressBar,
                    { width: `${Math.min((data.value / totalValue) * 100, 100)}%` }
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exporter les rapports</Text>
          <Text style={styles.sectionDescription}>
            Générez des rapports détaillés de vos ventes et achats
          </Text>
          
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => handleExport('csv')}
            activeOpacity={0.8}
          >
            <FileText size={20} color={Colors.primary} />
            <Text style={styles.exportButtonText}>Exporter en CSV</Text>
            <Download size={18} color={Colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => handleExport('pdf')}
            activeOpacity={0.8}
          >
            <FileText size={20} color={Colors.primary} />
            <Text style={styles.exportButtonText}>Exporter en PDF</Text>
            <Download size={18} color={Colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => handleExport('excel')}
            activeOpacity={0.8}
          >
            <FileText size={20} color={Colors.primary} />
            <Text style={styles.exportButtonText}>Exporter en Excel</Text>
            <Download size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  statCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statInfo: {
    flex: 1,
    gap: 4,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  smallCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  smallCardValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  smallCardLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  categoryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  categoryInfo: {
    gap: 4,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  categoryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryValue: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  categorySeparator: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  categoryProgress: {
    height: 6,
    backgroundColor: Colors.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  categoryProgressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  exportButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
    marginLeft: 12,
  },
});
