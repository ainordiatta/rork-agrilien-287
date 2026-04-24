export type Country = 'senegal' | 'mali';

export type UserRole = 'acheteur' | 'producteur' | 'admin';

export type Gender = 'male' | 'female' | 'other';

export type AreaUnit = 'hectares' | 'parcelle';

export type ProductionMode = 'traditionnel' | 'semi_moderne' | 'bio';

export type ProductionSeason = 'saison_seche' | 'hivernage' | 'toute_annee';

export interface User {
  id: string;
  role: UserRole;
  isSuperAdmin?: boolean;
  isPremium?: boolean;
  aiGenerationsCount?: number;
  email: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  name: string;
  password?: string;
  gender?: Gender;
  city: string;
  country: Country;
  photo?: string;
  shopPhoto?: string;
  specialties?: string[];
  shopInfo?: {
    name: string;
    specialties: string[];
    city: string;
    ownerFirstName?: string;
    ownerLastName?: string;
    region?: string;
    department?: string;
    farmArea?: number;
    areaUnit?: AreaUnit;
    productionMode?: ProductionMode;
    productionSeasons?: ProductionSeason[];
    isCooperativeMember?: boolean;
    cooperativeName?: string;
  };
  clientInfo?: {
    firstName: string;
    lastName: string;
    city: string;
  };
  createdAt: string;
}

export interface Shop {
  id: string;
  name: string;
  specialties: string[];
  city: string;
  country: Country;
  email: string;
  phone: string;
  photo?: string;
  rating: number;
  reviewCount: number;
  description?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
}

export type MeasurementUnit = 'unite' | 'kg' | 'tonne' | 'sac' | 'caisse' | 'plateau' | 'litre' | 'cagette';

export type ProductQuality = 'standard' | 'premium' | 'bio';

export type DeliveryOption = 'livraison' | 'sur_place' | 'livraison_et_sur_place';

export type PricingModel = 'fixed' | 'per_kg' | 'per_unit' | 'negotiable';

export type ProductAvailability = 'disponible' | 'sur_commande' | 'prochaine_recolte' | 'rupture';

export type ReservationType = 'full_payment' | 'deposit' | 'no_reservation';

export type DeliveryMethod = 'delivery' | 'pickup' | 'both';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  category: string;
  subcategory?: string;
  stock: number;
  shopId: string;
  shop: Shop;
  deliveryMethods: DeliveryMethod[];
  isBoosted: boolean;
  createdAt: string;
  unit: MeasurementUnit;
  pricingModel: PricingModel;
  availability: ProductAvailability;
  availableForReservation?: boolean;
  harvestDate?: string;
  minReservationDeposit?: number;
  reservationType?: ReservationType;
  minOrderQuantity?: number;
  minOrderAmount?: number;
  reservedQuantity?: number;
  estimatedAvailabilityDate?: string;
  certification?: string[];
  origin?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  isReservation?: boolean;
  depositAmount?: number;
  expectedDeliveryDate?: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export type PaymentMethod = 'orange_money' | 'wave' | 'free_money' | 'card' | 'cash' | 'paiement_livraison';

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  subtotal: number;
  deliveryFee: number;
  currency: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  deliveryMethod: DeliveryMethod;
  deliveryAddress?: string;
  deliveryRegion?: string;
  qrCode?: string;
  invoiceUrl?: string;
  createdAt: string;
  deliveredAt?: string;
}

export interface AppState {
  selectedCountry: Country;
  user: User | null;
  isOnboarded: boolean;
}

export type TransactionType = 'vente' | 'achat' | 'transfert' | 'reapprovisionnement';

export interface Transaction {
  id: string;
  type: TransactionType;
  productId: string;
  productName: string;
  quantity: number;
  amount: number;
  date: string;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  products: string[];
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  subcategories: string[];
  productCount: number;
}

export interface InventoryProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  unit: MeasurementUnit;
  category: string;
  subcategory?: string;
  supplierId?: string;
  minStockLevel: number;
  images: string[];
  quality?: ProductQuality;
  availabilityDate?: string;
  deliveryOption?: DeliveryOption;
  createdAt: string;
  updatedAt: string;
}

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface StockAlert {
  productId: string;
  productName: string;
  currentStock: number;
  minStock: number;
  status: StockStatus;
}

export type MessageType = 'text' | 'image' | 'voice' | 'offer';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  type: MessageType;
  content: string;
  imageUrl?: string;
  voiceUrl?: string;
  voiceDuration?: number;
  offer?: {
    price: number;
    currency: string;
    status: 'pending' | 'accepted' | 'rejected';
  };
  createdAt: string;
}

export interface Conversation {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  productPrice: number;
  currency: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  createdAt: string;
}

export interface Story {
  id: string;
  shopId: string;
  shopName: string;
  shopPhoto?: string;
  videoUrl: string;
  thumbnail?: string;
  createdAt: string;
  expiresAt: string;
  viewed?: boolean;
}

export interface ShopWithStories {
  shopId: string;
  shopName: string;
  shopPhoto?: string;
  stories: Story[];
  hasUnviewed: boolean;
}

export type NegotiationType = 'bulk_order' | 'price_adjustment' | 'custom_order';

export type NegotiationStatus = 'pending' | 'counter_offer' | 'accepted' | 'rejected' | 'expired';

export interface Negotiation {
  id: string;
  conversationId: string;
  productId: string;
  productName: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  type: NegotiationType;
  requestedQuantity: number;
  originalPrice: number;
  proposedPrice: number;
  counterPrice?: number;
  status: NegotiationStatus;
  notes?: string;
  createdAt: string;
  expiresAt: string;
  respondedAt?: string;
}

export interface CollectionPoint {
  id: string;
  name: string;
  address: string;
  region: string;
  department?: string;
  latitude: number;
  longitude: number;
  phone: string;
  openingHours: string;
  products: string[];
  shopId?: string;
  shopName?: string;
  photo?: string;
  description?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  productId?: string;
  shopId?: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  images?: string[];
  verified: boolean;
  createdAt: string;
}

export interface Invoice {
  id: string;
  orderId: string;
  invoiceNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  shopId: string;
  shopName: string;
  shopEmail: string;
  shopPhone: string;
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  currency: string;
  paymentMethod: PaymentMethod;
  deliveryAddress?: string;
  createdAt: string;
}

export interface DeliveryFee {
  region: string;
  baseFee: number;
  perKmFee: number;
  minOrder: number;
  freeDeliveryThreshold?: number;
}

export interface FarmerStatistics {
  totalProducts: number;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: {
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }[];
  revenueByPeriod: {
    period: string;
    revenue: number;
    orders: number;
  }[];
  regularClients: {
    userId: string;
    userName: string;
    orderCount: number;
    totalSpent: number;
    lastOrderDate: string;
  }[];
  categoryBreakdown: {
    category: string;
    revenue: number;
    percentage: number;
  }[];
}
