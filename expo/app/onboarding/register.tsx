import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, Image, Switch, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import Colors from '@/constants/colors';
import { UserRole, AreaUnit, ProductionMode, ProductionSeason } from '@/types';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ChevronDown, X, Eye, EyeOff } from 'lucide-react-native';
import { SPECIALTIES } from '@/constants/specialties';
import { LinearGradient } from 'expo-linear-gradient';

export default function RegisterScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role: UserRole }>();
  const { signUp, signUpLoading } = useAuth();
  const { selectedCountry } = useApp();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    name: '',
    email: '',
    phone: '',
    city: '',
    password: '',
    confirmPassword: '',
    ownerFirstName: '',
    ownerLastName: '',
    region: '',
    department: '',
    farmArea: '',
    cooperativeName: '',
  });

  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [showSpecialtyPicker, setShowSpecialtyPicker] = useState(false);
  const [shopPhoto, setShopPhoto] = useState<string | null>(null);
  const [areaUnit, setAreaUnit] = useState<AreaUnit>('hectares');
  const [showAreaUnitPicker, setShowAreaUnitPicker] = useState(false);
  const [productionMode, setProductionMode] = useState<ProductionMode>('traditionnel');
  const [showProductionModePicker, setShowProductionModePicker] = useState(false);
  const [selectedSeasons, setSelectedSeasons] = useState<ProductionSeason[]>([]);
  const [showSeasonsPicker, setShowSeasonsPicker] = useState(false);
  const [isCooperativeMember, setIsCooperativeMember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isShop = role === 'producteur';

  const pickImage = async () => {
    try {
      if (Platform.OS !== 'web') {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (!permissionResult.granted) {
          Alert.alert('Permission requise', 'Veuillez autoriser l\'accès à la galerie pour ajouter une photo');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setShopPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const takePhoto = async () => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert('Non disponible', 'La caméra n\'est pas disponible sur le web. Utilisez la galerie.');
        return;
      }

      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission requise', 'Veuillez autoriser l\'accès à la caméra pour prendre une photo');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setShopPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo');
    }
  };

  const handlePhotoAction = () => {
    Alert.alert(
      'Photo de l\u2019exploitation',
      'Choisissez une option',
      [
        { text: 'Galerie', onPress: pickImage },
        { text: 'Appareil photo', onPress: takePhoto },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const handleRegister = async () => {
    if (!formData.email || !formData.phone || !formData.password || !formData.confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (isShop && !formData.name) {
      Alert.alert('Erreur', 'Veuillez indiquer le nom de votre exploitation');
      return;
    }

    if (isShop && (!formData.ownerFirstName || !formData.ownerLastName)) {
      Alert.alert('Erreur', 'Veuillez indiquer le nom et prénom du propriétaire');
      return;
    }

    if (isShop && (!formData.region || !formData.department)) {
      Alert.alert('Erreur', 'Veuillez indiquer la région et le département');
      return;
    }

    if (isShop && !formData.farmArea) {
      Alert.alert('Erreur', 'Veuillez indiquer la superficie de l\'exploitation');
      return;
    }

    if (isShop && selectedSeasons.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins une période de production');
      return;
    }

    if (isShop && isCooperativeMember && !formData.cooperativeName) {
      Alert.alert('Erreur', 'Veuillez indiquer le nom de la coopérative');
      return;
    }

    if (!isShop && (!formData.firstName || !formData.lastName)) {
      Alert.alert('Erreur', 'Veuillez indiquer votre nom et prénom');
      return;
    }

    if (isShop && selectedSpecialties.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins une spécialité');
      return;
    }

    if (!isShop && !formData.city) {
      Alert.alert('Erreur', 'Veuillez indiquer votre ville');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    const displayName = isShop ? formData.name : `${formData.firstName} ${formData.lastName}`;

    try {
      console.log('[Register] Signing up with Supabase:', formData.email);
      await signUp({
        email: formData.email.trim(),
        password: formData.password,
        role: role || 'acheteur',
        country: selectedCountry,
        name: displayName,
        phone: formData.phone,
        city: formData.city || '',
        firstName: isShop ? formData.ownerFirstName : formData.firstName,
        lastName: isShop ? formData.ownerLastName : formData.lastName,
        photo: shopPhoto || undefined,
        shopPhoto: shopPhoto || undefined,
        specialties: isShop ? selectedSpecialties : undefined,
        shopInfo: isShop ? {
          name: formData.name,
          specialties: selectedSpecialties,
          city: formData.city,
          ownerFirstName: formData.ownerFirstName,
          ownerLastName: formData.ownerLastName,
          region: formData.region,
          department: formData.department,
          farmArea: parseFloat(formData.farmArea) || 0,
          areaUnit,
          productionMode,
          productionSeasons: selectedSeasons,
          isCooperativeMember,
          cooperativeName: isCooperativeMember ? formData.cooperativeName : undefined,
        } : undefined,
        clientInfo: !isShop ? {
          firstName: formData.firstName,
          lastName: formData.lastName,
          city: formData.city,
        } : undefined,
      });

      console.log('[Register] Sign up successful');
      Alert.alert(
        'Compte créé !',
        'Votre compte a été créé avec succès. Vérifiez votre email si une confirmation est requise.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error: unknown) {
      console.error('[Register] Sign up error:', error);
      const message = error instanceof Error ? error.message : 'Une erreur est survenue';

      if (message.includes('already registered') || message.includes('already been registered')) {
        Alert.alert('Erreur', 'Un compte existe déjà avec cet email. Veuillez vous connecter.');
      } else if (message.includes('password')) {
        Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères.');
      } else {
        Alert.alert('Erreur', message);
      }
    }
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
      <View style={styles.logoContainer}>
        <Image
          source={require('@/assets/images/agricien-login-logo.jpg')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>
        {isShop ? 'Créer votre exploitation' : 'Créer votre compte'}
      </Text>
      <Text style={styles.subtitle}>
        {isShop
          ? 'Remplissez les informations de votre exploitation'
          : 'Remplissez vos informations personnelles'}
      </Text>

      <View style={styles.form}>
        {isShop && (
          <View style={styles.photoSection}>
            <Text style={styles.label}>Photo de l&apos;exploitation</Text>
            <TouchableOpacity 
              style={styles.photoButton} 
              onPress={handlePhotoAction}
              activeOpacity={0.8}
            >
              {shopPhoto ? (
                <Image source={{ uri: shopPhoto }} style={styles.photoPreview} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Camera size={40} color={Colors.primary} />
                  <Text style={styles.photoPlaceholderText}>Ajouter une photo</Text>
                </View>
              )}
            </TouchableOpacity>
            {!!shopPhoto && (
              <TouchableOpacity onPress={handlePhotoAction} activeOpacity={0.8}>
                <Text style={styles.changePhotoText}>Modifier la photo</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        {!isShop && (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Prénom *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Amadou"
                value={formData.firstName}
                onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                placeholderTextColor={Colors.textSecondary}
                editable={!signUpLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Diallo"
                value={formData.lastName}
                onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                placeholderTextColor={Colors.textSecondary}
                editable={!signUpLoading}
              />
            </View>
          </>
        )}

        {isShop && (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom de l&apos;exploitation *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Exploitation Fatou"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholderTextColor={Colors.textSecondary}
                editable={!signUpLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Prénom du propriétaire *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Amadou"
                value={formData.ownerFirstName}
                onChangeText={(text) => setFormData({ ...formData, ownerFirstName: text })}
                placeholderTextColor={Colors.textSecondary}
                editable={!signUpLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom du propriétaire *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Diallo"
                value={formData.ownerLastName}
                onChangeText={(text) => setFormData({ ...formData, ownerLastName: text })}
                placeholderTextColor={Colors.textSecondary}
                editable={!signUpLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Région *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Région de Dakar"
                value={formData.region}
                onChangeText={(text) => setFormData({ ...formData, region: text })}
                placeholderTextColor={Colors.textSecondary}
                editable={!signUpLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Département *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Rufisque"
                value={formData.department}
                onChangeText={(text) => setFormData({ ...formData, department: text })}
                placeholderTextColor={Colors.textSecondary}
                editable={!signUpLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Superficie de l&apos;exploitation *</Text>
              <View style={styles.rowInputs}>
                <TextInput
                  style={[styles.input, styles.areaInput]}
                  placeholder="Ex: 5"
                  value={formData.farmArea}
                  onChangeText={(text) => setFormData({ ...formData, farmArea: text.replace(/[^0-9.]/g, '') })}
                  keyboardType="decimal-pad"
                  placeholderTextColor={Colors.textSecondary}
                  editable={!signUpLoading}
                />
                <TouchableOpacity
                  style={styles.unitPicker}
                  onPress={() => setShowAreaUnitPicker(!showAreaUnitPicker)}
                  activeOpacity={0.8}
                  disabled={signUpLoading}
                >
                  <Text style={styles.unitPickerText}>
                    {areaUnit === 'hectares' ? 'Hectares' : 'Parcelle'}
                  </Text>
                  <ChevronDown size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
              {showAreaUnitPicker && (
                <View style={styles.pickerOptions}>
                  <TouchableOpacity
                    style={[styles.pickerOption, areaUnit === 'hectares' && styles.pickerOptionSelected]}
                    onPress={() => {
                      setAreaUnit('hectares');
                      setShowAreaUnitPicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pickerOptionText, areaUnit === 'hectares' && styles.pickerOptionTextSelected]}>
                      Hectares
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pickerOption, areaUnit === 'parcelle' && styles.pickerOptionSelected]}
                    onPress={() => {
                      setAreaUnit('parcelle');
                      setShowAreaUnitPicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pickerOptionText, areaUnit === 'parcelle' && styles.pickerOptionTextSelected]}>
                      Parcelle
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mode de production *</Text>
              <TouchableOpacity
                style={styles.specialtyPicker}
                onPress={() => setShowProductionModePicker(!showProductionModePicker)}
                activeOpacity={0.8}
                disabled={signUpLoading}
              >
                <Text style={styles.specialtyPickerText}>
                  {productionMode === 'traditionnel' ? 'Traditionnel' : productionMode === 'semi_moderne' ? 'Semi-moderne' : 'Bio'}
                </Text>
                <ChevronDown size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
              {showProductionModePicker && (
                <View style={styles.pickerOptions}>
                  <TouchableOpacity
                    style={[styles.pickerOption, productionMode === 'traditionnel' && styles.pickerOptionSelected]}
                    onPress={() => {
                      setProductionMode('traditionnel');
                      setShowProductionModePicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pickerOptionText, productionMode === 'traditionnel' && styles.pickerOptionTextSelected]}>
                      Traditionnel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pickerOption, productionMode === 'semi_moderne' && styles.pickerOptionSelected]}
                    onPress={() => {
                      setProductionMode('semi_moderne');
                      setShowProductionModePicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pickerOptionText, productionMode === 'semi_moderne' && styles.pickerOptionTextSelected]}>
                      Semi-moderne
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pickerOption, productionMode === 'bio' && styles.pickerOptionSelected]}
                    onPress={() => {
                      setProductionMode('bio');
                      setShowProductionModePicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pickerOptionText, productionMode === 'bio' && styles.pickerOptionTextSelected]}>
                      Bio
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Période de production * (Sélectionnez une ou plusieurs)</Text>
              <TouchableOpacity
                style={styles.specialtyPicker}
                onPress={() => setShowSeasonsPicker(!showSeasonsPicker)}
                activeOpacity={0.8}
                disabled={signUpLoading}
              >
                <Text style={[styles.specialtyPickerText, selectedSeasons.length === 0 && styles.placeholder]}>
                  {selectedSeasons.length > 0 
                    ? `${selectedSeasons.length} période(s) sélectionnée(s)` 
                    : 'Sélectionnez les périodes'}
                </Text>
                <ChevronDown size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
              
              {selectedSeasons.length > 0 && (
                <View style={styles.selectedSpecialtiesContainer}>
                  {selectedSeasons.map((season) => {
                    const seasonLabel = season === 'saison_seche' ? 'Saison sèche' : season === 'hivernage' ? 'Hivernage' : 'Toute l\'année';
                    return (
                      <View key={season} style={styles.selectedSpecialtyChip}>
                        <Text style={styles.selectedSpecialtyText}>{seasonLabel}</Text>
                        <TouchableOpacity
                          onPress={() => setSelectedSeasons(selectedSeasons.filter(s => s !== season))}
                          activeOpacity={0.8}
                        >
                          <X size={16} color={Colors.surface} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}

              {showSeasonsPicker && (
                <View style={styles.pickerOptions}>
                  {[
                    { value: 'saison_seche' as ProductionSeason, label: 'Saison sèche' },
                    { value: 'hivernage' as ProductionSeason, label: 'Hivernage' },
                    { value: 'toute_annee' as ProductionSeason, label: 'Toute l\'année' },
                  ].map((season) => {
                    const isSelected = selectedSeasons.includes(season.value);
                    return (
                      <TouchableOpacity
                        key={season.value}
                        style={[styles.pickerOption, isSelected && styles.pickerOptionSelected]}
                        onPress={() => {
                          if (isSelected) {
                            setSelectedSeasons(prev => prev.filter(s => s !== season.value));
                          } else {
                            setSelectedSeasons(prev => [...prev, season.value]);
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.pickerOptionText, isSelected && styles.pickerOptionTextSelected]}>
                          {season.label}
                        </Text>
                        {isSelected && (
                          <View style={styles.checkmark}>
                            <Text style={styles.checkmarkText}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </>
        )}

        {isShop && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Spécialités * (Sélectionnez une ou plusieurs)</Text>
            <TouchableOpacity
              style={styles.specialtyPicker}
              onPress={() => setShowSpecialtyPicker(!showSpecialtyPicker)}
              activeOpacity={0.8}
              disabled={signUpLoading}
            >
              <Text style={[styles.specialtyPickerText, selectedSpecialties.length === 0 && styles.placeholder]}>
                {selectedSpecialties.length > 0 
                  ? `${selectedSpecialties.length} spécialité(s) sélectionnée(s)` 
                  : 'Sélectionnez vos spécialités'}
              </Text>
              <ChevronDown size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            
            {selectedSpecialties.length > 0 && (
              <View style={styles.selectedSpecialtiesContainer}>
                {selectedSpecialties.map((specialty) => (
                  <View key={specialty} style={styles.selectedSpecialtyChip}>
                    <Text style={styles.selectedSpecialtyText}>{specialty}</Text>
                    <TouchableOpacity
                      onPress={() => setSelectedSpecialties(selectedSpecialties.filter(s => s !== specialty))}
                      activeOpacity={0.8}
                    >
                      <X size={16} color={Colors.surface} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {showSpecialtyPicker && (
              <View style={styles.specialtyPickerOptions}>
                <ScrollView 
                  style={styles.specialtyPickerScroll} 
                  nestedScrollEnabled={true}
                  keyboardShouldPersistTaps="always"
                  showsVerticalScrollIndicator={true}
                  bounces={false}
                >
                  {SPECIALTIES.map((specialty) => {
                    const isSelected = selectedSpecialties.includes(specialty);
                    return (
                      <TouchableOpacity
                        key={specialty}
                        style={[styles.specialtyOption, isSelected && styles.specialtyOptionSelected]}
                        onPress={() => {
                          console.log('Specialty pressed:', specialty);
                          if (isSelected) {
                            setSelectedSpecialties(prev => prev.filter(s => s !== specialty));
                          } else {
                            setSelectedSpecialties(prev => [...prev, specialty]);
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.specialtyOptionText, isSelected && styles.specialtyOptionTextSelected]}>
                          {specialty}
                        </Text>
                        {isSelected && (
                          <View style={styles.checkmark}>
                            <Text style={styles.checkmarkText}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            placeholder="exemple@email.com"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={Colors.textSecondary}
            editable={!signUpLoading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Téléphone *</Text>
          <TextInput
            style={styles.input}
            placeholder="+221 77 123 4567"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            keyboardType="phone-pad"
            placeholderTextColor={Colors.textSecondary}
            editable={!signUpLoading}
          />
        </View>

        {!isShop && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ville *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Dakar"
              value={formData.city}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
              placeholderTextColor={Colors.textSecondary}
              editable={!signUpLoading}
            />
          </View>
        )}

        {isShop && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ville de l&apos;exploitation *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Dakar"
              value={formData.city}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
              placeholderTextColor={Colors.textSecondary}
              editable={!signUpLoading}
            />
          </View>
        )}

        {isShop && (
          <>
            <View style={styles.inputGroup}>
              <View style={styles.switchRow}>
                <View style={styles.switchTextContainer}>
                  <Text style={styles.label}>Membre d&apos;une coopérative</Text>
                  <Text style={styles.switchSubtext}>Êtes-vous membre d&apos;une coopérative agricole ?</Text>
                </View>
                <Switch
                  value={isCooperativeMember}
                  onValueChange={setIsCooperativeMember}
                  trackColor={{ false: Colors.border, true: Colors.primary + '50' }}
                  thumbColor={isCooperativeMember ? Colors.primary : Colors.textSecondary}
                  disabled={signUpLoading}
                />
              </View>
            </View>

            {isCooperativeMember && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nom de la coopérative *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Coopérative agricole de Thiès"
                  value={formData.cooperativeName}
                  onChangeText={(text) => setFormData({ ...formData, cooperativeName: text })}
                  placeholderTextColor={Colors.textSecondary}
                  editable={!signUpLoading}
                />
              </View>
            )}
          </>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mot de passe *</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Minimum 6 caractères"
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              placeholderTextColor={Colors.textSecondary}
              editable={!signUpLoading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {showPassword ? (
                <EyeOff size={22} color={Colors.textSecondary} />
              ) : (
                <Eye size={22} color={Colors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirmer le mot de passe *</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Retapez votre mot de passe"
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              placeholderTextColor={Colors.textSecondary}
              editable={!signUpLoading}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {showConfirmPassword ? (
                <EyeOff size={22} color={Colors.textSecondary} />
              ) : (
                <Eye size={22} color={Colors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity onPress={handleRegister} activeOpacity={0.9} disabled={signUpLoading}>
          <LinearGradient
            colors={['#1B6B2A', '#2E8B3E', '#E8611A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.button, signUpLoading && styles.buttonDisabled]}
          >
            {signUpLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Créer mon compte</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 260,
    height: 110,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1B6B2A',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 0,
  },
  button: {
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#1B6B2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold' as const,
  },
  photoSection: {
    gap: 8,
    marginBottom: 8,
  },
  photoButton: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  photoPlaceholderText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  changePhotoText: {
    fontSize: 14,
    color: Colors.primary,
    textAlign: 'center',
    fontWeight: '600' as const,
    marginTop: 4,
  },
  specialtyPicker: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  specialtyPickerText: {
    fontSize: 16,
    color: Colors.text,
  },
  placeholder: {
    color: Colors.textSecondary,
  },
  specialtyPickerOptions: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 8,
    maxHeight: 250,
    overflow: 'hidden',
  },
  specialtyPickerScroll: {
    maxHeight: 250,
  },
  specialtyOption: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  specialtyOptionSelected: {
    backgroundColor: Colors.primary + '15',
  },
  specialtyOptionText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  specialtyOptionTextSelected: {
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  checkmark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: 'bold' as const,
  },
  selectedSpecialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  selectedSpecialtyChip: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectedSpecialtyText: {
    fontSize: 13,
    color: Colors.surface,
    fontWeight: '600' as const,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  areaInput: {
    flex: 1,
  },
  unitPicker: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minWidth: 140,
  },
  unitPickerText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  pickerOptions: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 8,
    overflow: 'hidden',
  },
  pickerOption: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerOptionSelected: {
    backgroundColor: Colors.primary + '15',
  },
  pickerOptionText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  pickerOptionTextSelected: {
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  switchTextContainer: {
    flex: 1,
  },
  switchSubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 0,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 16,
  },
});
