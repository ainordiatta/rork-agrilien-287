import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions
} from 'react-native';
import { Stack } from 'expo-router';
import { useState } from 'react';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

// Données saisonnières Sénégal
const CALENDAR_SENEGAL = [
  {
    crop: 'Mil',
    emoji: '🌾',
    color: '#F59E0B',
    sowing: [5, 6, 7],       // Jun-Août (mois 0-indexé)
    harvest: [9, 10],         // Oct-Nov
    rest: [0, 1, 2, 3, 4, 11],
    tip: 'Semis après les premières pluies de juin. Récolte en octobre-novembre.',
  },
  {
    crop: 'Arachide',
    emoji: '🥜',
    color: '#D97706',
    sowing: [5, 6],
    harvest: [9, 10],
    rest: [0, 1, 2, 3, 4, 7, 8, 11],
    tip: 'Semer en juin-juillet. La récolte se fait 90-120 jours après le semis.',
  },
  {
    crop: 'Riz',
    emoji: '🌾',
    color: '#10B981',
    sowing: [5, 6, 7],
    harvest: [9, 10, 11],
    rest: [0, 1, 2, 3, 4],
    tip: 'Culture en saison des pluies (hivernage). Irrigation possible en contre-saison.',
  },
  {
    crop: 'Tomate',
    emoji: '🍅',
    color: '#EF4444',
    sowing: [9, 10, 11],
    harvest: [1, 2, 3],
    rest: [4, 5, 6, 7, 8],
    tip: 'Plantation en contre-saison (oct-nov). Récolte de janvier à mars.',
  },
  {
    crop: 'Oignon',
    emoji: '🧅',
    color: '#8B5CF6',
    sowing: [10, 11],
    harvest: [2, 3, 4],
    rest: [0, 1, 5, 6, 7, 8, 9],
    tip: 'Semis en pépinière en octobre. Récolte de février à avril.',
  },
  {
    crop: 'Manioc',
    emoji: '🥔',
    color: '#6366F1',
    sowing: [4, 5],
    harvest: [10, 11, 0, 1],
    rest: [2, 3, 6, 7, 8, 9],
    tip: 'Plantation en mai-juin. Peut rester en terre jusqu\'à 24 mois.',
  },
  {
    crop: 'Mangue',
    emoji: '🥭',
    color: '#F97316',
    sowing: [],
    harvest: [3, 4, 5, 6],
    rest: [0, 1, 2, 7, 8, 9, 10, 11],
    tip: 'Récolte d\'avril à juillet selon les variétés. Kent, Keitt, Amélie.',
  },
  {
    crop: 'Maïs',
    emoji: '🌽',
    color: '#EAB308',
    sowing: [5, 6],
    harvest: [8, 9],
    rest: [0, 1, 2, 3, 4, 7, 10, 11],
    tip: 'Semis en juin. Cycle court de 75-90 jours. Récolte en août-septembre.',
  },
];

// Données Mali (légèrement différentes)
const CALENDAR_MALI = [
  ...CALENDAR_SENEGAL,
  {
    crop: 'Sorgho',
    emoji: '🌿',
    color: '#84CC16',
    sowing: [5, 6, 7],
    harvest: [9, 10, 11],
    rest: [0, 1, 2, 3, 4],
    tip: 'Culture principale au Mali. Résistant à la sécheresse.',
  },
  {
    crop: 'Coton',
    emoji: '🌸',
    color: '#F0ABFC',
    sowing: [5, 6],
    harvest: [10, 11, 0],
    rest: [1, 2, 3, 4, 7, 8, 9],
    tip: 'Culture de rente au Mali. Semis en juin, récolte d\'octobre à janvier.',
  },
];

type CropStatus = 'sowing' | 'harvest' | 'rest';

function getStatus(crop: (typeof CALENDAR_SENEGAL)[0], monthIndex: number): CropStatus {
  if (crop.sowing.includes(monthIndex)) return 'sowing';
  if (crop.harvest.includes(monthIndex)) return 'harvest';
  return 'rest';
}

const STATUS_COLORS: Record<CropStatus, string> = {
  sowing: '#3B82F6',
  harvest: '#22C55E',
  rest: '#E5E7EB',
};

const STATUS_LABELS: Record<CropStatus, string> = {
  sowing: '🌱 Semis',
  harvest: '🌾 Récolte',
  rest: '💤 Repos',
};

