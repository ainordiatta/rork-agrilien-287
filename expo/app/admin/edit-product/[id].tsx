import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Image, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Save, Trash2, ImagePlus, X, ChevronDown } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Colors from '@/constants/colors';
import { useInventory } from '@/contexts/InventoryContext';

export default function EditProductScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { products, updateProduct, deleteProduct, categories, getSubcategoriesForCategory } = useInventory();
  
  const product = products.find(p => p.id === id);

  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [subcategory, setSubcategory] = useState<string>('');
  const [minStockLevel, setMinStockLevel] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState<boolean>(false);
  const [subcategoryModalVisible, setSubcategoryModalVisible] = useState<boolean>(false);

  const availableSubcategories = useMemo(() => {
    return getSubcategoriesForCategory(category);
  }, [category, getSubcategoriesForCategory]);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description);
      setPrice(product.price.toString());
      setQuantity(product.quantity.toString());
      setCategory(product.category);
      setSubcategory(product.subcategory || '');
      setMinStockLevel(product.minStockLevel.toString());
      setImages(product.images || []);
    }
  }, [product]);

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
    } catch (error) {
      console.error('Error picking image:', error);
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
      await updateProduct(id, {
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        quantity: Number(quantity),
        category: category.trim(),
        subcategory: subcategory.trim() || undefined,
        minStockLevel: Number(minStockLevel) || 5,
        images: images,
      });

      Alert.alert('Succès', 'Produit modifié avec succès', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert('Erreur', 'Impossible de modifier le produit');
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(id);
              Alert.alert('Succès', 'Produit supprimé', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Erreur', 'Impossible de supprimer le produit');
            }
          },
        },
      ]
    );
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

  if (!product) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Produit introuvable</Text>
      </View>
    );
  }

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
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.8}
        >
          <Trash2 size={20} color={Colors.error} />
          <Text style={styles.deleteButtonText}>Supprimer le produit</Text>
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
    gap: 12,
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
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.error,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 60,
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
});
