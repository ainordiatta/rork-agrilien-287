import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal } from 'react-native';
import { Star, ShieldCheck, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Review } from '@/types';

interface ReviewCardProps {
  review: Review;
  canDelete?: boolean;
  onDelete?: (reviewId: string) => void;
}

const ReviewCard = React.memo(({ review, canDelete, onDelete }: ReviewCardProps) => {
  const [imageViewerVisible, setImageViewerVisible] = useState<boolean>(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

  const handleImagePress = useCallback((index: number) => {
    setSelectedImageIndex(index);
    setImageViewerVisible(true);
  }, []);

  const handlePrevImage = useCallback(() => {
    setSelectedImageIndex(prev => Math.max(0, prev - 1));
  }, []);

  const handleNextImage = useCallback(() => {
    if (review.images) {
      setSelectedImageIndex(prev => Math.min(review.images!.length - 1, prev + 1));
    }
  }, [review.images]);

  const renderStars = useCallback((rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={14}
        color={i < rating ? Colors.warning : Colors.border}
        fill={i < rating ? Colors.warning : 'transparent'}
      />
    ));
  }, []);

  const timeAgo = getTimeAgo(review.createdAt);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {review.userPhoto ? (
            <Image source={{ uri: review.userPhoto }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{review.userName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.userMeta}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{review.userName}</Text>
              {review.verified && (
                <View style={styles.verifiedBadge}>
                  <ShieldCheck size={12} color={Colors.primary} />
                  <Text style={styles.verifiedText}>Achat vérifié</Text>
                </View>
              )}
            </View>
            <View style={styles.ratingRow}>
              <View style={styles.stars}>{renderStars(review.rating)}</View>
              <Text style={styles.timeAgo}>{timeAgo}</Text>
            </View>
          </View>
        </View>
        {canDelete && onDelete && (
          <TouchableOpacity onPress={() => onDelete(review.id)} style={styles.deleteBtn} activeOpacity={0.7}>
            <Trash2 size={16} color={Colors.error} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.comment}>{review.comment}</Text>

      {review.images && review.images.length > 0 && (
        <View style={styles.imagesContainer}>
          {review.images.map((uri, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleImagePress(index)}
              activeOpacity={0.8}
            >
              <Image source={{ uri }} style={styles.reviewImage} />
              {index === 2 && review.images!.length > 3 && (
                <View style={styles.moreOverlay}>
                  <Text style={styles.moreText}>+{review.images!.length - 3}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {review.images && review.images.length > 0 && (
        <Modal
          visible={imageViewerVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setImageViewerVisible(false)}
        >
          <View style={styles.viewerOverlay}>
            <TouchableOpacity
              style={styles.viewerCloseBtn}
              onPress={() => setImageViewerVisible(false)}
              activeOpacity={0.7}
            >
              <X size={24} color="#fff" />
            </TouchableOpacity>

            <Image
              source={{ uri: review.images[selectedImageIndex] }}
              style={styles.viewerImage}
              resizeMode="contain"
            />

            <View style={styles.viewerNav}>
              {selectedImageIndex > 0 && (
                <TouchableOpacity onPress={handlePrevImage} style={styles.navBtn} activeOpacity={0.7}>
                  <ChevronLeft size={24} color="#fff" />
                </TouchableOpacity>
              )}
              <Text style={styles.viewerCounter}>
                {selectedImageIndex + 1} / {review.images.length}
              </Text>
              {selectedImageIndex < review.images.length - 1 && (
                <TouchableOpacity onPress={handleNextImage} style={styles.navBtn} activeOpacity={0.7}>
                  <ChevronRight size={24} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
});

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)}j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default ReviewCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfo: {
    flexDirection: 'row',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  userMeta: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primary + '12',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  timeAgo: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  deleteBtn: {
    padding: 4,
  },
  comment: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  imagesContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  reviewImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: Colors.border,
  },
  moreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  viewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerCloseBtn: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  viewerImage: {
    width: '90%',
    height: '70%',
  },
  viewerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginTop: 20,
  },
  navBtn: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  viewerCounter: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600' as const,
  },
});
