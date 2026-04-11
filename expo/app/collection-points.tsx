import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Modal,
} from 'react-native';
import { Stack } from 'expo-router';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useState, useMemo } from 'react';
import { MapPin, Phone, Clock, Package, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { mockCollectionPoints } from '@/mocks/data';
import { CollectionPoint } from '@/types';
import { DELIVERY_FEES_SENEGAL, DELIVERY_FEES_MALI } from '@/constants/deliveryFees';

export default function CollectionPointsScreen() {
  const { selectedCountry } = useApp();
  const [selectedPoint, setSelectedPoint] = useState<CollectionPoint | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('Tous');

  const deliveryFees = selectedCountry === 'senegal' ? DELIVERY_FEES_SENEGAL : DELIVERY_FEES_MALI;
  const regions = useMemo(() => {
    return ['Tous', ...Array.from(new Set(deliveryFees.map((f) => f.region)))];
  }, [deliveryFees]);

  const filteredPoints = useMemo(() => {
    if (selectedRegion === 'Tous') {
      return mockCollectionPoints;
    }
    return mockCollectionPoints.filter((p) => p.region === selectedRegion);
  }, [selectedRegion]);

  const initialRegion = {
    latitude: selectedCountry === 'senegal' ? 14.6928 : 12.6392,
    longitude: selectedCountry === 'senegal' ? -17.4467 : -8.0029,
    latitudeDelta: 4,
    longitudeDelta: 4,
  };

  const handleCall = (phone: string) => {
    void Linking.openURL(`tel:${phone}`);
  };

  const handleDirections = (point: CollectionPoint) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${point.latitude},${point.longitude}`;
    void Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Points de Collecte',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: '#fff',
        }}
      />

      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {regions.map((region) => (
            <TouchableOpacity
              key={region}
              style={[
                styles.filterChip,
                selectedRegion === region && styles.filterChipActive,
              ]}
              onPress={() => setSelectedRegion(region)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedRegion === region && styles.filterChipTextActive,
                ]}
              >
                {region}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_DEFAULT}
          style={styles.map}
          initialRegion={initialRegion}
        >
          {filteredPoints.map((point) => (
            <Marker
              key={point.id}
              coordinate={{
                latitude: point.latitude,
                longitude: point.longitude,
              }}
              onPress={() => setSelectedPoint(point)}
            >
              <View style={styles.markerContainer}>
                <MapPin color={Colors.primary} size={32} fill={Colors.primary} />
              </View>
            </Marker>
          ))}
        </MapView>
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Points de Collecte Disponibles</Text>
        <ScrollView>
          {filteredPoints.map((point) => (
            <TouchableOpacity
              key={point.id}
              style={styles.pointCard}
              onPress={() => setSelectedPoint(point)}
            >
              <View style={styles.pointHeader}>
                <MapPin color={Colors.primary} size={20} />
                <Text style={styles.pointName}>{point.name}</Text>
              </View>
              <Text style={styles.pointAddress}>{point.address}</Text>
              <View style={styles.pointInfo}>
                <Clock size={14} color="#666" />
                <Text style={styles.pointInfoText}>{point.openingHours}</Text>
              </View>
              <View style={styles.pointInfo}>
                <Package size={14} color="#666" />
                <Text style={styles.pointInfoText}>
                  {point.products.join(', ')}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Modal
        visible={!!selectedPoint}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedPoint(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setSelectedPoint(null)}
            >
              <X color="#666" size={24} />
            </TouchableOpacity>

            {selectedPoint && (
              <>
                <Text style={styles.modalTitle}>{selectedPoint.name}</Text>
                <Text style={styles.modalSubtitle}>{selectedPoint.region}</Text>

                <View style={styles.modalSection}>
                  <MapPin color={Colors.primary} size={20} />
                  <Text style={styles.modalText}>{selectedPoint.address}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Clock color={Colors.primary} size={20} />
                  <Text style={styles.modalText}>{selectedPoint.openingHours}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Phone color={Colors.primary} size={20} />
                  <Text style={styles.modalText}>{selectedPoint.phone}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Package color={Colors.primary} size={20} />
                  <View style={styles.productsContainer}>
                    {selectedPoint.products.map((product, idx) => (
                      <View key={idx} style={styles.productTag}>
                        <Text style={styles.productTagText}>{product}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {!!selectedPoint.description && (
                  <Text style={styles.modalDescription}>
                    {selectedPoint.description}
                  </Text>
                )}

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleCall(selectedPoint.phone)}
                  >
                    <Phone color="#fff" size={20} />
                    <Text style={styles.actionButtonText}>Appeler</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonSecondary]}
                    onPress={() => handleDirections(selectedPoint)}
                  >
                    <MapPin color={Colors.primary} size={20} />
                    <Text style={styles.actionButtonTextSecondary}>Itinéraire</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  mapContainer: {
    height: 300,
    backgroundColor: '#e0e0e0',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  pointCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pointHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  pointName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
  },
  pointAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  pointInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  pointInfoText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 20,
  },
  modalSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  modalText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  productsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    flex: 1,
  },
  productTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  productTagText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonTextSecondary: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
