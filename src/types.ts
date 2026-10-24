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
  timestamp: string; // ISO or YYYY-MM-DD HH:mm:ss
  location: string;
  status: ShipmentStatus;
  title: string;
  description: string;
  shipperName?: string;
  shipperPhone?: string;
}

export type PaymentMethod = 'NGUOI_GUI_TRA' | 'NGUOI_NHAN_TRA' | 'DA_THANH_TOAN';
export type ServiceType = 'HOA_TOC' | 'TIET_KIEM' | 'CHUAN' | 'DONG_GIA';

export interface Shipment {
  id: string;
  trackingCode: string; // e.g. "VNP789234190"
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  senderCity: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverCity: string;
  packageName: string;
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
}
