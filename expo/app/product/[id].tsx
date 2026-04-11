import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Star, MapPin, Truck, Store as StoreIcon, ShoppingCart, MessageCircle, Calendar, DollarSign, Handshake } from 'lucide-react-native';
import { useState } from 'react';
import Colors from '@/constants/colors';
import { mockProducts, formatPrice } from '@/mocks/data';
import { useApp } from '@/contexts/AppContext';
import { useMessages } from '@/contexts/MessagesContext';
import { useInventory } from '@/contexts/InventoryContext';
import { useNegotiations } from '@/contexts/NegotiationsContext';
import { useReviews } from '@/contexts/ReviewsContext';
import { Product, InventoryProduct, User } from '@/types';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addToCart, user } = useApp();
  const { createOrGetConversation } = useMessages();
  const { createNegotiation } = useNegotiations();
  const { products: inventoryProducts } = useInventory();
  const { getProductReviews, getProductRating, addReview, hasUserReviewedProduct } = useReviews();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [reservationModalVisible, setReservationModalVisible] = useState<boolean>(false);
  const [reservationQuantity, setReservationQuantity] = useState<string>('1');
  const [depositPercentage, setDepositPercentage] = useState<string>('');
  const [negotiationModalVisible, setNegotiationModalVisible] = useState<boolean>(false);
  const [negotiationQuantity, setNegotiationQuantity] = useState<string>('');
  const [negotiationPrice, setNegotiationPrice] = useState<string>('');
  const [negotiationNotes, setNegotiationNotes] = useState<string>('');
  const [reviewModalVisible, setReviewModalVisible] = useState<boolean>(false);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [showAllReviews, setShowAllReviews] = useState<boolean>(false);

  const convertInventoryProductToProduct = (invProduct: InventoryProduct, productUser?: User): Product => {
    const ownerUser = productUser || user;
    
    return {
      id: invProduct.id,
      name: invProduct.name,
      description: invProduct.description,
      price: invProduct.price,
      currency: 'XOF',
      images: invProduct.images.length > 0 ? invProduct.images : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'],
      category: invProduct.category,
      subcategory: invProduct.subcategory,
      stock: invProduct.quantity,
      shopId: ownerUser?.id || 'unknown',
      shop: {
        id: ownerUser?.id || 'unknown',
        name: ownerUser?.name || 'Boutique',
        specialties: ownerUser?.specialties || [],
        city: ownerUser?.city || 'Ville inconnue',
        country: ownerUser?.country || 'senegal',
        email: ownerUser?.email || '',
        phone: ownerUser?.phone || '',
        photo: ownerUser?.shopPhoto,
        rating: 4.5,
        reviewCount: 0,
        description: '',
        createdAt: ownerUser?.createdAt || new Date().toISOString(),
      },
      deliveryMethods: ['both' as const],
      isBoosted: false,
      unit: 'unite' as const,
      pricingModel: 'fixed' as const,
      availability: 'disponible' as const,
      createdAt: invProduct.createdAt,
    };
  };

  let product: Product | null | undefined = mockProducts.find((p) => p.id === id);
  
  if (!product) {
    const inventoryProduct = inventoryProducts.find((p) => p.id === id);
    if (inventoryProduct) {
      product = convertInventoryProductToProduct(inventoryProduct);
    }
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Produit agricole non trouvé</Text>
      </View>
    );
  }

  const isOwnShop = user?.role === 'producteur' && user?.id === product.shopId;
  const canMessage = user && user.role !== 'producteur' && !isOwnShop;
  const productReviews = getProductReviews(product.id);
  const productRating = getProductRating(product.id);
  const hasReviewed = hasUserReviewedProduct(product.id);

  const handleAddToCart = async () => {
    await addToCart({ product, quantity: 1 });
    Alert.alert('Succès', 'Produit ajouté au panier', [
      { text: 'Continuer', style: 'cancel' },
      { text: 'Voir le panier', onPress: () => router.push('/cart') },
    ]);
  };

  const handleContactSeller = async () => {
    if (!user) {
      Alert.alert('Connexion requise', 'Veuillez vous connecter pour contacter le producteur');
      return;
    }

    if (user.id === product.shopId) {
      Alert.alert('Information', 'Vous ne pouvez pas vous contacter vous-même');
      return;
    }

    try {
      const conversation = await createOrGetConversation(product);
      router.push(`/chat/${conversation.id}` as any);
    } catch {
      Alert.alert('Erreur', 'Impossible de créer la conversation');
    }
  };

  const handleReservation = () => {
    if (!user) {
      Alert.alert('Connexion requise', 'Veuillez vous connecter pour réserver ce produit agricole');
      return;
    }

    if (user.id === product.shopId) {
      Alert.alert('Information', 'Vous ne pouvez pas réserver vos propres produits');
      return;
    }

    setDepositPercentage(product.minReservationDeposit?.toString() || '30');
    setReservationModalVisible(true);
  };

  const handleNegotiate = () => {
    if (!user) {
      Alert.alert('Connexion requise', 'Veuillez vous connecter pour négocier');
      return;
    }

    if (user.id === product.shopId) {
      Alert.alert('Information', 'Vous ne pouvez pas négocier avec vous-même');
      return;
    }

    setNegotiationModalVisible(true);
  };

  const handleConfirmNegotiation = async () => {
    const quantity = parseInt(negotiationQuantity);
    const price = parseFloat(negotiationPrice);

    if (isNaN(quantity) || quantity <= 10) {
      Alert.alert('Erreur', 'La quantité doit être supérieure à 10 pour négocier');
      return;
    }

    if (isNaN(price) || price <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un prix valide');
      return;
    }

    try {
      const conversation = await createOrGetConversation(product);
      await createNegotiation(
        conversation.id,
        product.id,
        product.name,
        product.shopId,
        product.shop.name,
        'bulk_order',
        quantity,
        product.price,
        price,
        negotiationNotes
      );

      setNegotiationModalVisible(false);
      setNegotiationQuantity('');
      setNegotiationPrice('');
      setNegotiationNotes('');

      Alert.alert(
        'Négociation envoyée',
        'Votre demande de négociation a été envoyée au producteur. Vous recevrez une réponse dans vos messages.',
        [
          { text: 'OK', onPress: () => router.push(`/chat/${conversation.id}` as any) }
        ]
      );
    } catch (error) {
      console.error('Error creating negotiation:', error);
      Alert.alert('Erreur', 'Impossible de créer la négociation');
    }
  };

  const handleConfirmReservation = () => {
    const quantity = parseInt(reservationQuantity);
    const deposit = parseFloat(depositPercentage);

    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer une quantité valide');
      return;
    }

    if (isNaN(deposit) || deposit < (product.minReservationDeposit || 0) || deposit > 100) {
      Alert.alert('Erreur', `L'acompte doit être entre ${product.minReservationDeposit || 30}% et 100%`);
      return;
    }

    const totalPrice = product.price * quantity;
    const depositAmount = (totalPrice * deposit) / 100;

    setReservationModalVisible(false);
    
    Alert.alert(
      'Réservation confirmée',
      `Vous avez réservé ${quantity} unité(s) de ${product.name}.\n\nMontant total: ${formatPrice(totalPrice, product.currency)}\nAcompte (${deposit}%): ${formatPrice(depositAmount, product.currency)}\nReste à payer: ${formatPrice(totalPrice - depositAmount, product.currency)}\n\nDate de récolte prévue: ${product.harvestDate ? new Date(product.harvestDate).toLocaleDateString('fr-FR') : 'Non spécifiée'}`,
      [
        { text: 'OK', onPress: () => router.back() }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.images[selectedImageIndex] }}
            style={styles.mainImage}
          />
          {product.images.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailContainer}
            >
              {product.images.map((image, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedImageIndex(index)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: image }}
                    style={[
                      styles.thumbnail,
                      selectedImageIndex === index && styles.thumbnailActive,
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.price}>{formatPrice(product.price, product.currency)}</Text>
          </View>

          <View style={styles.badges}>
            <View style={[styles.badge, styles.availabilityBadge]}>
              <Text style={styles.badgeText}>
                {product.availability === 'disponible' && 'Disponible maintenant'}
                {product.availability === 'sur_commande' && 'Sur commande'}
                {product.availability === 'prochaine_recolte' && 'Prochaine récolte'}
                {product.availability === 'rupture' && 'Rupture de stock'}
              </Text>
            </View>
            {(product.harvestDate || product.estimatedAvailabilityDate) && (
              <View style={[styles.badge, styles.dateBadge]}>
                <Text style={styles.badgeText}>
                  {new Date(product.harvestDate || product.estimatedAvailabilityDate!).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
            )}
            <View style={[styles.badge, styles.stockBadge]}>
              <Text style={styles.badgeText}>
                {product.stock > 0 ? `${product.stock} en stock` : 'Rupture de stock'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.shopCard}
            onPress={() => router.push(`/shop/${product.shop.id}` as any)}
            activeOpacity={0.8}
          >
            <View style={styles.shopHeader}>
              <StoreIcon size={20} color={Colors.primary} />
              <Text style={styles.shopName}>{product.shop.name}</Text>
            </View>
            <View style={styles.shopInfo}>
              <View style={styles.rating}>
                <Star size={16} color={Colors.warning} fill={Colors.warning} />
                <Text style={styles.ratingText}>
                  {product.shop.rating.toFixed(1)} ({product.shop.reviewCount} avis)
                </Text>
              </View>
              <View style={styles.location}>
                <MapPin size={14} color={Colors.textSecondary} />
                <Text style={styles.locationText}>{product.shop.city}</Text>
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Avis sur le produit</Text>
              {productRating.count > 0 && (
                <View style={styles.overallRating}>
                  <Star size={18} color={Colors.warning} fill={Colors.warning} />
                  <Text style={styles.overallRatingText}>
                    {productRating.average.toFixed(1)} ({productRating.count})
                  </Text>
                </View>
              )}
            </View>

            {user && !isOwnShop && !hasReviewed && (
              <TouchableOpacity
                style={styles.addReviewButton}
                onPress={() => setReviewModalVisible(true)}
                activeOpacity={0.8}
              >
                <Star size={20} color={Colors.primary} />
                <Text style={styles.addReviewText}>Laisser un avis</Text>
              </TouchableOpacity>
            )}

            {productReviews.length > 0 ? (
              <View style={styles.reviewsList}>
                {(showAllReviews ? productReviews : productReviews.slice(0, 3)).map((review) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      {review.userPhoto ? (
                        <Image source={{ uri: review.userPhoto }} style={styles.reviewUserPhoto} />
                      ) : (
                        <View style={[styles.reviewUserPhoto, styles.reviewUserPhotoPlaceholder]} />
                      )}
                      <View style={styles.reviewHeaderInfo}>
                        <Text style={styles.reviewUserName}>{review.userName}</Text>
                        <View style={styles.reviewRating}>
                          {[...Array(5)].map((_, index) => (
                            <Star
                              key={index}
                              size={14}
                              color={index < review.rating ? Colors.warning : Colors.border}
                              fill={index < review.rating ? Colors.warning : 'transparent'}
                            />
                          ))}
                        </View>
                      </View>
                      <Text style={styles.reviewDate}>
                        {new Date(review.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </Text>
                    </View>
                    {!!review.comment && (
                      <Text style={styles.reviewComment}>{review.comment}</Text>
                    )}
                    {review.images && review.images.length > 0 && (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewImages}>
                        {review.images.map((image, index) => (
                          <Image key={index} source={{ uri: image }} style={styles.reviewImage} />
                        ))}
                      </ScrollView>
                    )}
                    {review.verified && (
                      <View style={styles.verifiedBadge}>
                        <Text style={styles.verifiedText}>✓ Achat vérifié</Text>
                      </View>
                    )}
                  </View>
                ))}
                {productReviews.length > 3 && (
                  <TouchableOpacity
                    style={styles.showMoreReviewsButton}
                    onPress={() => setShowAllReviews(!showAllReviews)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.showMoreReviewsText}>
                      {showAllReviews 
                        ? 'Voir moins d\'avis' 
                        : `Voir tous les avis (${productReviews.length})`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <Text style={styles.noReviewsText}>Aucun avis pour ce produit</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Livraison</Text>
            <View style={styles.deliveryOptions}>
              {product.deliveryMethods.includes('delivery') && (
                <View style={styles.deliveryOption}>
                  <Truck size={20} color={Colors.success} />
                  <Text style={styles.deliveryText}>Livraison disponible</Text>
                </View>
              )}
              {product.deliveryMethods.includes('pickup') && (
                <View style={styles.deliveryOption}>
                  <StoreIcon size={20} color={Colors.secondary} />
                  <Text style={styles.deliveryText}>Retrait en boutique</Text>
                </View>
              )}
            </View>
          </View>

          {!isOwnShop && user?.role === 'acheteur' && (
            <View style={styles.negotiationCard}>
              <View style={styles.negotiationHeader}>
                <Handshake size={24} color={Colors.secondary} />
                <Text style={styles.negotiationTitle}>Achats en grande quantité</Text>
              </View>
              <Text style={styles.negotiationDescription}>
                Négociez le prix pour des commandes de plus de 10 unités
              </Text>
              <TouchableOpacity
                style={styles.negotiationButton}
                onPress={handleNegotiate}
                activeOpacity={0.8}
              >
                <Handshake size={20} color={Colors.surface} />
                <Text style={styles.negotiationButtonText}>Négocier le prix</Text>
              </TouchableOpacity>
            </View>
          )}

          {product.availableForReservation && (
            <View style={styles.reservationCard}>
              <View style={styles.reservationHeader}>
                <Calendar size={24} color={Colors.primary} />
                <Text style={styles.reservationTitle}>Réservation disponible</Text>
              </View>
              <Text style={styles.reservationDescription}>
                Réservez ce produit pour la prochaine récolte avec un acompte
              </Text>
              {!!product.harvestDate && (
                <View style={styles.reservationInfo}>
                  <Text style={styles.reservationLabel}>Date de récolte prévue:</Text>
                  <Text style={styles.reservationValue}>
                    {new Date(product.harvestDate).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
              )}
              <View style={styles.reservationInfo}>
                <Text style={styles.reservationLabel}>Acompte minimum:</Text>
                <Text style={styles.reservationValue}>{product.minReservationDeposit || 30}%</Text>
              </View>
              {product.reservedQuantity && product.reservedQuantity > 0 && (
                <View style={styles.reservationInfo}>
                  <Text style={styles.reservationLabel}>Déjà réservé:</Text>
                  <Text style={styles.reservationValue}>{product.reservedQuantity} unités</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.reservationButton}
                onPress={handleReservation}
                activeOpacity={0.8}
              >
                <DollarSign size={20} color={Colors.surface} />
                <Text style={styles.reservationButtonText}>Réserver avec acompte</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {canMessage && (
          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleContactSeller}
            activeOpacity={0.8}
          >
            <MessageCircle size={20} color={Colors.primary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.addToCartButton, product.stock === 0 && styles.buttonDisabled]}
          onPress={handleAddToCart}
          disabled={product.stock === 0}
          activeOpacity={0.8}
        >
          <ShoppingCart size={20} color={Colors.surface} />
          <Text style={styles.addToCartText}>
            {product.stock === 0 ? 'Rupture de stock' : 'Ajouter au panier'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={negotiationModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNegotiationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Négocier le prix</Text>
            
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Quantité souhaitée</Text>
              <TextInput
                style={styles.modalInput}
                value={negotiationQuantity}
                onChangeText={setNegotiationQuantity}
                keyboardType="numeric"
                placeholder="Minimum 10 unités"
                placeholderTextColor={Colors.textSecondary}
              />
              <Text style={styles.modalHint}>
                Quantité minimum: 10 unités
              </Text>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Prix proposé par unité ({product.currency})</Text>
              <TextInput
                style={styles.modalInput}
                value={negotiationPrice}
                onChangeText={setNegotiationPrice}
                keyboardType="numeric"
                placeholder={`Prix actuel: ${product.price}`}
                placeholderTextColor={Colors.textSecondary}
              />
              <Text style={styles.modalHint}>
                Prix actuel: {formatPrice(product.price, product.currency)}
              </Text>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Notes (optionnel)</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                value={negotiationNotes}
                onChangeText={setNegotiationNotes}
                placeholder="Détails de votre demande..."
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>

            {!!negotiationQuantity && !!negotiationPrice && !isNaN(parseInt(negotiationQuantity)) && !isNaN(parseFloat(negotiationPrice)) && (
              <View style={styles.modalSummary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Quantité:</Text>
                  <Text style={styles.summaryValue}>{negotiationQuantity} unités</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Prix proposé total:</Text>
                  <Text style={styles.summaryValueBold}>
                    {formatPrice(parseInt(negotiationQuantity) * parseFloat(negotiationPrice), product.currency)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Économie potentielle:</Text>
                  <Text style={[styles.summaryValue, { color: Colors.success }]}>
                    {formatPrice((product.price - parseFloat(negotiationPrice)) * parseInt(negotiationQuantity), product.currency)}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setNegotiationModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleConfirmNegotiation}
                activeOpacity={0.8}
              >
                <Text style={styles.modalConfirmText}>Envoyer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={reservationModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReservationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Réserver {product.name}</Text>
            
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Quantité à réserver</Text>
              <TextInput
                style={styles.modalInput}
                value={reservationQuantity}
                onChangeText={setReservationQuantity}
                keyboardType="numeric"
                placeholder="Entrez la quantité"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Pourcentage d&apos;acompte (%)</Text>
              <TextInput
                style={styles.modalInput}
                value={depositPercentage}
                onChangeText={setDepositPercentage}
                keyboardType="numeric"
                placeholder={`Minimum ${product.minReservationDeposit || 30}%`}
                placeholderTextColor={Colors.textSecondary}
              />
              <Text style={styles.modalHint}>
                Acompte minimum: {product.minReservationDeposit || 30}%
              </Text>
            </View>

            {!!reservationQuantity && !!depositPercentage && !isNaN(parseInt(reservationQuantity)) && !isNaN(parseFloat(depositPercentage)) && (
              <View style={styles.modalSummary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total:</Text>
                  <Text style={styles.summaryValue}>
                    {formatPrice(product.price * parseInt(reservationQuantity), product.currency)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Acompte ({depositPercentage}%):</Text>
                  <Text style={styles.summaryValue}>
                    {formatPrice((product.price * parseInt(reservationQuantity) * parseFloat(depositPercentage)) / 100, product.currency)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Reste à payer:</Text>
                  <Text style={styles.summaryValueBold}>
                    {formatPrice((product.price * parseInt(reservationQuantity)) - (product.price * parseInt(reservationQuantity) * parseFloat(depositPercentage)) / 100, product.currency)}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setReservationModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleConfirmReservation}
                activeOpacity={0.8}
              >
                <Text style={styles.modalConfirmText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={reviewModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Évaluer {product.name}</Text>
            
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Note</Text>
              <View style={styles.ratingSelector}>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    onPress={() => setReviewRating(rating)}
                    activeOpacity={0.8}
                  >
                    <Star
                      size={36}
                      color={rating <= reviewRating ? Colors.warning : Colors.border}
                      fill={rating <= reviewRating ? Colors.warning : 'transparent'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Commentaire (optionnel)</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                value={reviewComment}
                onChangeText={setReviewComment}
                placeholder="Partagez votre expérience avec ce produit..."
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setReviewModalVisible(false);
                  setReviewRating(5);
                  setReviewComment('');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={async () => {
                  try {
                    await addReview(product.id, undefined, reviewRating, reviewComment);
                    setReviewModalVisible(false);
                    setReviewRating(5);
                    setReviewComment('');
                    Alert.alert('Merci !', 'Votre avis a été publié avec succès');
                  } catch {
                    Alert.alert('Erreur', 'Impossible de publier votre avis');
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalConfirmText}>Publier</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  imageContainer: {
    backgroundColor: Colors.surface,
  },
  mainImage: {
    width: width,
    height: width,
    backgroundColor: Colors.border,
  },
  thumbnailContainer: {
    padding: 12,
    gap: 8,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: Colors.border,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: Colors.primary,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  header: {
    gap: 8,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: Colors.text,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: Colors.primary,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  availabilityBadge: {
    backgroundColor: Colors.success + '20',
  },
  dateBadge: {
    backgroundColor: Colors.primary + '20',
  },
  stockBadge: {
    backgroundColor: Colors.secondary + '20',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  shopCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shopName: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.text,
  },
  shopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: Colors.text,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.text,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.text,
  },
  deliveryOptions: {
    gap: 12,
  },
  deliveryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  deliveryText: {
    fontSize: 14,
    color: Colors.text,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  contactButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 18,
  },
  buttonDisabled: {
    backgroundColor: Colors.textSecondary,
  },
  addToCartText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.surface,
  },
  reservationCard: {
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  reservationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reservationTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.primary,
  },
  reservationDescription: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  reservationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reservationLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  reservationValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  reservationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 14,
    marginTop: 4,
  },
  reservationButtonText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.surface,
  },
  negotiationCard: {
    backgroundColor: Colors.secondary + '10',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.secondary + '30',
  },
  negotiationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  negotiationTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.secondary,
  },
  negotiationDescription: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  negotiationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.secondary,
    borderRadius: 8,
    padding: 14,
    marginTop: 4,
  },
  negotiationButtonText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.surface,
  },
  modalTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  modalSection: {
    gap: 8,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalHint: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  modalSummary: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  summaryValueBold: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.primary,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  modalConfirmButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.surface,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  overallRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  overallRatingText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  addReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginBottom: 16,
  },
  addReviewText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  reviewCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reviewUserPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.border,
  },
  reviewUserPhotoPlaceholder: {
    backgroundColor: Colors.primary + '20',
  },
  reviewHeaderInfo: {
    flex: 1,
    gap: 4,
  },
  reviewUserName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
  },
  reviewImages: {
    flexDirection: 'row',
    gap: 8,
  },
  reviewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: Colors.border,
    marginRight: 8,
  },
  verifiedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600' as const,
  },
  noReviewsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    padding: 24,
    backgroundColor: Colors.surface,
    borderRadius: 8,
  },
  reviewsList: {
    gap: 12,
  },
  moreReviewsText: {
    fontSize: 14,
    color: Colors.primary,
    textAlign: 'center',
    padding: 12,
    fontWeight: '600' as const,
  },
  showMoreReviewsButton: {
    marginTop: 8,
    padding: 14,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
  },
  showMoreReviewsText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  ratingSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
});
