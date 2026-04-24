import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Linking
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useState, useEffect, useMemo } from 'react';
import { Phone, Navigation, X, Star, Filter } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { mockShops } from '@/mocks/data';

// Chargement dynamique Leaflet côté client uniquement
let MapContainer: any = null;
let TileLayer: any = null;
let Marker: any = null;
let Popup: any = null;
let L: any = null;

const CATEGORIES = ['Tous', 'Céréales', 'Légumes', 'Fruits', 'Élevage', 'Transformation'];

export default function VendorsMapScreen() {
  const router = useRouter();
  const { selectedCountry } = useApp();
  const [mapReady, setMapReady] = useState(false);
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState('Tous');

  const center: [number, number] = selectedCountry === 'senegal'
    ? [14.6928, -17.4467]
    : [12.6392, -8.0029];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    Promise.all([import('react-leaflet'), import('leaflet')]).then(([rl, leaflet]) => {
      MapContainer = rl.MapContainer;
      TileLayer = rl.TileLayer;
      Marker = rl.Marker;
      Popup = rl.Popup;
      L = leaflet.default;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      setMapReady(true);
    });
  }, []);

  // Shops avec coordonnées simulées autour du Sénégal
  const shopsWithCoords = useMemo(() => {
    const baseCoords = selectedCountry === 'senegal'
      ? { lat: 14.6928, lng: -17.4467 }
      : { lat: 12.6392, lng: -8.0029 };

    return mockShops.map((shop, i) => ({
      ...shop,
      latitude: baseCoords.lat + (Math.random() - 0.5) * 4,
      longitude: baseCoords.lng + (Math.random() - 0.5) * 6,
      category: CATEGORIES[1 + (i % (CATEGORIES.length - 1))],
    }));
  }, [selectedCountry]);

  const filteredShops = useMemo(() => {
    if (selectedCategory === 'Tous') return shopsWithCoords;
    return shopsWithCoords.filter(s => s.category === selectedCategory);
  }, [shopsWithCoords, selectedCategory]);

  const getCustomIcon = (category: string) => {
    if (!L) return undefined;
    const colors: Record<string, string> = {
      'Céréales': '#F59E0B',
      'Légumes': '#10B981',
      'Fruits': '#F97316',
      'Élevage': '#8B5CF6',
      'Transformation': '#3B82F6',
      'Tous': Colors.primary,
    };
    const color = colors[category] || Colors.primary;
    return L.divIcon({
      html: `<div style="background:${color};width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -30],
      className: '',
    });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Carte des Vendeurs',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: '#fff',
        }}
      />

      {/* Filtres catégories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterScroll}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterChip, selectedCategory === cat && styles.filterChipActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.filterText, selectedCategory === cat && styles.filterTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Carte */}
      <View style={styles.mapContainer}>
        {mapReady && MapContainer ? (
          <MapContainer center={center} zoom={7} style={{ width: '100%', height: '100%' }} scrollWheelZoom>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filteredShops.map(shop => (
              <Marker
                key={shop.id}
                position={[shop.latitude, shop.longitude]}
                icon={getCustomIcon(shop.category)}
                eventHandlers={{ click: () => setSelectedShop(shop) }}
              >
                <Popup>
                  <div style={{ minWidth: 160 }}>
                    <strong style={{ color: Colors.primary, fontSize: 14 }}>{shop.name}</strong>
                    <p style={{ margin: '4px 0', fontSize: 12, color: '#666' }}>📍 {shop.city}</p>
                    <p style={{ margin: '4px 0', fontSize: 12 }}>
                      ⭐ {shop.rating?.toFixed(1)} · {shop.category}
                    </p>
                    <button
                      onClick={() => setSelectedShop(shop)}
                      style={{
                        marginTop: 8, background: Colors.primary, color: '#fff',
                        border: 'none', borderRadius: 8, padding: '6px 12px',
                        cursor: 'pointer', fontSize: 12, width: '100%',
                      }}
                    >
                      Voir la boutique
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : (
          <View style={styles.mapLoading}>
            <Text style={styles.mapLoadingEmoji}>🗺️</Text>
            <Text style={styles.mapLoadingText}>Chargement de la carte…</Text>
          </View>
        )}
      </View>

      {/* Compteur */}
      <View style={styles.countBar}>
        <Text style={styles.countText}>
          {filteredShops.length} vendeur{filteredShops.length > 1 ? 's' : ''} sur la carte
        </Text>
      </View>

      {/* Liste scrollable */}
      <ScrollView style={styles.shopList}>
        {filteredShops.map(shop => (
          <TouchableOpacity
            key={shop.id}
            style={styles.shopCard}
            onPress={() => router.push(`/shop/${shop.id}` as any)}
            activeOpacity={0.8}
          >
            <View style={styles.shopCardHeader}>
              <View style={[styles.shopDot, { backgroundColor: Colors.primary }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.shopName}>{shop.name}</Text>
                <Text style={styles.shopCity}>📍 {shop.city} · {shop.category}</Text>
              </View>
              <View style={styles.shopRating}>
                <Star size={12} color={Colors.warning} fill={Colors.warning} />
                <Text style={styles.shopRatingText}>{shop.rating?.toFixed(1)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Modal détail boutique */}
      <Modal visible={!!selectedShop} transparent animationType="slide" onRequestClose={() => setSelectedShop(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedShop(null)}>
              <X color="#666" size={22} />
            </TouchableOpacity>
            {selectedShop && (
              <>
                <Text style={styles.modalTitle}>{selectedShop.name}</Text>
                <Text style={styles.modalSub}>📍 {selectedShop.city} · {selectedShop.category}</Text>
                <View style={styles.modalRating}>
                  <Star size={16} color={Colors.warning} fill={Colors.warning} />
                  <Text style={styles.modalRatingText}>{selectedShop.rating?.toFixed(1)} / 5</Text>
                </View>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => { setSelectedShop(null); router.push(`/shop/${selectedShop.id}` as any); }}
                  >
                    <Text style={styles.actionBtnText}>Voir la boutique</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnOutline]}
                    onPress={() => {
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedShop.latitude},${selectedShop.longitude}`;
                      void Linking.openURL(url);
                    }}
                  >
                    <Navigation size={16} color={Colors.primary} />
                    <Text style={styles.actionBtnOutlineText}>Itinéraire</Text>
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
  container: { flex: 1, backgroundColor: Colors.background },
  filterBar: { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border, maxHeight: 52 },
  filterScroll: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f0f0f0' },
  filterChipActive: { backgroundColor: Colors.primary },
  filterText: { fontSize: 13, color: '#666', fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  mapContainer: { height: 300, backgroundColor: '#e8f5e9' },
  mapLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  mapLoadingEmoji: { fontSize: 40 },
  mapLoadingText: { fontSize: 15, color: Colors.primary, fontWeight: '500' },
  countBar: { padding: 12, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  countText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  shopList: { flex: 1 },
  shopCard: {
    backgroundColor: Colors.surface, margin: 8, marginBottom: 0,
    padding: 14, borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
  },
  shopCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  shopDot: { width: 10, height: 10, borderRadius: 5 },
  shopName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  shopCity: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  shopRating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  shopRatingText: { fontSize: 12, fontWeight: '700', color: Colors.text },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24,
  },
  modalClose: { position: 'absolute', top: 16, right: 16, padding: 8 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  modalSub: { fontSize: 14, color: Colors.textSecondary, marginBottom: 8 },
  modalRating: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  modalRatingText: { fontSize: 16, fontWeight: '700', color: Colors.text },
  modalActions: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flex: 1, backgroundColor: Colors.primary, paddingVertical: 14,
    borderRadius: 12, alignItems: 'center',
  },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  actionBtnOutline: {
    backgroundColor: '#fff', borderWidth: 2, borderColor: Colors.primary,
    flexDirection: 'row', gap: 6,
  },
  actionBtnOutlineText: { color: Colors.primary, fontWeight: '700', fontSize: 15 },
});
