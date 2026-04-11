import { DeliveryFee } from '@/types';

export const DELIVERY_FEES_SENEGAL: DeliveryFee[] = [
  {
    region: 'Dakar',
    baseFee: 2000,
    perKmFee: 200,
    minOrder: 0,
    freeDeliveryThreshold: 50000,
  },
  {
    region: 'Thiès',
    baseFee: 3000,
    perKmFee: 250,
    minOrder: 0,
    freeDeliveryThreshold: 60000,
  },
  {
    region: 'Saint-Louis',
    baseFee: 4000,
    perKmFee: 300,
    minOrder: 0,
    freeDeliveryThreshold: 70000,
  },
  {
    region: 'Diourbel',
    baseFee: 3500,
    perKmFee: 280,
    minOrder: 0,
    freeDeliveryThreshold: 65000,
  },
  {
    region: 'Kaolack',
    baseFee: 4000,
    perKmFee: 300,
    minOrder: 0,
    freeDeliveryThreshold: 70000,
  },
  {
    region: 'Fatick',
    baseFee: 3500,
    perKmFee: 280,
    minOrder: 0,
    freeDeliveryThreshold: 65000,
  },
  {
    region: 'Louga',
    baseFee: 4000,
    perKmFee: 300,
    minOrder: 0,
    freeDeliveryThreshold: 70000,
  },
  {
    region: 'Matam',
    baseFee: 5000,
    perKmFee: 350,
    minOrder: 0,
    freeDeliveryThreshold: 80000,
  },
  {
    region: 'Tambacounda',
    baseFee: 6000,
    perKmFee: 400,
    minOrder: 0,
    freeDeliveryThreshold: 90000,
  },
  {
    region: 'Kolda',
    baseFee: 5500,
    perKmFee: 380,
    minOrder: 0,
    freeDeliveryThreshold: 85000,
  },
  {
    region: 'Ziguinchor',
    baseFee: 6000,
    perKmFee: 400,
    minOrder: 0,
    freeDeliveryThreshold: 90000,
  },
  {
    region: 'Kaffrine',
    baseFee: 4500,
    perKmFee: 320,
    minOrder: 0,
    freeDeliveryThreshold: 75000,
  },
  {
    region: 'Kédougou',
    baseFee: 7000,
    perKmFee: 450,
    minOrder: 0,
    freeDeliveryThreshold: 100000,
  },
  {
    region: 'Sédhiou',
    baseFee: 5500,
    perKmFee: 380,
    minOrder: 0,
    freeDeliveryThreshold: 85000,
  },
];

export const DELIVERY_FEES_MALI: DeliveryFee[] = [
  {
    region: 'Bamako',
    baseFee: 2000,
    perKmFee: 200,
    minOrder: 0,
    freeDeliveryThreshold: 50000,
  },
  {
    region: 'Kayes',
    baseFee: 5000,
    perKmFee: 350,
    minOrder: 0,
    freeDeliveryThreshold: 80000,
  },
  {
    region: 'Koulikoro',
    baseFee: 3500,
    perKmFee: 280,
    minOrder: 0,
    freeDeliveryThreshold: 65000,
  },
  {
    region: 'Sikasso',
    baseFee: 5000,
    perKmFee: 350,
    minOrder: 0,
    freeDeliveryThreshold: 80000,
  },
  {
    region: 'Ségou',
    baseFee: 4000,
    perKmFee: 300,
    minOrder: 0,
    freeDeliveryThreshold: 70000,
  },
  {
    region: 'Mopti',
    baseFee: 6000,
    perKmFee: 400,
    minOrder: 0,
    freeDeliveryThreshold: 90000,
  },
  {
    region: 'Tombouctou',
    baseFee: 8000,
    perKmFee: 500,
    minOrder: 0,
    freeDeliveryThreshold: 120000,
  },
  {
    region: 'Gao',
    baseFee: 8000,
    perKmFee: 500,
    minOrder: 0,
    freeDeliveryThreshold: 120000,
  },
  {
    region: 'Kidal',
    baseFee: 10000,
    perKmFee: 600,
    minOrder: 0,
    freeDeliveryThreshold: 150000,
  },
];

export const calculateDeliveryFee = (
  region: string,
  country: 'senegal' | 'mali',
  orderTotal: number
): number => {
  const fees = country === 'senegal' ? DELIVERY_FEES_SENEGAL : DELIVERY_FEES_MALI;
  const regionFee = fees.find((f) => f.region === region);

  if (!regionFee) {
    return fees[0].baseFee;
  }

  if (regionFee.freeDeliveryThreshold && orderTotal >= regionFee.freeDeliveryThreshold) {
    return 0;
  }

  return regionFee.baseFee;
};
