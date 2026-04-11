import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Video, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Colors from '@/constants/colors';
import { useStories } from '@/contexts/StoriesContext';

export default function AddStoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addStory, deleteStory } = useStories();
  const [videoUri, setVideoUri] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [lastCreatedStoryId, setLastCreatedStoryId] = useState<string | null>(null);

  const pickVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Nous avons besoin de votre permission pour accéder à vos vidéos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('[AddStory] Video selected:', result.assets[0].uri);
        setVideoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner la vidéo');
    }
  };

  const recordVideo = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Nous avons besoin de votre permission pour accéder à la caméra.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('[AddStory] Video recorded:', result.assets[0].uri);
        setVideoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error recording video:', error);
      Alert.alert('Erreur', 'Impossible d\'enregistrer la vidéo');
    }
  };

  const handlePublish = async () => {
    if (!videoUri) {
      Alert.alert('Erreur', 'Veuillez sélectionner ou enregistrer une vidéo');
      return;
    }

    let storyId: string | null = null;

    try {
      setIsUploading(true);
      console.log('[AddStory] Publishing story with video:', videoUri);
      
      storyId = await addStory(videoUri);
      setLastCreatedStoryId(storyId);
      
      Alert.alert('Succès', 'Votre story a été publiée !', [
        {
          text: 'OK',
          onPress: () => {
            setLastCreatedStoryId(null);
            router.back();
          },
        },
      ]);
    } catch (error) {
      console.error('[AddStory] Error publishing story:', error);
      
      if (storyId) {
        Alert.alert(
          'Erreur',
          'Une erreur s\'est produite lors de la publication de votre story.',
          [
            {
              text: 'Supprimer la story',
              style: 'destructive',
              onPress: async () => {
                if (storyId) {
                  try {
                    await deleteStory(storyId);
                    console.log('[AddStory] Story deleted after error:', storyId);
                  } catch (deleteError) {
                    console.error('[AddStory] Error deleting story:', deleteError);
                  }
                }
                setLastCreatedStoryId(null);
                setVideoUri('');
              },
            },
            {
              text: 'Réessayer',
              onPress: () => {
                setLastCreatedStoryId(null);
                handlePublish();
              },
            },
            {
              text: 'Annuler',
              style: 'cancel',
              onPress: () => {
                setLastCreatedStoryId(null);
              },
            },
          ]
        );
      } else {
        Alert.alert('Erreur', 'Impossible de publier la story');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <X size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Ajouter une Story</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <Text style={styles.description}>
            Partagez une vidéo éphémère de vos produits. Elle sera visible pendant 24 heures.
          </Text>

          {videoUri ? (
            <View style={styles.previewContainer}>
              <View style={styles.videoPlaceholder}>
                <Video size={48} color={Colors.primary} />
                <Text style={styles.videoSelectedText}>Vidéo sélectionnée</Text>
                <Text style={styles.videoUriText} numberOfLines={1}>
                  {videoUri.split('/').pop()}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => setVideoUri('')}
                activeOpacity={0.7}
              >
                <Text style={styles.removeButtonText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadSection}>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={recordVideo}
                activeOpacity={0.8}
              >
                <Video size={32} color={Colors.surface} />
                <Text style={styles.uploadButtonText}>Enregistrer une vidéo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.uploadButton, styles.uploadButtonSecondary]}
                onPress={pickVideo}
                activeOpacity={0.8}
              >
                <Video size={32} color={Colors.primary} />
                <Text style={[styles.uploadButtonText, styles.uploadButtonTextSecondary]}>
                  Choisir depuis la galerie
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>À propos des stories</Text>
            <Text style={styles.infoText}>• Durée maximale: 60 secondes</Text>
            <Text style={styles.infoText}>• Visible pendant 24 heures</Text>
            <Text style={styles.infoText}>• Idéal pour présenter vos nouveaux produits</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.publishButton, (!videoUri || isUploading) && styles.publishButtonDisabled]}
            onPress={handlePublish}
            disabled={!videoUri || isUploading}
            activeOpacity={0.8}
          >
            <Text style={styles.publishButtonText}>
              {isUploading ? 'Publication en cours...' : 'Publier la Story'}
            </Text>
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
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  previewContainer: {
    marginBottom: 24,
  },
  videoPlaceholder: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed' as const,
  },
  videoSelectedText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 12,
  },
  videoUriText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  removeButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.error,
    borderRadius: 8,
    alignSelf: 'center',
  },
  removeButtonText: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  uploadSection: {
    gap: 16,
    marginBottom: 24,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  uploadButtonSecondary: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
  uploadButtonTextSecondary: {
    color: Colors.primary,
  },
  infoBox: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  footer: {
    padding: 20,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  publishButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  publishButtonDisabled: {
    backgroundColor: Colors.textSecondary,
    opacity: 0.5,
  },
  publishButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
