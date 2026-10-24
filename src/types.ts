export type ShipmentStatus =
  | 'PENDING_PICKUP'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED_ATTEMPT'
  | 'RETURNED'
  | 'CANCELLED';

export interface TimelineEvent {
  id: string;
  timestamp: string; // YYYY-MM-DD HH:mm:ss
  location: string;
  status: ShipmentStatus;
  title: string;
  description: string;
  shipperName?: string;
  shipperPhone?: string;
  hubType?: 'pickup' | 'hub' | 'delivery';
  coords?: [number, number]; // [lat, lng]
}

export type PaymentMethod = 'NGUOI_GUI_TRA' | 'NGUOI_NHAN_TRA' | 'DA_THANH_TOAN';
export type ServiceType = 'HOA_TOC' | 'TIET_KIEM' | 'CHUAN' | 'DONG_GIA';

export interface RouteHub {
  name: string;
  location: string;
  coords: [number, number];
  type: 'sender' | 'pickup_post' | 'soc_hub' | 'airport_hub' | 'delivery_post' | 'receiver';
}

export interface Shipment {
  id: string;
  trackingCode: string; // e.g. "VNP789234190"
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  senderCity: string;
  senderCoords?: [number, number];
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverCity: string;
  receiverCoords?: [number, number];
  packageName: string;
  productImage?: string; // Base64 or Image URL
  weightKg: number;
  dimensions?: string;
  codAmount: number; // VNĐ
  shippingFee: number; // VNĐ
  paymentMethod: PaymentMethod;
  serviceType: ServiceType;
  currentStatus: ShipmentStatus;
  createdAt: string;
  estimatedDelivery: string;
  notes?: string;
  timeline: TimelineEvent[];
  autoRouteHubs?: RouteHub[];
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  tableName: string;
}
