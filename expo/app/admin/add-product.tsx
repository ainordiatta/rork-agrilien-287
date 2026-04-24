import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Image, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Save, ImagePlus, X, ChevronDown, Calendar, Wand2 } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import Colors from '@/constants/colors';
import { useInventory } from '@/contexts/InventoryContext';
import { MeasurementUnit, ProductQuality, DeliveryOption } from '@/types';
import { MEASUREMENT_UNITS, PRODUCT_QUALITY, DELIVERY_OPTIONS } from '@/constants/units';
import { useApp } from '@/contexts/AppContext';

export default function AddProductScreen() {
  const router = useRouter();
  const { addProduct, categories, getSubcategoriesForCategory } = useInventory();
  const { user, updateUser } = useApp();
  
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [unit, setUnit] = useState<MeasurementUnit>('kg');
  const [category, setCategory] = useState<string>('');
  const [subcategory, setSubcategory] = useState<string>('');
  const [quality, setQuality] = useState<ProductQuality>('standard');
  const [availabilityDate, setAvailabilityDate] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>('livraison_et_sur_place');
  const [minStockLevel, setMinStockLevel] = useState<string>('5');
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState<boolean>(false);
  const [subcategoryModalVisible, setSubcategoryModalVisible] = useState<boolean>(false);
  const [unitModalVisible, setUnitModalVisible] = useState<boolean>(false);
  const [qualityModalVisible, setQualityModalVisible] = useState<boolean>(false);
  const [deliveryModalVisible, setDeliveryModalVisible] = useState<boolean>(false);
  const [isAIGenerating, setIsAIGenerating] = useState<boolean>(false);

  const availableSubcategories = useMemo(() => {
    return getSubcategoriesForCategory(category);
  }, [category, getSubcategoriesForCategory]);

  const pickImage = async () => {
    try {
      if (Platform.OS !== 'web') {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert('Permission requise', 'Veuillez autoriser l\'accès à la galerie');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImages([...images, result.assets[0].uri]);
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom du produit est requis');
      return;
    }
    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
      Alert.alert('Erreur', 'Le prix doit être un nombre positif');
      return;
    }
    if (!quantity.trim() || isNaN(Number(quantity)) || Number(quantity) < 0) {
      Alert.alert('Erreur', 'La quantité doit être un nombre positif ou nul');
      return;
    }
    if (!category.trim()) {
      Alert.alert('Erreur', 'La catégorie est requise');
      return;
    }

    setIsSubmitting(true);
    try {
      await addProduct({
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        quantity: Number(quantity),
        unit: unit,
        category: category.trim(),
        subcategory: subcategory.trim() || undefined,
        quality: quality,
        availabilityDate: availabilityDate ? availabilityDate.toISOString().split('T')[0] : undefined,
        deliveryOption: deliveryOption,
        minStockLevel: Number(minStockLevel) || 5,
        images: images,
      });

      Alert.alert('Succès', 'Produit ajouté avec succès', [
        { 
          text: 'OK', 
          onPress: () => {
            setName('');
            setDescription('');
            setPrice('');
            setQuantity('');
            setUnit('kg');
            setCategory('');
            setSubcategory('');
            setQuality('standard');
            setAvailabilityDate(undefined);
            setDeliveryOption('livraison_et_sur_place');
            setMinStockLevel('5');
            setImages([]);
            setIsSubmitting(false);
            router.back();
          }
        }
      ]);
    } catch {
      Alert.alert('Erreur', 'Impossible d\'ajouter le produit');
      setIsSubmitting(false);
    }
  };

  const handleAIGeneration = () => {
    if (!user) return;
    
    // Check Freemium logic
    const generationCount = user.aiGenerationsCount || 0;
    if (!user.isPremium && generationCount >= 3) {
      Alert.alert(
        'Limite atteinte',
        'Vous avez utilisé vos 3 générations gratuites. Passez à AgriLien Premium pour générer en illimité.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Devenir Premium', onPress: () => router.push('/premium') }
        ]
      );
      return;
    }

    setIsAIGenerating(true);
    // Simulate AI generation delay
    setTimeout(() => {
      setName('Mangues Kent Extra (Bio)');
      setDescription('Mangues juteuses et sucrées de la région des Niayes. Parfaites pour l\'exportation ou la consommation locale. Récoltées le matin même pour une fraîcheur optimale.');
      setPrice('2500');
      setQuantity('150');
      setCategory('Fruits');
      setUnit('kg');
      
      // Update generation count for free users
      if (!user.isPremium) {
        updateUser({ ...user, aiGenerationsCount: generationCount + 1 });
      }
      
      setIsAIGenerating(false);
      Alert.alert('Succès', 'Votre fiche produit a été générée par l\'IA avec succès !');
    }, 2500);
  };

  const handleCategorySelect = (categoryName: string) => {
    setCategory(categoryName);
    setSubcategory('');
    setCategoryModalVisible(false);
  };

  const handleSubcategorySelect = (subcategoryName: string) => {
    setSubcategory(subcategoryName);
    setSubcategoryModalVisible(false);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.keyboardView} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      
      {/* AI Generator Banner */}
      <TouchableOpacity 
        style={styles.aiBanner} 
        onPress={handleAIGeneration}
        disabled={isAIGenerating}
        activeOpacity={0.8}
      >
        <View style={styles.aiBannerIcon}>
          <Wand2 size={24} color="#FFD700" />
        </View>
        <View style={styles.aiBannerTextContainer}>
          <Text style={styles.aiBannerTitle}>Générer avec l'IA</Text>
          <Text style={styles.aiBannerSubtitle}>
            {isAIGenerating 
              ? 'Analyse en cours...' 
              : (!user?.isPremium ? `Il vous reste ${3 - (user?.aiGenerationsCount || 0)} essai(s) gratuit(s)` : 'Génération illimitée avec Premium')}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Photo(s) du produit</Text>
          <View style={styles.imagesContainer}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.productImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                  activeOpacity={0.8}
                >
                  <X size={16} color={Colors.surface} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addImageButton}
              onPress={pickImage}
              activeOpacity={0.8}
            >
              <ImagePlus size={32} color={Colors.textSecondary} />
              <Text style={styles.addImageText}>Ajouter</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Nom du produit *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ex: Tissu Wax Premium"
            placeholderTextColor={Colors.textSecondary}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Décrivez le produit..."
            placeholderTextColor={Colors.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, styles.flex1]}>
            <Text style={styles.label}>Prix (FCFA) *</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="0"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.field, styles.flex1]}>
            <Text style={styles.label}>Quantité *</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="0"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Unité de vente *</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setUnitModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownButtonText}>
              {MEASUREMENT_UNITS[unit]}
            </Text>
            <ChevronDown size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Catégorie *</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setCategoryModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.dropdownButtonText, !category && styles.dropdownButtonPlaceholder]}>
              {category || 'Sélectionnez une catégorie'}
            </Text>
            <ChevronDown size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {!!category && availableSubcategories.length > 0 && (
          <View style={styles.field}>
            <Text style={styles.label}>Sous-catégorie</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setSubcategoryModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.dropdownButtonText, !subcategory && styles.dropdownButtonPlaceholder]}>
                {subcategory || 'Sélectionnez une sous-catégorie'}
              </Text>
              <ChevronDown size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>Qualité du produit</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setQualityModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownButtonText}>
              {PRODUCT_QUALITY[quality]}
            </Text>
            <ChevronDown size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Date de disponibilité (optionnelle)</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.8}
          >
            <Calendar size={20} color={Colors.textSecondary} />
            <Text style={[styles.dateButtonText, !availabilityDate && styles.dateButtonPlaceholder]}>
              {availabilityDate 
                ? availabilityDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                : 'Sélectionner une date'
              }
            </Text>
            {availabilityDate && (
              <TouchableOpacity
                onPress={() => setAvailabilityDate(undefined)}
                activeOpacity={0.8}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
          <Text style={styles.hint}>
            Si le produit n&apos;est pas disponible immédiatement
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Option de récupération</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setDeliveryModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownButtonText}>
              {DELIVERY_OPTIONS[deliveryOption]}
            </Text>
            <ChevronDown size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Niveau de stock minimum</Text>
          <TextInput
            style={styles.input}
            value={minStockLevel}
            onChangeText={setMinStockLevel}
            placeholder="5"
            placeholderTextColor={Colors.textSecondary}
            keyboardType="numeric"
          />
          <Text style={styles.hint}>
            Vous recevrez une alerte lorsque le stock atteindra ce niveau
          </Text>
        </View>
      </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          <Save size={20} color={Colors.surface} />
          <Text style={styles.saveButtonText}>
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={categoryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionnez une catégorie</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)} activeOpacity={0.8}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.modalItem, category === cat.name && styles.modalItemActive]}
                  onPress={() => handleCategorySelect(cat.name)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modalItemText, category === cat.name && styles.modalItemTextActive]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={subcategoryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSubcategoryModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionnez une sous-catégorie</Text>
              <TouchableOpacity onPress={() => setSubcategoryModalVisible(false)} activeOpacity={0.8}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {availableSubcategories.map((sub, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.modalItem, subcategory === sub && styles.modalItemActive]}
                  onPress={() => handleSubcategorySelect(sub)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modalItemText, subcategory === sub && styles.modalItemTextActive]}>
                    {sub}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={unitModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setUnitModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionnez une unité</Text>
              <TouchableOpacity onPress={() => setUnitModalVisible(false)} activeOpacity={0.8}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {(Object.keys(MEASUREMENT_UNITS) as MeasurementUnit[]).map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[styles.modalItem, unit === u && styles.modalItemActive]}
                  onPress={() => {
                    setUnit(u);
                    setUnitModalVisible(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modalItemText, unit === u && styles.modalItemTextActive]}>
                    {MEASUREMENT_UNITS[u]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={qualityModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setQualityModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionnez la qualité</Text>
              <TouchableOpacity onPress={() => setQualityModalVisible(false)} activeOpacity={0.8}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {(Object.keys(PRODUCT_QUALITY) as ProductQuality[]).map((q) => (
                <TouchableOpacity
                  key={q}
                  style={[styles.modalItem, quality === q && styles.modalItemActive]}
                  onPress={() => {
                    setQuality(q);
                    setQualityModalVisible(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modalItemText, quality === q && styles.modalItemTextActive]}>
                    {PRODUCT_QUALITY[q]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={deliveryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDeliveryModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Option de récupération</Text>
              <TouchableOpacity onPress={() => setDeliveryModalVisible(false)} activeOpacity={0.8}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {(Object.keys(DELIVERY_OPTIONS) as DeliveryOption[]).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.modalItem, deliveryOption === d && styles.modalItemActive]}
                  onPress={() => {
                    setDeliveryOption(d);
                    setDeliveryModalVisible(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modalItemText, deliveryOption === d && styles.modalItemTextActive]}>
                    {DELIVERY_OPTIONS[d]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={availabilityDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (event.type === 'set' && selectedDate) {
              setAvailabilityDate(selectedDate);
            }
            if (Platform.OS === 'android') {
              setShowDatePicker(false);
            }
          }}
          minimumDate={new Date()}
        />
      )}

      {Platform.OS === 'ios' && showDatePicker && (
        <Modal
          visible={showDatePicker}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Sélectionner une date</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)} activeOpacity={0.8}>
                  <Text style={styles.modalDoneButton}>Terminé</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={availabilityDate || new Date()}
                mode="date"
                display="spinner"
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    setAvailabilityDate(selectedDate);
                  }
                }}
                minimumDate={new Date()}
                style={styles.iosDatePicker}
              />
            </View>
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 16,
  },
  aiBannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiBannerTextContainer: {
    flex: 1,
  },
  aiBannerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  aiBannerSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
  },
  form: {
    gap: 20,
  },
  field: {
    gap: 8,
  },
  flex1: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  hint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dropdownButtonText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  dropdownButtonPlaceholder: {
    color: Colors.textSecondary,
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 16,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageWrapper: {
    position: 'relative' as const,
    width: 100,
    height: 100,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
  removeImageButton: {
    position: 'absolute' as const,
    top: 4,
    right: 4,
    backgroundColor: Colors.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed' as const,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  addImageText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  modalList: {
    maxHeight: 500,
  },
  modalItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  modalItemActive: {
    backgroundColor: Colors.primary,
  },
  modalItemText: {
    fontSize: 16,
    color: Colors.text,
  },
  modalItemTextActive: {
    color: Colors.surface,
    fontWeight: '600' as const,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateButtonText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  dateButtonPlaceholder: {
    color: Colors.textSecondary,
  },
  modalDoneButton: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  iosDatePicker: {
    width: '100%',
    backgroundColor: Colors.surface,
  },
});
