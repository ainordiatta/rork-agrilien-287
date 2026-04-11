import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import {
  Send,
  Image as ImageIcon,
  Mic,
  X,
  Check,
  CreditCard,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import Colors from '@/constants/colors';
import { useMessages } from '@/contexts/MessagesContext';
import { useApp } from '@/contexts/AppContext';
import { Message } from '@/types';
import { mockProducts, formatPrice } from '@/mocks/data';

const { width } = Dimensions.get('window');

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useApp();
  const {
    getConversationMessages,
    sendMessage,
    markAsRead,
    updateOfferStatus,
    acceptOfferAndAddToCart,
    conversations,
  } = useMessages();

  const [messageText, setMessageText] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [showOfferModal, setShowOfferModal] = useState<boolean>(false);
  const [offerPrice, setOfferPrice] = useState<string>('');
  const flatListRef = useRef<FlatList>(null);
  const [playingSound, setPlayingSound] = useState<Audio.Sound | null>(null);

  const conversation = conversations.find((c) => c.id === id);
  const messages = getConversationMessages(id);
  const product = mockProducts.find((p) => p.id === conversation?.productId);

  useEffect(() => {
    if (id) {
      markAsRead(id);
    }
  }, [id, markAsRead]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    try {
      await sendMessage(id, messageText, 'text');
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
    }
  };

  const handleSelectImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'L\'accès à la galerie est nécessaire');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      try {
        await sendMessage(id, 'Photo', 'image', {
          imageUrl: result.assets[0].uri,
        });
      } catch (error) {
        console.error('Error sending image:', error);
        Alert.alert('Erreur', 'Impossible d\'envoyer l\'image');
      }
    }
  };

  const handleStartRecording = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Non disponible',
        'L\'enregistrement vocal n\'est pas disponible sur le web. Veuillez utiliser l\'application mobile.'
      );
      return;
    }

    try {
      if (recording) {
        console.log('Cleaning up existing recording');
        try {
          await recording.stopAndUnloadAsync();
        } catch (e) {
          console.log('Error cleaning up existing recording:', e);
        }
        setRecording(null);
        setIsRecording(false);
      }

      console.log('Requesting microphone permission...');
      const permissionResponse = await Audio.requestPermissionsAsync();
      console.log('Permission result:', permissionResponse);
      
      if (permissionResponse.status !== 'granted') {
        if (permissionResponse.canAskAgain === false) {
          Alert.alert(
            'Permission refusée',
            'L\'accès au microphone est nécessaire pour enregistrer des messages vocaux.\n\nPour activer cette permission :\n\n1. Ouvrez les Réglages de votre appareil\n2. Trouvez cette application dans la liste\n3. Activez l\'accès au Microphone',
            [{ text: 'J\'ai compris' }]
          );
        } else {
          Alert.alert(
            'Permission requise',
            'L\'accès au microphone est nécessaire pour enregistrer des messages vocaux.',
            [{ text: 'OK' }]
          );
        }
        return;
      }

      console.log('Setting audio mode...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      console.log('Creating recording...');
      const { recording: newRecording } = await Audio.Recording.createAsync(
        {
          isMeteringEnabled: true,
          android: {
            extension: '.m4a',
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
          },
          ios: {
            extension: '.wav',
            outputFormat: Audio.IOSOutputFormat.LINEARPCM,
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {},
        }
      );

      setRecording(newRecording);
      setIsRecording(true);
      console.log('Recording started successfully');
    } catch (error) {
      console.error('Error starting recording:', error);
      setRecording(null);
      setIsRecording(false);
      Alert.alert('Erreur', 'Impossible de démarrer l\'enregistrement: ' + (error as Error).message);
    }
  };

  const handleStopRecording = async () => {
    if (!recording) return;

    try {
      console.log('Stopping recording...');
      setIsRecording(false);
      
      const status = await recording.getStatusAsync();
      const duration = status.durationMillis ? status.durationMillis / 1000 : 0;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      if (uri) {
        console.log('[Chat] Audio recorded, URI:', uri, 'Duration:', duration);
        await sendMessage(id, 'Note vocale', 'voice', {
          voiceUrl: uri,
          voiceDuration: duration,
        });
      } else {
        console.error('[Chat] No URI from recording');
        Alert.alert('Erreur', 'Impossible de récupérer l\'enregistrement');
      }

      setRecording(null);
      console.log('Recording stopped and saved');
    } catch (error) {
      console.error('Error stopping recording:', error);
      setRecording(null);
      setIsRecording(false);
      Alert.alert('Erreur', 'Impossible de sauvegarder l\'enregistrement');
    }
  };

  const handleSendOffer = async () => {
    const price = parseFloat(offerPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un prix valide');
      return;
    }

    if (!conversation || !product) return;

    try {
      await sendMessage(id, `Proposition: ${formatPrice(price, product.currency)}`, 'offer', {
        offer: {
          price,
          currency: product.currency,
        },
      });
      setShowOfferModal(false);
      setOfferPrice('');
    } catch (error) {
      console.error('Error sending offer:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer la proposition');
    }
  };

  const handleAcceptOffer = async (message: Message) => {
    if (!message.offer || !product) return;

    Alert.alert(
      'Accepter l\'offre',
      'Que souhaitez-vous faire?',
      [
        {
          text: 'Ajouter au panier',
          onPress: async () => {
            try {
              await acceptOfferAndAddToCart(message.id, id, product, message.offer!.price);
              Alert.alert('Succès', 'Produit ajouté au panier avec le prix proposé');
            } catch (error) {
              console.error('Error accepting offer:', error);
              Alert.alert('Erreur', 'Impossible d\'ajouter au panier');
            }
          },
        },
        {
          text: 'Payer maintenant',
          onPress: async () => {
            try {
              await updateOfferStatus(message.id, id, 'accepted');
              Alert.alert(
                'Paiement',
                'Fonctionnalité de paiement à implémenter',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Error accepting offer:', error);
              Alert.alert('Erreur', 'Impossible d\'accepter l\'offre');
            }
          },
        },
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ]
    );
  };

  const handleRejectOffer = async (message: Message) => {
    Alert.alert(
      'Refuser l\'offre',
      'Êtes-vous sûr de vouloir refuser cette offre?',
      [
        {
          text: 'Oui',
          onPress: async () => {
            try {
              await updateOfferStatus(message.id, id, 'rejected');
            } catch (error) {
              console.error('Error rejecting offer:', error);
              Alert.alert('Erreur', 'Impossible de refuser l\'offre');
            }
          },
        },
        {
          text: 'Non',
          style: 'cancel',
        },
      ]
    );
  };

  const playVoiceNote = async (voiceUrl: string) => {
    try {
      if (playingSound) {
        console.log('[Chat] Stopping previous sound');
        try {
          await playingSound.stopAsync();
          await playingSound.unloadAsync();
        } catch (e) {
          console.log('[Chat] Error cleaning up previous sound:', e);
        }
        setPlayingSound(null);
      }

      console.log('[Chat] Validating voice URL:', voiceUrl);
      if (!voiceUrl || typeof voiceUrl !== 'string') {
        throw new Error('URL de la note vocale invalide');
      }

      console.log('[Chat] Setting audio mode for playback');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      console.log('[Chat] Creating sound from URI:', voiceUrl);
      const { sound, status: loadStatus } = await Audio.Sound.createAsync(
        { uri: voiceUrl },
        { shouldPlay: false },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            console.log('[Chat] Sound finished playing');
            sound.unloadAsync().catch(e => console.log('[Chat] Error unloading sound:', e));
            setPlayingSound(null);
          }
        },
        false
      );

      if (!loadStatus.isLoaded) {
        console.error('[Chat] Sound failed to load:', loadStatus);
        await sound.unloadAsync();
        throw new Error('Impossible de charger la note vocale');
      }

      console.log('[Chat] Sound loaded successfully, starting playback');
      await sound.playAsync();
      setPlayingSound(sound);
      console.log('[Chat] Playing voice note');
    } catch (error) {
      console.error('[Chat] Error playing voice note:', error);
      setPlayingSound(null);
      
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      const isFileNotFound = errorMessage.includes('11800') || errorMessage.includes('17913') || errorMessage.includes('not found');
      
      Alert.alert(
        'Erreur de lecture',
        isFileNotFound 
          ? 'La note vocale n\'existe plus ou est corrompue. Elle a peut-être été supprimée.'
          : `Impossible de lire la note vocale: ${errorMessage}`
      );
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.senderId === user?.id;
    const isSellerView = user?.id === conversation?.sellerId;

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessage : styles.theirMessage,
        ]}
      >
        {item.type === 'text' && (
          <View
            style={[
              styles.messageBubble,
              isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isMyMessage ? styles.myMessageText : styles.theirMessageText,
              ]}
            >
              {item.content}
            </Text>
            <Text
              style={[
                styles.messageTime,
                isMyMessage ? styles.myMessageTime : styles.theirMessageTime,
              ]}
            >
              {new Date(item.createdAt).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        )}

        {item.type === 'image' && item.imageUrl && (
          <View style={styles.imageMessage}>
            <Image source={{ uri: item.imageUrl }} style={styles.messageImage} />
            <Text
              style={[
                styles.messageTime,
                isMyMessage ? styles.myMessageTime : styles.theirMessageTime,
              ]}
            >
              {new Date(item.createdAt).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        )}

        {item.type === 'voice' && item.voiceUrl && (
          <TouchableOpacity
            style={[
              styles.voiceMessage,
              isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble,
            ]}
            onPress={() => playVoiceNote(item.voiceUrl!)}
            activeOpacity={0.8}
          >
            <Mic size={20} color={isMyMessage ? Colors.surface : Colors.primary} />
            <Text
              style={[
                styles.voiceText,
                isMyMessage ? styles.myMessageText : styles.theirMessageText,
              ]}
            >
              Note vocale {item.voiceDuration ? `(${Math.round(item.voiceDuration)}s)` : ''}
            </Text>
            <Text
              style={[
                styles.messageTime,
                isMyMessage ? styles.myMessageTime : styles.theirMessageTime,
              ]}
            >
              {new Date(item.createdAt).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </TouchableOpacity>
        )}

        {item.type === 'offer' && item.offer && (
          <View
            style={[
              styles.offerMessage,
              isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble,
            ]}
          >
            <Text
              style={[
                styles.offerTitle,
                isMyMessage ? styles.myMessageText : styles.theirMessageText,
              ]}
            >
              {item.content}
            </Text>

            {item.offer.status === 'pending' && !isMyMessage && isSellerView && (
              <View style={styles.offerActions}>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => handleAcceptOffer(item)}
                  activeOpacity={0.8}
                >
                  <Check size={16} color={Colors.surface} />
                  <Text style={styles.acceptButtonText}>Accepter</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => handleRejectOffer(item)}
                  activeOpacity={0.8}
                >
                  <X size={16} color={Colors.surface} />
                  <Text style={styles.rejectButtonText}>Refuser</Text>
                </TouchableOpacity>
              </View>
            )}

            {item.offer.status === 'accepted' && (
              <View style={styles.offerStatus}>
                <Check size={16} color={Colors.success} />
                <Text style={styles.offerStatusText}>Offre acceptée</Text>
              </View>
            )}

            {item.offer.status === 'rejected' && (
              <View style={styles.offerStatus}>
                <X size={16} color={Colors.error} />
                <Text style={styles.offerStatusText}>Offre refusée</Text>
              </View>
            )}

            <Text
              style={[
                styles.messageTime,
                isMyMessage ? styles.myMessageTime : styles.theirMessageTime,
              ]}
            >
              {new Date(item.createdAt).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (!conversation || !product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Conversation non trouvée</Text>
      </View>
    );
  }

  const isBuyer = user?.id === conversation.buyerId;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.productHeader}>
        <Image source={{ uri: conversation.productImage }} style={styles.productImage} />
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>
            {conversation.productName}
          </Text>
          <Text style={styles.productPrice}>
            {formatPrice(conversation.productPrice, conversation.currency)}
          </Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleSelectImage}
          activeOpacity={0.8}
        >
          <ImageIcon size={24} color={Colors.primary} />
        </TouchableOpacity>

        {isRecording ? (
          <TouchableOpacity
            style={[styles.input, styles.recordingInput]}
            onPress={handleStopRecording}
            activeOpacity={0.8}
          >
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>Appuyez pour arrêter</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <>
            <TextInput
              style={styles.input}
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Votre message..."
              placeholderTextColor={Colors.textSecondary}
              multiline
            />
            {Platform.OS !== 'web' && (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleStartRecording}
                activeOpacity={0.8}
              >
                <Mic size={24} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </>
        )}

        {isBuyer && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowOfferModal(true)}
            activeOpacity={0.8}
          >
            <CreditCard size={24} color={Colors.secondary} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!messageText.trim()}
          activeOpacity={0.8}
        >
          <Send size={20} color={Colors.surface} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={showOfferModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOfferModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowOfferModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Faire une proposition</Text>
              <TouchableOpacity onPress={() => setShowOfferModal(false)} activeOpacity={0.8}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Prix proposé ({product.currency})</Text>
              <TextInput
                style={styles.modalInput}
                value={offerPrice}
                onChangeText={setOfferPrice}
                placeholder={`Ex: ${product.price}`}
                keyboardType="numeric"
                placeholderTextColor={Colors.textSecondary}
                returnKeyType="done"
                onSubmitEditing={handleSendOffer}
              />
              <Text style={styles.modalHint}>
                Prix original: {formatPrice(product.price, product.currency)}
              </Text>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowOfferModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleSendOffer}
                activeOpacity={0.8}
              >
                <Text style={styles.modalConfirmText}>Envoyer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
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
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: Colors.border,
  },
  productInfo: {
    flex: 1,
    gap: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.primary,
  },
  messagesList: {
    padding: 16,
    gap: 12,
  },
  messageContainer: {
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
  },
  theirMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    gap: 4,
  },
  myMessageBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  theirMessageBubble: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: Colors.surface,
  },
  theirMessageText: {
    color: Colors.text,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  myMessageTime: {
    color: Colors.surface + 'CC',
    alignSelf: 'flex-end',
  },
  theirMessageTime: {
    color: Colors.textSecondary,
    alignSelf: 'flex-end',
  },
  imageMessage: {
    gap: 4,
  },
  messageImage: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: 12,
    backgroundColor: Colors.border,
  },
  voiceMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  voiceText: {
    flex: 1,
    fontSize: 14,
  },
  offerMessage: {
    padding: 12,
    gap: 8,
    minWidth: 200,
  },
  offerTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  offerActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.success,
    padding: 10,
    borderRadius: 8,
  },
  acceptButtonText: {
    color: Colors.surface,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.error,
    padding: 10,
    borderRadius: 8,
  },
  rejectButtonText: {
    color: Colors.surface,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  offerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  offerStatusText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
    maxHeight: 100,
  },
  recordingInput: {
    justifyContent: 'center',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.error,
  },
  recordingText: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '600' as const,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.text,
  },
  modalBody: {
    gap: 12,
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalHint: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
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
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
});
