
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  salePrice?: number;
  quantityDiscountThreshold?: number;
  quantityDiscountPercentage?: number;
  stock: number;
  description?: string;
  imageUrl?: string;
  isAiGenerated?: boolean;
  barcode?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface ReceiptItem {
  productId: string;
  name: string;
  priceAtSale: number;
  quantity: number;
  total: number;
  discountApplied?: number;
}

export type PaymentStatus = 'PAID' | 'PENDING' | 'CANCELLED';

export interface Receipt {
  id: string;
  timestamp: number;
  items: ReceiptItem[];
  totalAmount: number;
  customerName?: string;
  customerLocation?: string;
  customerPhone?: string;
  paymentMethod: string;
  status: PaymentStatus;
}

export interface Debtor {
  id: string;
  name: string;
  location: string;
  phone: string;
  totalOwed: number;
  lastUpdate: number;
}

export interface SalesSummary {
  totalRevenue: number;
  totalItemsSold: number;
  totalTransactions: number;
  totalUsers: number;
  periodRevenue: {
    day: number;
    week: number;
    month: number;
    year: number;
  };
  periodCounts: {
    day: number;
    week: number;
    month: number;
    year: number;
  };
}

export type ViewState = 'DASHBOARD' | 'POS' | 'PRODUCTS' | 'ANALYTICS' | 'RECEIPTS' | 'SETTINGS' | 'CHAT' | 'USERS' | 'DEBTORS' | 'SHEET';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
  avatarColor?: string;
  bio?: string;
  joinDate?: number;
}

export interface UserAccount extends User {
  password?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  roomId: string;
  attachment?: {
    name: string;
    type: string;
    url: string;
  };
  translatedText?: string;
  isAudio?: boolean;
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'GROUP' | 'DIRECT';
  participants: string[]; // User IDs
}

export interface PaymentMethodConfig {
  id: string;
  label: string;
  enabled: boolean;
  type: 'CASH' | 'CARD' | 'DIGITAL';
}

export interface AppSettings {
  lowStockThreshold: number;
  paymentMethods: PaymentMethodConfig[];
  themeColor: string;
  googleSheetUrl: string;
  currency: 'USD' | 'NGN';
}
