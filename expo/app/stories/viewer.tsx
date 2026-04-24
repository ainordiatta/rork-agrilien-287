import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Modal, Pressable, StatusBar, ActivityIndicator, Alert, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Trash2, Eye, ExternalLink } from 'lucide-react-native';
import { ResizeMode, Video } from 'expo-av';
import Colors from '@/constants/colors';
import { useStories } from '@/contexts/StoriesContext';
import { ShopWithStories, Story } from '@/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 secondes par story


export default function StoryViewerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { groupedStories, markStoryAsViewed, deleteStory, myStories } = useStories();
  const [currentShopIndex, setCurrentShopIndex] = useState<number>(0);
  const [currentStoryIndex, setCurrentStoryIndex] = useState<number>(0);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const videoRef = useRef<Video>(null);
  const hasCleanedUp = useRef<boolean>(false);
  // #25 Barre de progression animée
  const progressAnim = useRef(new Animated.Value(0)).current;
  const progressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);


  const currentShop: ShopWithStories | undefined = groupedStories[currentShopIndex];
  const currentStory: Story | undefined = currentShop?.stories[currentStoryIndex];

  const cleanupAndClose = useCallback(async () => {
    if (hasCleanedUp.current || isClosing) {
      console.log('[StoryViewer] Already closing, skipping...');
      return;
    }

    console.log('[StoryViewer] Cleaning up and closing...');
    hasCleanedUp.current = true;
    setIsClosing(true);

    try {
      const video = videoRef.current;
      if (video) {
        await video.pauseAsync().catch(() => {});
        await video.stopAsync().catch(() => {});
        await video.unloadAsync().catch(() => {});
      }
    } catch (error) {
      console.error('[StoryViewer] Error during cleanup:', error);
    }

    setTimeout(() => {
      router.back();
    }, 100);
  }, [router, isClosing]);

  useEffect(() => {
    if (params.shopId && typeof params.shopId === 'string') {
      const shopIndex = groupedStories.findIndex(s => s.shopId === params.shopId);
      if (shopIndex >= 0) {
        setCurrentShopIndex(shopIndex);
      }
    }
  }, [params.shopId, groupedStories]);

  useEffect(() => {
    if (groupedStories.length > 0 && (!currentShop || !currentStory)) {
      cleanupAndClose();
    }
  }, [currentShop, currentStory, groupedStories.length, cleanupAndClose]);

  useEffect(() => {
    if (currentStory && !currentStory.viewed) {
      markStoryAsViewed(currentStory.id);
      // #25 Incrémenter compteur de vues
      setViewCounts(prev => ({
        ...prev,
        [currentStory.id]: (prev[currentStory.id] || 0) + 1,
      }));
    }

    // #25 Lancer la barre de progression animée
    if (currentStory && !isTransitioning && !isClosing) {
      progressAnim.setValue(0);
      const anim = Animated.timing(progressAnim, {
        toValue: 1,
        duration: STORY_DURATION,
        useNativeDriver: false,
      });
      anim.start(({ finished }) => {
        if (finished && !isClosing && !isTransitioning) {
          void handleNext();
        }
      });
      return () => anim.stop();
    }
  }, [currentStory, markStoryAsViewed, isTransitioning, isClosing]);


  const handleNext = useCallback(async () => {
    if (isClosing || isTransitioning) {
      console.log('[StoryViewer] Already closing or transitioning, skipping handleNext');
      return;
    }

    console.log('[StoryViewer] handleNext called', {
      currentShopIndex,
      currentStoryIndex,
      totalShops: groupedStories.length,
      totalStoriesInShop: currentShop?.stories.length || 0,
    });

    if (!currentShop) {
      console.log('[StoryViewer] No current shop, closing');
      await cleanupAndClose();
      return;
    }

    setIsTransitioning(true);

    try {
      const video = videoRef.current;
      if (video) {
        await video.pauseAsync().catch(() => {});
        await video.stopAsync().catch(() => {});
        await video.unloadAsync().catch(() => {});
      }
    } catch (error) {
      console.error('[StoryViewer] Error stopping video:', error);
    }

    if (currentStoryIndex < currentShop.stories.length - 1) {
      console.log('[StoryViewer] Moving to next story in same shop');
      setCurrentStoryIndex(prev => prev + 1);
      setTimeout(() => setIsTransitioning(false), 100);
    } else if (currentShopIndex < groupedStories.length - 1) {
      console.log('[StoryViewer] Moving to next shop');
      setCurrentShopIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
      setTimeout(() => setIsTransitioning(false), 100);
    } else {
      console.log('[StoryViewer] No more stories, closing');
      setIsTransitioning(false);
      await cleanupAndClose();
    }
  }, [currentShop, currentShopIndex, currentStoryIndex, groupedStories.length, cleanupAndClose, isClosing, isTransitioning]);

  const handlePrevious = useCallback(async () => {
    if (isClosing || isTransitioning) {
      console.log('[StoryViewer] Already closing or transitioning, skipping handlePrevious');
      return;
    }

    console.log('[StoryViewer] handlePrevious called');
    setIsTransitioning(true);

    try {
      const video = videoRef.current;
      if (video) {
        await video.pauseAsync().catch(() => {});
        await video.stopAsync().catch(() => {});
        await video.unloadAsync().catch(() => {});
      }
    } catch (error) {
      console.error('[StoryViewer] Error stopping video:', error);
    }

    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    } else if (currentShopIndex > 0) {
      setCurrentShopIndex(prev => prev - 1);
      const prevShop = groupedStories[currentShopIndex - 1];
      setCurrentStoryIndex(prevShop.stories.length - 1);
    }

    setTimeout(() => setIsTransitioning(false), 100);
  }, [currentStoryIndex, currentShopIndex, groupedStories, isClosing, isTransitioning]);

  const handleClose = async () => {
    await cleanupAndClose();
  };

  const handleDeleteStory = useCallback(async () => {
    if (!currentStory) return;

    Alert.alert(
      'Supprimer la story',
      'Êtes-vous sûr de vouloir supprimer cette story ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('[StoryViewer] Deleting story:', currentStory.id);
              await deleteStory(currentStory.id);

              if (currentShop && currentShop.stories.length === 1) {
                await cleanupAndClose();
              } else {
                await handleNext();
              }
            } catch (error) {
              console.error('[StoryViewer] Error deleting story:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la story');
            }
          },
        },
      ]
    );
  }, [currentStory, currentShop, deleteStory, cleanupAndClose, handleNext]);

  const isMyStory = currentStory ? myStories.some(s => s.id === currentStory.id) : false;

  if (!currentShop || !currentStory || isClosing) {
    return null;
  }

  return (
    <Modal visible={!isClosing} animationType="fade" onRequestClose={handleClose}>
      <StatusBar hidden />
      <View style={styles.container}>
        {isTransitioning ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.surface} />
          </View>
        ) : (
          <Video
            ref={videoRef}
            source={{ uri: currentStory.videoUrl }}
            style={styles.video}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={!isTransitioning && !isClosing}
            isLooping={false}
            onPlaybackStatusUpdate={(status) => {
              if (status.isLoaded && 'didJustFinish' in status && status.didJustFinish) {
                if (!isClosing && !isTransitioning) {
                  console.log('[StoryViewer] Video finished, moving to next');
                  setTimeout(() => {
                    handleNext();
                  }, 200);
                }
              }
              if (!status.isLoaded && status.error) {
                console.error('[StoryViewer] Video error:', status.error);
              }
            }}
          />
        )}

        <View style={styles.overlay}>
          <View style={styles.header}>
            {/* #25 Barre de progression animée */}
            <View style={styles.progressContainer}>
              {currentShop.stories.map((_, index) => (
                <View key={index} style={styles.progressBarTrack}>
                  {index < currentStoryIndex ? (
                    <View style={[styles.progressBarFill, { width: '100%' }]} />
                  ) : index === currentStoryIndex ? (
                    <Animated.View
                      style={[
                        styles.progressBarFill,
                        { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
                      ]}
                    />
                  ) : null}
                </View>
              ))}
            </View>

            <View style={styles.shopInfo}>
              <View style={styles.shopDetails}>
                <View style={styles.shopAvatar}>
                  <Text style={styles.shopAvatarText}>
                    {currentShop.shopName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.shopName}>{currentShop.shopName}</Text>
                  <View style={styles.storyMeta}>
                    <Text style={styles.storyTime}>{getTimeAgo(currentStory.createdAt)}</Text>
                    {/* #25 Compteur de vues */}
                    {isMyStory && (
                      <View style={styles.viewCount}>
                        <Eye size={11} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.viewCountText}>
                          {viewCounts[currentStory.id] || 0}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
              <View style={styles.headerActions}>
                {isMyStory && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleDeleteStory}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={24} color={Colors.surface} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                  activeOpacity={0.7}
                >
                  <X size={28} color={Colors.surface} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.touchAreas}>
            <Pressable style={styles.leftTouchArea} onPress={handlePrevious} />
            <Pressable style={styles.rightTouchArea} onPress={handleNext} />
          </View>

          {/* #25 Lien produit en bas si disponible */}
          {(currentStory as any).productId && (
            <TouchableOpacity
              style={styles.productLink}
              onPress={() => {
                void cleanupAndClose();
                router.push(`/product/${(currentStory as any).productId}` as any);
              }}
              activeOpacity={0.85}
            >
              <ExternalLink size={16} color="#fff" />
              <Text style={styles.productLinkText}>Voir le produit</Text>
            </TouchableOpacity>
          )}
        </View>

      </View>
    </Modal>
  );
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 1) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `il y a ${diffMinutes}m`;
  }
  if (diffHours < 24) {
    return `il y a ${diffHours}h`;
  }
  return 'il y a 24h';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  progressBarTrack: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },

  shopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shopDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shopAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  shopAvatarText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.surface,
  },
  shopName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
  storyTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  storyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  viewCountText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    padding: 4,
  },
  closeButton: {
    padding: 4,
  },
  touchAreas: {
    flex: 1,
    flexDirection: 'row',
  },
  leftTouchArea: { flex: 1 },
  rightTouchArea: { flex: 1 },
  productLink: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  productLinkText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  loadingContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});
