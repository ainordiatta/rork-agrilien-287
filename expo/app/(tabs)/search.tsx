import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useMemo, useCallback } from 'react';
import { Search, SlidersHorizontal, Tag, Truck, ShoppingBag, Leaf, ChevronDown, ChevronUp, X, ArrowUpDown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CATEGORIES } from '@/constants/categories';
import { SPECIALTIES } from '@/constants/specialties';
import Colors from '@/constants/colors';

type FilterOption = {
  label: string;
  value: string;
};

const STATUT_ANNONCE: FilterOption[] = [
  { label: 'Disponible maintenant', value: 'disponible' },
  { label: 'Réservation (date à venir)', value: 'reservation' },
];

const TYPE_LIVRAISON: FilterOption[] = [
  { label: 'À récupérer sur place', value: 'surplace' },
  { label: 'Livraison', value: 'livraison' },
];

const ETAT_OPTIONS: FilterOption[] = [
  { label: 'Bio', value: 'bio' },
  { label: 'Standard', value: 'standard' },
  { label: 'Premium', value: 'premium' },
];

const MODE_REMISE_PRO: FilterOption[] = [
  { label: 'En main propre', value: 'mainpropre' },
  { label: 'Livraison standard', value: 'standard' },
  { label: 'Livraison express', value: 'express' },
];

const MODE_REMISE_PARTICULIER: FilterOption[] = [
  { label: 'En main propre', value: 'mainpropre' },
  { label: 'Envoi postal', value: 'postal' },
  { label: 'Point relais', value: 'relais' },
];

const TYPE_ANNONCE: FilterOption[] = [
  { label: 'Vente directe', value: 'vente' },
  { label: 'Vente en gros', value: 'gros' },
  { label: 'Précommande', value: 'precommande' },
];

