import { MeasurementUnit, PricingModel, ProductAvailability } from '@/types';

export const MEASUREMENT_UNITS: Record<MeasurementUnit, string> = {
  unite: 'Unité',
  kg: 'Kg',
  tonne: 'Tonne',
  sac: 'Sac',
  caisse: 'Caisse',
  plateau: 'Plateau',
  litre: 'Litre',
  cagette: 'Cagette',
};

export const PRICING_MODELS: Record<PricingModel, string> = {
  fixed: 'Prix fixe',
  per_kg: 'Prix au kilo',
  per_unit: 'Prix à l\'unité',
  negotiable: 'Prix négociable',
};

export const AVAILABILITY_STATUS: Record<ProductAvailability, { label: string; color: string }> = {
  disponible: { label: 'Disponible', color: '#10B981' },
  sur_commande: { label: 'Sur commande', color: '#F59E0B' },
  prochaine_recolte: { label: 'Prochaine récolte', color: '#3B82F6' },
  rupture: { label: 'Rupture de stock', color: '#EF4444' },
};

export const COUNTRIES = {
  senegal: {
    name: 'Sénégal',
    flag: '🇸🇳',
    currency: 'XOF',
    currencySymbol: 'FCFA',
  },
  mali: {
    name: 'Mali',
    flag: '🇲🇱',
    currency: 'XOF',
    currencySymbol: 'FCFA',
  },
};

export const PRODUCT_QUALITY: Record<string, string> = {
  standard: 'Standard',
  premium: 'Premium',
  bio: 'Bio',
};

export const DELIVERY_OPTIONS: Record<string, string> = {
  livraison: 'Livraison',
  sur_place: 'À récupérer sur place',
  livraison_et_sur_place: 'Livraison et disponible sur place',
};

export function formatUnit(unit: MeasurementUnit, quantity: number = 1): string {
  const unitLabel = MEASUREMENT_UNITS[unit];
  if (quantity > 1 && (unit === 'unite' || unit === 'sac' || unit === 'caisse' || unit === 'plateau' || unit === 'cagette')) {
    return `${unitLabel}s`;
  }
  return unitLabel;
}

export function formatPrice(price: number, currency: string, unit?: MeasurementUnit): string {
  const formattedPrice = price.toLocaleString('fr-FR');
  const currencySymbol = currency === 'XOF' ? 'FCFA' : currency;
  
  if (unit) {
    return `${formattedPrice} ${currencySymbol}/${MEASUREMENT_UNITS[unit].toLowerCase()}`;
  }
  
  return `${formattedPrice} ${currencySymbol}`;
}