export default function CalendarScreen() {
  const { selectedCountry } = useApp();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const calendar = selectedCountry === 'senegal' ? CALENDAR_SENEGAL : CALENDAR_MALI;
  const currentMonth = new Date().getMonth();
  const [selectedCrop, setSelectedCrop] = useState<typeof CALENDAR_SENEGAL[0] | null>(null);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Calendrier Agricole',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: '#fff',
        }}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🗓️ Calendrier des Cultures</Text>
          <Text style={styles.headerSub}>
            {selectedCountry === 'senegal' ? '🇸🇳 Sénégal' : '🇲🇱 Mali'} · {new Date().getFullYear()}
          </Text>
        </View>

        {/* Légende */}
        <View style={styles.legend}>
          {(Object.keys(STATUS_COLORS) as CropStatus[]).map((status) => (
            <View key={status} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS[status] }]} />
              <Text style={styles.legendText}>{STATUS_LABELS[status]}</Text>
            </View>
          ))}
        </View>

        {/* Grille calendrier */}
        <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
          {/* En-têtes mois */}
          <View style={styles.monthHeaders}>
            <View style={styles.cropLabelEmpty} />
            {MONTHS.map((m, i) => (
              <View
                key={m}
                style={[styles.monthHeader, i === currentMonth && styles.monthHeaderCurrent]}
              >
                <Text style={[styles.monthText, i === currentMonth && styles.monthTextCurrent]}>
                  {m}
                </Text>
              </View>
            ))}
          </View>

          {/* Rangées cultures */}
          {calendar.map((crop) => (
            <TouchableOpacity
              key={crop.crop}
              style={styles.cropRow}
              onPress={() => setSelectedCrop(selectedCrop?.crop === crop.crop ? null : crop)}
              activeOpacity={0.8}
            >
              <View style={styles.cropLabel}>
                <Text style={styles.cropEmoji}>{crop.emoji}</Text>
                <Text style={styles.cropName}>{crop.crop}</Text>
              </View>
              {MONTHS.map((_, i) => {
                const status = getStatus(crop, i);
                return (
                  <View
                    key={i}
                    style={[
                      styles.cell,
                      { backgroundColor: STATUS_COLORS[status] },
                      i === currentMonth && styles.cellCurrent,
                    ]}
                  />
                );
              })}
            </TouchableOpacity>
          ))}
        </View>

        {/* Conseil culture sélectionnée */}
        {selectedCrop && (
          <View style={[styles.tipCard, { borderLeftColor: selectedCrop.color }]}>
            <Text style={styles.tipTitle}>
              {selectedCrop.emoji} {selectedCrop.crop}
            </Text>
            <Text style={styles.tipText}>{selectedCrop.tip}</Text>
            <View style={styles.tipMonths}>
              <Text style={styles.tipMonthLabel}>🌱 Semis : </Text>
              <Text style={styles.tipMonthValue}>
                {selectedCrop.sowing.length ? selectedCrop.sowing.map(i => MONTHS[i]).join(', ') : 'Plante pérenne'}
              </Text>
            </View>
            <View style={styles.tipMonths}>
              <Text style={styles.tipMonthLabel}>🌾 Récolte : </Text>
              <Text style={styles.tipMonthValue}>
                {selectedCrop.harvest.map(i => MONTHS[i]).join(', ')}
              </Text>
            </View>
          </View>
        )}

        {/* Mois en cours */}
        <View style={styles.currentMonthSection}>
          <Text style={styles.currentMonthTitle}>
            📅 Ce mois-ci : {MONTHS[currentMonth]}
          </Text>
          {calendar
            .filter(crop => crop.sowing.includes(currentMonth) || crop.harvest.includes(currentMonth))
            .map(crop => (
              <View key={crop.crop} style={styles.currentCropItem}>
                <Text style={styles.currentCropEmoji}>{crop.emoji}</Text>
                <View>
                  <Text style={styles.currentCropName}>{crop.crop}</Text>
                  <Text style={[
                    styles.currentCropStatus,
                    { color: crop.sowing.includes(currentMonth) ? STATUS_COLORS.sowing : STATUS_COLORS.harvest }
                  ]}>
                    {crop.sowing.includes(currentMonth) ? '🌱 En cours de semis' : '🌾 En cours de récolte'}
                  </Text>
                </View>
              </View>
            ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    padding: 20,
    paddingBottom: 28,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  legend: {
    flexDirection: 'row',
    gap: 16,
    padding: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexWrap: 'wrap',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: 12, color: Colors.text, fontWeight: '500' },
  grid: { padding: 12, overflowX: 'auto' as any },
  gridDesktop: { maxWidth: 1100, alignSelf: 'center', width: '100%' },
  monthHeaders: { flexDirection: 'row', marginBottom: 4 },
  cropLabelEmpty: { width: 80 },
  monthHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 28,
  },
  monthHeaderCurrent: { backgroundColor: Colors.primary + '20' },
  monthText: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600' },
  monthTextCurrent: { color: Colors.primary, fontWeight: '800' },
  cropRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cropLabel: {
    width: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 8,
    paddingVertical: 10,
  },
  cropEmoji: { fontSize: 16 },
  cropName: { fontSize: 11, fontWeight: '600', color: Colors.text, flexShrink: 1 },
  cell: {
    flex: 1,
    height: 36,
    minWidth: 20,
  },
  cellCurrent: {
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: Colors.primary,
  },
  tipCard: {
    margin: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  tipTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  tipText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 12 },
  tipMonths: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  tipMonthLabel: { fontSize: 13, fontWeight: '600', color: Colors.text },
  tipMonthValue: { fontSize: 13, color: Colors.primary, fontWeight: '500' },
  currentMonthSection: {
    margin: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  currentMonthTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  currentCropItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  currentCropEmoji: { fontSize: 28 },
  currentCropName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  currentCropStatus: { fontSize: 13, fontWeight: '500', marginTop: 2 },
});