type SectionKey = 'categories' | 'price' | 'availability' | 'quality' | 'delivery' | 'saleType' | 'specialties';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState<string>('');
  const [selectedCategorie, setSelectedCategorie] = useState<string>('');
  const [selectedSubcategorie, setSelectedSubcategorie] = useState<string>('');
  const [prixMin, setPrixMin] = useState<string>('');
  const [prixMax, setPrixMax] = useState<string>('');
  const [prixOrder, setPrixOrder] = useState<'croissant' | 'decroissant' | ''>('');
  const [statutAnnonce, setStatutAnnonce] = useState<string>('');
  const [etat, setEtat] = useState<string>('');
  const [modeRemisePro, setModeRemisePro] = useState<string>('');
  const [modeRemiseParticulier, setModeRemiseParticulier] = useState<string>('');
  const [typeAnnonce, setTypeAnnonce] = useState<string>('');
  const [typeLivraison, setTypeLivraison] = useState<string>('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
    categories: true,
    price: false,
    availability: false,
    quality: false,
    delivery: false,
    saleType: false,
    specialties: false,
  });

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategorie) count++;
    if (selectedSubcategorie) count++;
    if (prixMin || prixMax) count++;
    if (prixOrder) count++;
    if (statutAnnonce) count++;
    if (etat) count++;
    if (modeRemisePro) count++;
    if (modeRemiseParticulier) count++;
    if (typeAnnonce) count++;
    if (typeLivraison) count++;
    if (selectedSpecialties.length > 0) count++;
    return count;
  }, [selectedCategorie, selectedSubcategorie, prixMin, prixMax, prixOrder, statutAnnonce, etat, modeRemisePro, modeRemiseParticulier, typeAnnonce, typeLivraison, selectedSpecialties]);

  const availableSubcategories = useMemo(() => {
    if (!selectedCategorie) return [];
    const category = CATEGORIES.find(cat => cat.name === selectedCategorie);
    return category ? category.subcategories : [];
  }, [selectedCategorie]);

  const toggleSection = useCallback((section: SectionKey) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const handleCategorySelect = (categoryName: string) => {
    if (selectedCategorie === categoryName) {
      setSelectedCategorie('');
      setSelectedSubcategorie('');
    } else {
      setSelectedCategorie(categoryName);
      setSelectedSubcategorie('');
    }
  };

  const handleSubcategorySelect = (subcategoryName: string) => {
    setSelectedSubcategorie(selectedSubcategorie === subcategoryName ? '' : subcategoryName);
  };

  const handleClearAll = () => {
    setSearchText('');
    setSelectedCategorie('');
    setSelectedSubcategorie('');
    setPrixMin('');
    setPrixMax('');
    setPrixOrder('');
    setStatutAnnonce('');
    setEtat('');
    setModeRemisePro('');
    setModeRemiseParticulier('');
    setTypeAnnonce('');
    setTypeLivraison('');
    setSelectedSpecialties([]);
  };

  const handleSearch = () => {
    console.log('Recherche avec les filtres:', {
      searchText,
      selectedCategorie,
      selectedSubcategorie,
      prixMin,
      prixMax,
      prixOrder,
      statutAnnonce,
      etat,
      modeRemisePro,
      modeRemiseParticulier,
      typeAnnonce,
      typeLivraison,
      selectedSpecialties,
    });
  };

  const renderSectionHeader = (title: string, section: SectionKey, icon: React.ReactNode) => (
    <TouchableOpacity
      style={styles.sectionHeader}
      onPress={() => toggleSection(section)}
      activeOpacity={0.7}
    >
      <View style={styles.sectionHeaderLeft}>
        {icon}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {expandedSections[section] ? (
        <ChevronUp size={20} color={Colors.primary} />
      ) : (
        <ChevronDown size={20} color={Colors.textSecondary} />
      )}
    </TouchableOpacity>
  );

  const renderFilterChips = (
    options: FilterOption[],
    selectedValue: string,
    onSelect: (value: string) => void
  ) => (
    <View style={styles.chipGroup}>
      {options.map((option) => {
        const isActive = selectedValue === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.filterChip, isActive && styles.filterChipActive]}
            onPress={() => onSelect(isActive ? '' : option.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={[styles.headerContainer, { paddingTop: insets.top + 8 }]}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.headerTitle}>Recherche</Text>
        <Text style={styles.headerSubtitle}>Trouvez les meilleurs produits agricoles</Text>

        <View style={styles.searchBarContainer}>
          <Search size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un produit, une ville..."
            placeholderTextColor={Colors.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <X size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {activeFilterCount > 0 && (
          <View style={styles.activeFiltersRow}>
            <View style={styles.filterBadge}>
              <SlidersHorizontal size={14} color="#fff" />
              <Text style={styles.filterBadgeText}>{activeFilterCount} filtre{activeFilterCount > 1 ? 's' : ''}</Text>
            </View>
            <TouchableOpacity onPress={handleClearAll} style={styles.clearAllBtn}>
              <Text style={styles.clearAllText}>Tout effacer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.filtersContainer}>
          {renderSectionHeader('Catégories', 'categories', <Tag size={18} color={Colors.primary} />)}
          {expandedSections.categories && (
            <View style={styles.sectionContent}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {CATEGORIES.map((cat) => {
                  const isActive = selectedCategorie === cat.name;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                      onPress={() => handleCategorySelect(cat.name)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
                        {cat.name}
                      </Text>
                      {isActive && <X size={14} color="#fff" />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {!!selectedCategorie && availableSubcategories.length > 0 && (
                <View style={styles.subcategorySection}>
                  <Text style={styles.subcategoryLabel}>Sous-catégories</Text>
                  <View style={styles.chipGroup}>
                    {availableSubcategories.map((sub, index) => {
                      const isActive = selectedSubcategorie === sub;
                      return (
                        <TouchableOpacity
                          key={index}
                          style={[styles.subCategoryChip, isActive && styles.subCategoryChipActive]}
                          onPress={() => handleSubcategorySelect(sub)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.subCategoryChipText, isActive && styles.subCategoryChipTextActive]}>
                            {sub}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          )}

          <View style={styles.sectionDivider} />

          {renderSectionHeader('Fourchette de prix', 'price', <ArrowUpDown size={18} color={Colors.primary} />)}
          {expandedSections.price && (
            <View style={styles.sectionContent}>
              <View style={styles.priceInputsRow}>
                <View style={styles.priceInputWrapper}>
                  <Text style={styles.priceLabel}>Min (FCFA)</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="0"
                    placeholderTextColor="#aaa"
                    value={prixMin}
                    onChangeText={setPrixMin}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.priceSeparator}>
                  <Text style={styles.priceSepText}>—</Text>
                </View>
                <View style={styles.priceInputWrapper}>
                  <Text style={styles.priceLabel}>Max (FCFA)</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="∞"
                    placeholderTextColor="#aaa"
                    value={prixMax}
                    onChangeText={setPrixMax}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View style={styles.priceOrderRow}>
                <TouchableOpacity
                  style={[styles.priceOrderBtn, prixOrder === 'croissant' && styles.priceOrderBtnActive]}
                  onPress={() => setPrixOrder(prixOrder === 'croissant' ? '' : 'croissant')}
                >
                  <Text style={[styles.priceOrderText, prixOrder === 'croissant' && styles.priceOrderTextActive]}>↑ Croissant</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.priceOrderBtn, prixOrder === 'decroissant' && styles.priceOrderBtnActive]}
                  onPress={() => setPrixOrder(prixOrder === 'decroissant' ? '' : 'decroissant')}
                >
                  <Text style={[styles.priceOrderText, prixOrder === 'decroissant' && styles.priceOrderTextActive]}>↓ Décroissant</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.sectionDivider} />

          {renderSectionHeader('Disponibilité', 'availability', <ShoppingBag size={18} color={Colors.primary} />)}
          {expandedSections.availability && (
            <View style={styles.sectionContent}>
              {renderFilterChips(STATUT_ANNONCE, statutAnnonce, setStatutAnnonce)}
            </View>
          )}

          <View style={styles.sectionDivider} />

          {renderSectionHeader('Qualité', 'quality', <Leaf size={18} color={Colors.primary} />)}
          {expandedSections.quality && (
            <View style={styles.sectionContent}>
              {renderFilterChips(ETAT_OPTIONS, etat, setEtat)}
            </View>
          )}

          <View style={styles.sectionDivider} />

          {renderSectionHeader('Livraison & Remise', 'delivery', <Truck size={18} color={Colors.primary} />)}
          {expandedSections.delivery && (
            <View style={styles.sectionContent}>
              <Text style={styles.subSectionLabel}>Type de livraison</Text>
              {renderFilterChips(TYPE_LIVRAISON, typeLivraison, setTypeLivraison)}

              <Text style={[styles.subSectionLabel, { marginTop: 16 }]}>Remise professionnels</Text>
              {renderFilterChips(MODE_REMISE_PRO, modeRemisePro, setModeRemisePro)}

              <Text style={[styles.subSectionLabel, { marginTop: 16 }]}>Remise particuliers</Text>
              {renderFilterChips(MODE_REMISE_PARTICULIER, modeRemiseParticulier, setModeRemiseParticulier)}
            </View>
          )}

          <View style={styles.sectionDivider} />

          {renderSectionHeader('Type de vente', 'saleType', <ShoppingBag size={18} color={Colors.primary} />)}
          {expandedSections.saleType && (
            <View style={styles.sectionContent}>
              {renderFilterChips(TYPE_ANNONCE, typeAnnonce, setTypeAnnonce)}
            </View>
          )}

          <View style={styles.sectionDivider} />

          {renderSectionHeader('Spécialités producteur', 'specialties', <Leaf size={18} color={Colors.primary} />)}
          {expandedSections.specialties && (
            <View style={styles.sectionContent}>
              <View style={styles.chipGroup}>
                {SPECIALTIES.map((specialty) => {
                  const isSelected = selectedSpecialties.includes(specialty);
                  return (
                    <TouchableOpacity
                      key={specialty}
                      style={[styles.filterChip, isSelected && styles.filterChipActive]}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedSpecialties(selectedSpecialties.filter(s => s !== specialty));
                        } else {
                          setSelectedSpecialties([...selectedSpecialties, specialty]);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                        {specialty}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        <View style={styles.searchButtonContainer}>
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch} activeOpacity={0.85}>
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.searchButtonGradient}
            >
              <Search size={20} color="#fff" />
              <Text style={styles.searchButtonText}>Rechercher</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 4,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  activeFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600' as const,
  },
  clearAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearAllText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '600' as const,
    textDecorationLine: 'underline',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  filtersContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  sectionContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 20,
  },
  categoryScroll: {
    marginHorizontal: -4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F7F1',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: '#E0EDE2',
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  subcategorySection: {
    marginTop: 14,
  },
  subcategoryLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subCategoryChip: {
    backgroundColor: '#FFF5EE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFE0CC',
  },
  subCategoryChipActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  subCategoryChipText: {
    color: Colors.secondary,
    fontSize: 13,
    fontWeight: '500' as const,
  },
  subCategoryChipTextActive: {
    color: '#fff',
    fontWeight: '600' as const,
  },
  filterChip: {
    backgroundColor: Colors.background,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '500' as const,
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600' as const,
  },
  subSectionLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  priceInputsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 14,
  },
  priceInputWrapper: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
    marginBottom: 6,
  },
  priceInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    textAlign: 'center',
  },
  priceSeparator: {
    paddingBottom: 12,
  },
  priceSepText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  priceOrderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  priceOrderBtn: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  priceOrderBtnActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  priceOrderText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  priceOrderTextActive: {
    color: '#fff',
  },
  searchButtonContainer: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  searchButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  searchButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700' as const,
  },
});
