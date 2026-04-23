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
import { useState, useMemo, useEffect } from 'react';
import { MapPin, Phone, Clock, Package, X, Navigation } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { mockCollectionPoints } from '@/mocks/data';
import { CollectionPoint } from '@/types';
import { DELIVERY_FEES_SENEGAL, DELIVERY_FEES_MALI } from '@/constants/deliveryFees';

// Chargement dynamique de Leaflet côté client uniquement (pas de SSR)
let MapContainer: any = null;
let TileLayer: any = null;
let Marker: any = null;
let Popup: any = null;
let L: any = null;

export default function CollectionPointsScreen() {
  const { selectedCountry } = useApp();
  const [selectedPoint, setSelectedPoint] = useState<CollectionPoint | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('Tous');
  const [mapReady, setMapReady] = useState(false);

  const deliveryFees = selectedCountry === 'senegal' ? DELIVERY_FEES_SENEGAL : DELIVERY_FEES_MALI;
  const regions = useMemo(() => {
    return ['Tous', ...Array.from(new Set(deliveryFees.map((f) => f.region)))];
  }, [deliveryFees]);

  const filteredPoints = useMemo(() => {
    if (selectedRegion === 'Tous') return mockCollectionPoints;
    return mockCollectionPoints.filter((p) => p.region === selectedRegion);
  }, [selectedRegion]);

  const center: [number, number] = selectedCountry === 'senegal'
    ? [14.6928, -17.4467]
    : [12.6392, -8.0029];

  // Chargement dynamique de Leaflet pour éviter les erreurs SSR
  useEffect(() => {
    if (typeof window === 'undefined') return;

    Promise.all([
      import('react-leaflet'),
      import('leaflet'),
    ]).then(([rl, leaflet]) => {
      MapContainer = rl.MapContainer;
      TileLayer = rl.TileLayer;
      Marker = rl.Marker;
      Popup = rl.Popup;
      L = leaflet.default;

      // Fix icônes Leaflet dans les environnements bundlés
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      setMapReady(true);
    });
  }, []);

  const handleCall = (phone: string) => {
    void Linking.openURL(`tel:${phone}`);
  };

  const handleDirections = (point: CollectionPoint) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${point.latitude},${point.longitude}`;
    void Linking.openURL(url);
  };

  // Icône personnalisée verte AgriLien
  const getCustomIcon = () => {
    if (!L) return undefined;
    return L.divIcon({
      html: `<div style="
        background: ${Colors.primary};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -36],
      className: '',
    });
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

      {/* Filtres par région */}
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

      {/* Carte Leaflet */}
      <View style={styles.mapContainer}>
        {mapReady && MapContainer ? (
          <MapContainer
            center={center}
            zoom={7}
            style={{ width: '100%', height: '100%' }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filteredPoints.map((point) => (
              <Marker
                key={point.id}
                position={[point.latitude, point.longitude]}
                icon={getCustomIcon()}
                eventHandlers={{
                  click: () => setSelectedPoint(point),
                }}
              >
                <Popup>
                  <div style={{ minWidth: 180 }}>
                    <strong style={{ color: Colors.primary, fontSize: 14 }}>
                      {point.name}
                    </strong>
                    <p style={{ margin: '4px 0', fontSize: 12, color: '#666' }}>
                      {point.address}
                    </p>
                    <p style={{ margin: '4px 0', fontSize: 12 }}>
                      🕐 {point.openingHours}
                    </p>
                    <button
                      onClick={() => setSelectedPoint(point)}
                      style={{
                        marginTop: 8,
                        background: Colors.primary,
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '6px 12px',
                        cursor: 'pointer',
                        fontSize: 12,
                        width: '100%',
                      }}
                    >
                      Voir détails
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : (
          <View style={styles.mapLoading}>
            <Text style={styles.mapLoadingText}>🗺️ Chargement de la carte…</Text>
          </View>
        )}
      </View>

      {/* Liste des points */}
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>
          Points de Collecte Disponibles ({filteredPoints.length})
        </Text>
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

      {/* Modal détail point */}
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
                    <Navigation color={Colors.primary} size={20} />
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
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterScroll: { paddingHorizontal: 16, gap: 8 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: Colors.primary },
  filterChipText: { fontSize: 14, color: '#666', fontWeight: '500' },
  filterChipTextActive: { color: '#fff' },
  mapContainer: { height: 300, backgroundColor: '#e8f5e9' },
  mapLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapLoadingText: { fontSize: 16, color: Colors.primary },
  listContainer: { flex: 1, backgroundColor: '#fff', paddingTop: 16 },
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
  pointName: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', flex: 1 },
  pointAddress: { fontSize: 14, color: '#666', marginBottom: 8 },
  pointInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  pointInfoText: { fontSize: 13, color: '#666', flex: 1 },
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
  modalText: { fontSize: 15, color: '#333', flex: 1 },
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
  productTagText: { fontSize: 13, color: '#666', fontWeight: '500' },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', gap: 12 },
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
  actionButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  actionButtonTextSecondary: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
