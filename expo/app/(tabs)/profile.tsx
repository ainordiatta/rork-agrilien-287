import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput, Modal, Alert, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Mail, Phone, LogOut, RefreshCw, Settings, MessageCircle, Camera, Edit, Trash2, Eye, EyeOff, Save, X, Grid3x3, ChevronRight, Globe, BarChart3, Package, Bell, ShieldCheck, FileText, Shield, Moon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { useMessages } from '@/contexts/MessagesContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import { CATEGORIES } from '@/constants/categories';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';


export default function ProfileScreen() {
  const { user, selectedCountry, logout, updateUser, updateCountry } = useApp();
  const { totalUnreadCount } = useMessages();
  const { unreadCount: notifUnreadCount } = useNotifications();
  const { isDark, toggleTheme, colors } = useTheme();
  const { language, changeLanguage, t } = useI18n();
  const router = useRouter();

  const [editModalVisible, setEditModalVisible] = React.useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = React.useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = React.useState(false);
  const [editedUser, setEditedUser] = React.useState<any>(null);
  const [emailVisible, setEmailVisible] = React.useState(true);
  const [phoneVisible, setPhoneVisible] = React.useState(true);
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [countryModalVisible, setCountryModalVisible] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const handleSwitchRole = () => {
    const newRole = user?.role === 'acheteur' ? 'producteur' : 'acheteur';
    router.push(`/complete-profile?targetRole=${newRole}`);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        if (user) {
          if (user.role === 'producteur') {
            const updatedUser = { ...user, shopPhoto: imageUri };
            await updateUser(updatedUser);
          } else {
            const updatedUser = { ...user, photo: imageUri };
            await updateUser(updatedUser);
          }
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const openEditModal = () => {
    setEditedUser({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      city: user?.city || '',
    });
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (user && editedUser) {
      const updatedUser = {
        ...user,
        name: editedUser.name,
        email: editedUser.email,
        phone: editedUser.phone,
        city: editedUser.city,
      };
      await updateUser(updatedUser);
      setEditModalVisible(false);
      Alert.alert('Succès', 'Profil mis à jour avec succès');
    }
  };

  const handleDeleteAccount = async () => {
    await logout();
    router.replace('/login');
    Alert.alert('Compte supprimé', 'Votre compte a été supprimé avec succès');
  };

  const countries = [
    { id: 'senegal' as const, name: 'Sénégal', flag: '🇸🇳', color: '#00853F' },
    { id: 'mali' as const, name: 'Mali', flag: '🇲🇱', color: '#CE1126' },
  ];

  const countryNames = {
    senegal: 'Sénégal',
    mali: 'Mali',
  };

  const handleCountryChange = async (countryId: 'senegal' | 'mali') => {
    await updateCountry(countryId);
    setCountryModalVisible(false);
    Alert.alert('Succès', 'Pays mis à jour avec succès');
  };

  const handleCategoryPress = (_categoryId: string) => {
    setCategoryModalVisible(true);
  };

  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategory(categoryName);
    console.log('Category selected:', categoryName);
  };

  const handleSubcategorySelect = (categoryName: string, subcategoryName: string) => {
    console.log('Subcategory selected:', categoryName, subcategoryName);
    setCategoryModalVisible(false);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>

        <View style={styles.avatarContainer}>
          {user && (user.role === 'producteur' ? user.shopPhoto : user.photo) ? (
            <Image 
              source={{ uri: user.role === 'producteur' ? (user.shopPhoto || '') : (user.photo || '') }} 
              style={styles.avatarImage} 
            />
          ) : (
            <LinearGradient
              colors={[Colors.gradient.start, Colors.gradient.middle, Colors.gradient.end]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{user?.name ? user.name.charAt(0).toUpperCase() : '?'}</Text>
            </LinearGradient>
          )}
          <TouchableOpacity style={styles.cameraButton} onPress={pickImage} activeOpacity={0.8}>
            <Camera size={20} color={Colors.surface} />
          </TouchableOpacity>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        {user?.isSuperAdmin && (
          <View style={styles.superAdminBadge}>
            <ShieldCheck size={14} color="#fff" />
            <Text style={styles.superAdminBadgeText}>Super Admin</Text>
          </View>
        )}
        <Text style={styles.role}>
          {user?.isSuperAdmin ? 'Administrateur principal' : user?.role === 'producteur' ? 'Photo de boutique' : 'Photo de profil'}
        </Text>
        <TouchableOpacity style={styles.editHeaderButton} onPress={openEditModal} activeOpacity={0.8}>
          <Edit size={16} color={Colors.primary} />
          <Text style={styles.editHeaderText}>Modifier</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Mail size={20} color={Colors.textSecondary} />
            {emailVisible ? (
              <Text style={styles.infoText}>{user?.email}</Text>
            ) : (
              <Text style={styles.infoText}>••••••••</Text>
            )}
            <TouchableOpacity onPress={() => setEmailVisible(!emailVisible)} activeOpacity={0.8}>
              {emailVisible ? (
                <Eye size={18} color={Colors.textSecondary} />
              ) : (
                <EyeOff size={18} color={Colors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <Phone size={20} color={Colors.textSecondary} />
            {phoneVisible ? (
              <Text style={styles.infoText}>{user?.phone}</Text>
            ) : (
              <Text style={styles.infoText}>••••••••</Text>
            )}
            <TouchableOpacity onPress={() => setPhoneVisible(!phoneVisible)} activeOpacity={0.8}>
              {phoneVisible ? (
                <Eye size={18} color={Colors.textSecondary} />
              ) : (
                <EyeOff size={18} color={Colors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <MapPin size={20} color={Colors.textSecondary} />
            <Text style={styles.infoText}>
              {user?.city}, {countryNames[selectedCountry]}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pays</Text>
        <TouchableOpacity
          style={styles.countryButton}
          onPress={() => setCountryModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.countryButtonContent}>
            <Globe size={20} color={Colors.text} />
            <View style={styles.countryInfo}>
              <Text style={styles.countryLabel}>Pays actuel</Text>
              <View style={styles.countryDisplay}>
                <Text style={styles.countryFlag}>
                  {countries.find(c => c.id === selectedCountry)?.flag}
                </Text>
                <Text style={styles.countryText}>
                  {countries.find(c => c.id === selectedCountry)?.name}
                </Text>
              </View>
            </View>
          </View>
          <ChevronRight size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Parcourir</Text>
        <TouchableOpacity
          style={styles.categoriesButton}
          onPress={() => handleCategoryPress('categories')}
          activeOpacity={0.8}
        >
          <View style={styles.categoriesButtonContent}>
            <Grid3x3 size={20} color={Colors.text} />
            <Text style={styles.categoriesButtonText}>Parcourir par catégorie</Text>
          </View>
          <ChevronRight size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.messagesButton}
            onPress={() => router.push('/messages')}
            activeOpacity={0.8}
          >
            <View style={styles.messagesButtonContent}>
              <MessageCircle size={20} color={Colors.primary} />
              <Text style={styles.messagesButtonText}>Mes conversations</Text>
            </View>
            {totalUnreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{totalUnreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.messagesButton}
            onPress={() => router.push('/orders' as any)}
            activeOpacity={0.8}
          >
            <View style={styles.messagesButtonContent}>
              <Package size={20} color={Colors.primary} />
              <Text style={styles.messagesButtonText}>Mes commandes</Text>
            </View>
            <ChevronRight size={18} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.messagesButton}
            onPress={() => router.push('/notifications')}
            activeOpacity={0.8}
          >
            <View style={styles.messagesButtonContent}>
              <Bell size={20} color={Colors.primary} />
              <Text style={styles.messagesButtonText}>Notifications</Text>
            </View>
            {notifUnreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{notifUnreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {user?.isSuperAdmin && (
            <TouchableOpacity
              style={styles.superAdminButton}
              onPress={() => router.push('/admin')}
              activeOpacity={0.8}
            >
              <ShieldCheck size={20} color="#fff" />
              <Text style={styles.superAdminText}>Panneau Super Admin</Text>
            </TouchableOpacity>
          )}

          {user?.role === 'producteur' && (
            <>
              <TouchableOpacity
                style={styles.adminButton}
                onPress={() => router.push('/admin')}
                activeOpacity={0.8}
              >
                <Settings size={20} color={Colors.surface} />
                <Text style={styles.adminText}>Gestion d&apos;exploitation</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.statisticsButton}
                onPress={() => router.push('/admin/statistics')}
                activeOpacity={0.8}
              >
                <BarChart3 size={20} color={Colors.primary} />
                <Text style={styles.statisticsButtonText}>Mes statistiques</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={[styles.switchButton, { backgroundColor: colors.surface, borderColor: colors.primary }]} onPress={handleSwitchRole} activeOpacity={0.8}>
            <RefreshCw size={20} color={colors.primary} />
            <Text style={[styles.switchText, { color: colors.primary }]}>
              Passer en mode {user?.role === 'acheteur' ? 'Producteur' : 'Acheteur'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* #3 Toggle Mode Sombre & Langue */}
      <View style={[styles.section, { borderTopWidth: 1, borderTopColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile.settings')}</Text>
        
        {/* Ligne Langue */}
        <View style={[styles.themeRow, { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }]}>
          <View style={styles.themeRowLeft}>
            <View style={[styles.themeIcon, { backgroundColor: '#F0F4FF' }]}>
              <Globe size={20} color={Colors.primary} />
            </View>
            <View>
              <Text style={[styles.themeLabel, { color: colors.text }]}>{t('profile.language')}</Text>
              <Text style={[styles.themeSubLabel, { color: colors.textSecondary }]}>
                {language === 'fr' ? 'Français' : 'Wolof'}
              </Text>
            </View>
          </View>
          <Switch
            value={language === 'wo'}
            onValueChange={(val) => changeLanguage(val ? 'wo' : 'fr')}
            trackColor={{ false: colors.border, true: Colors.primary + '80' }}
            thumbColor={language === 'wo' ? Colors.primary : '#fff'}
            ios_backgroundColor={colors.border}
          />
        </View>

        {/* Ligne Mode Sombre */}
        <View style={[styles.themeRow, { backgroundColor: colors.surface, borderTopWidth: 0 }]}>
          <View style={styles.themeRowLeft}>
            <View style={[styles.themeIcon, { backgroundColor: isDark ? '#1A1D27' : '#F0F4FF' }]}>
              <Moon size={20} color={isDark ? '#FFD23F' : colors.textSecondary} />
            </View>
            <View>
              <Text style={[styles.themeLabel, { color: colors.text }]}>{t('profile.theme')}</Text>
              <Text style={[styles.themeSubLabel, { color: colors.textSecondary }]}>
                {isDark ? 'Activé' : 'Désactivé'}
              </Text>
            </View>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary + '80' }}
            thumbColor={isDark ? colors.primary : '#fff'}
            ios_backgroundColor={colors.border}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
        <LogOut size={20} color={Colors.error} />
        <Text style={styles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Légal</Text>
        <TouchableOpacity
          style={styles.legalButton}
          onPress={() => router.push('/privacy-policy' as any)}
          activeOpacity={0.8}
        >
          <View style={styles.messagesButtonContent}>
            <Shield size={20} color={Colors.textSecondary} />
            <Text style={styles.legalButtonText}>Politique de confidentialité</Text>
          </View>
          <ChevronRight size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.legalButton, { marginTop: 10 }]}
          onPress={() => router.push('/terms' as any)}
          activeOpacity={0.8}
        >
          <View style={styles.messagesButtonContent}>
            <FileText size={20} color={Colors.textSecondary} />
            <Text style={styles.legalButtonText}>Conditions d'utilisation</Text>
          </View>
          <ChevronRight size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.deleteButton} 
        onPress={() => setDeleteModalVisible(true)} 
        activeOpacity={0.8}
      >
        <Trash2 size={20} color={Colors.surface} />
        <Text style={styles.deleteButtonText}>Supprimer mon compte</Text>
      </TouchableOpacity>

      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Modifier le profil</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} activeOpacity={0.8}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nom</Text>
                <TextInput
                  style={styles.input}
                  value={editedUser?.name}
                  onChangeText={(text) => setEditedUser({ ...editedUser, name: text })}
                  placeholder="Nom complet"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={editedUser?.email}
                  onChangeText={(text) => setEditedUser({ ...editedUser, email: text })}
                  placeholder="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Téléphone</Text>
                <TextInput
                  style={styles.input}
                  value={editedUser?.phone}
                  onChangeText={(text) => setEditedUser({ ...editedUser, phone: text })}
                  placeholder="Téléphone"
                  keyboardType="phone-pad"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ville</Text>
                <TextInput
                  style={styles.input}
                  value={editedUser?.city}
                  onChangeText={(text) => setEditedUser({ ...editedUser, city: text })}
                  placeholder="Ville"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setEditModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={handleSaveProfile}
                activeOpacity={0.8}
              >
                <Save size={20} color={Colors.surface} />
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={deleteModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.deleteModalContent}>
            <Trash2 size={48} color={Colors.error} />
            <Text style={styles.deleteModalTitle}>Supprimer le compte</Text>
            <Text style={styles.deleteModalText}>
              Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity 
                style={styles.deleteModalCancelButton} 
                onPress={() => setDeleteModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.deleteModalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.deleteModalConfirmButton} 
                onPress={handleDeleteAccount}
                activeOpacity={0.8}
              >
                <Text style={styles.deleteModalConfirmText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={categoryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Parcourir par catégorie</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)} activeOpacity={0.8}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.categoryModalBody}>
              {CATEGORIES.map((category) => (
                <View key={category.id} style={styles.categorySection}>
                  <TouchableOpacity
                    style={styles.categoryItemHeader}
                    onPress={() => handleCategorySelect(category.name)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.categoryItemTitle}>{category.name}</Text>
                    <ChevronRight size={20} color={Colors.textSecondary} />
                  </TouchableOpacity>
                  
                  {selectedCategory === category.name && category.subcategories.length > 0 && (
                    <View style={styles.subcategoriesContainer}>
                      {category.subcategories.map((subcategory, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.subcategoryItem}
                          onPress={() => handleSubcategorySelect(category.name, subcategory)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.subcategoryItemText}>{subcategory}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={countryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCountryModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.countryModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Changer de pays</Text>
              <TouchableOpacity onPress={() => setCountryModalVisible(false)} activeOpacity={0.8}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.countryModalBody}>
              {countries.map((country) => (
                <TouchableOpacity
                  key={country.id}
                  style={[
                    styles.countryOptionCard,
                    selectedCountry === country.id && styles.countryOptionCardActive
                  ]}
                  onPress={() => handleCountryChange(country.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.countryOptionContent}>
                    <Text style={styles.countryOptionFlag}>{country.flag}</Text>
                    <Text style={[
                      styles.countryOptionName,
                      selectedCountry === country.id && styles.countryOptionNameActive
                    ]}>
                      {country.name}
                    </Text>
                  </View>
                  <View style={[styles.countryColorBar, { backgroundColor: country.color }]} />
                  {selectedCountry === country.id && (
                    <View style={styles.activeIndicator}>
                      <Text style={styles.activeIndicatorText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 32,
  },

  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.surface,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold' as const,
    color: Colors.surface,
  },
  editHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.background,
  },
  editHeaderText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  role: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  actionsContainer: {
    gap: 12,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: 20,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.error,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  switchText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  superAdminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#B71C1C',
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#B71C1C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  superAdminText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  superAdminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#B71C1C',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  superAdminBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#fff',
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    elevation: 4,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  adminText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
  statisticsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  statisticsButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  messagesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  messagesButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  messagesButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    fontSize: 12,
    fontWeight: 'bold' as const,
    color: Colors.surface,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: 20,
    marginTop: 8,
    padding: 16,
    backgroundColor: Colors.error,
    borderRadius: 12,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.surface,
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
    height: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.text,
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.background,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.background,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
  deleteModalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 32,
    margin: 20,
    alignItems: 'center',
    gap: 16,
  },
  deleteModalTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  deleteModalText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  deleteModalCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  deleteModalCancelText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  deleteModalConfirmButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.error,
    alignItems: 'center',
  },
  deleteModalConfirmText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
  categoriesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoriesButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoriesButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  categoryModalBody: {
    padding: 20,
    paddingBottom: 40,
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderRadius: 12,
  },
  categoryItemTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  subcategoriesContainer: {
    marginTop: 8,
    marginLeft: 16,
    gap: 6,
  },
  subcategoryItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  subcategoryItemText: {
    fontSize: 14,
    color: Colors.text,
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  countryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countryInfo: {
    gap: 4,
  },
  countryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  countryDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countryFlag: {
    fontSize: 20,
  },
  countryText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  countryModalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
  },
  countryModalBody: {
    padding: 20,
    gap: 12,
  },
  countryOptionCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  countryOptionCardActive: {
    borderColor: Colors.primary,
  },
  countryOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  countryOptionFlag: {
    fontSize: 40,
  },
  countryOptionName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  countryOptionNameActive: {
    color: Colors.primary,
  },
  countryColorBar: {
    height: 4,
    width: '100%',
  },
  activeIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIndicatorText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: 'bold' as const,
  },
  legalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  legalButtonText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  themeRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  themeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  themeSubLabel: {
    fontSize: 12,
    marginTop: 2,
  },
});
