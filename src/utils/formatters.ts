import { ShipmentStatus, PaymentMethod, ServiceType } from '../types';

export function formatCurrencyVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatWeight(kg: number): string {
  if (kg < 1) {
    return `${Math.round(kg * 1000)} g`;
  }
  return `${kg.toFixed(2)} kg`;
}

export function getStatusInfo(status: ShipmentStatus): {
  label: string;
  shortLabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeClass: string;
  pillBg: string;
  stepIndex: number;
  description: string;
  iconType: 'pending' | 'pickup' | 'transit' | 'delivery' | 'delivered' | 'failed' | 'returned';
} {
  switch (status) {
    case 'PENDING_PICKUP':
      return {
        label: 'Chờ lấy hàng',
        shortLabel: 'Chờ lấy hàng',
        color: 'text-amber-800',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-300',
        badgeClass: 'bg-amber-500 text-white font-bold',
        pillBg: 'bg-amber-100 text-amber-900 border-amber-300',
        stepIndex: 0,
        description: 'Đơn hàng đã được tạo trên hệ thống, bưu tá đang tiếp nhận chuẩn bị đến lấy hàng.',
        iconType: 'pending',
      };
    case 'PICKED_UP':
      return {
        label: 'Đã lấy hàng & Nhập kho',
        shortLabel: 'Đã nhập kho',
        color: 'text-blue-800',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-300',
        badgeClass: 'bg-blue-600 text-white font-bold',
        pillBg: 'bg-blue-100 text-blue-900 border-blue-300',
        stepIndex: 1,
        description: 'Bưu phẩm đã được lấy từ người gửi và nhập kho phân loại xuất phát an toàn.',
        iconType: 'pickup',
      };
    case 'IN_TRANSIT':
      return {
        label: 'Đang trung chuyển',
        shortLabel: 'Trung chuyển',
        color: 'text-indigo-800',
        bgColor: 'bg-indigo-50',
        borderColor: 'border-indigo-300',
        badgeClass: 'bg-indigo-600 text-white font-bold',
        pillBg: 'bg-indigo-100 text-indigo-900 border-indigo-300',
        stepIndex: 2,
        description: 'Bưu kiện đang trên xe chuyên tuyến luân chuyển giữa các kho tổng SOC liên tỉnh.',
        iconType: 'transit',
      };
    case 'OUT_FOR_DELIVERY':
      return {
        label: 'Đang giao hàng',
        shortLabel: 'Đang phát hàng',
        color: 'text-orange-900',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-300',
        badgeClass: 'bg-orange-600 text-white font-bold shadow-md shadow-orange-500/30 animate-pulse',
        pillBg: 'bg-orange-100 text-orange-950 border-orange-300',
        stepIndex: 3,
        description: 'Bưu tá khu vực đang trực tiếp đi giao hàng đến địa chỉ nhận. Vui lòng chú ý điện thoại.',
        iconType: 'delivery',
      };
    case 'DELIVERED':
      return {
        label: 'Giao hàng thành công',
        shortLabel: 'Đã giao thành công',
        color: 'text-emerald-900',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-300',
        badgeClass: 'bg-emerald-600 text-white font-bold',
        pillBg: 'bg-emerald-100 text-emerald-950 border-emerald-300',
        stepIndex: 4,
        description: 'Bưu kiện đã được người nhận ký nhận hoàn tất. Hành trình giao hàng kết thúc tốt đẹp.',
        iconType: 'delivered',
      };
    case 'FAILED_ATTEMPT':
      return {
        label: 'Giao không thành công',
        shortLabel: 'Chưa giao được',
        color: 'text-rose-900',
        bgColor: 'bg-rose-50',
        borderColor: 'border-rose-300',
        badgeClass: 'bg-rose-600 text-white font-bold',
        pillBg: 'bg-rose-100 text-rose-950 border-rose-300',
        stepIndex: 3,
        description: 'Bưu tá chưa liên lạc được với người nhận. Hệ thống sẽ sắp xếp giao lại lần tiếp theo.',
        iconType: 'failed',
      };
    case 'RETURNED':
      return {
        label: 'Đang chuyển hoàn',
        shortLabel: 'Đang chuyển hoàn',
        color: 'text-purple-900',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-300',
        badgeClass: 'bg-purple-600 text-white font-bold',
        pillBg: 'bg-purple-100 text-purple-950 border-purple-300',
        stepIndex: 2,
        description: 'Bưu kiện đang trong quy trình vận chuyển hoàn trả lại cho người gửi.',
        iconType: 'returned',
      };
    case 'CANCELLED':
      return {
        label: 'Đã hủy đơn',
        shortLabel: 'Đã hủy',
        color: 'text-slate-800',
        bgColor: 'bg-slate-100',
        borderColor: 'border-slate-300',
        badgeClass: 'bg-slate-700 text-white font-bold',
        pillBg: 'bg-slate-200 text-slate-800 border-slate-300',
        stepIndex: 0,
        description: 'Đơn vận chuyển đã hủy theo yêu cầu đối soát.',
        iconType: 'pending',
      };
    default:
      return {
        label: 'Đang xử lý',
        shortLabel: 'Đang xử lý',
        color: 'text-slate-800',
        bgColor: 'bg-slate-50',
        borderColor: 'border-slate-300',
        badgeClass: 'bg-slate-600 text-white font-bold',
        pillBg: 'bg-slate-100 text-slate-800 border-slate-300',
        stepIndex: 0,
        description: 'Hệ thống đang cập nhật dữ liệu vận chuyển.',
        iconType: 'transit',
      };
  }
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case 'NGUOI_GUI_TRA':
      return 'Người gửi thanh toán cước';
    case 'NGUOI_NHAN_TRA':
      return 'Người nhận thanh toán khi nhận hàng';
    case 'DA_THANH_TOAN':
      return 'Đã thanh toán trước';
    default:
      return method;
  }
}

export function getServiceTypeLabel(type: ServiceType): { name: string; tag: string } {
  switch (type) {
    case 'HOA_TOC':
      return { name: 'Chuyển Phát Hỏa Tốc', tag: 'Hỏa Tốc 12h - 24h' };
    case 'TIET_KIEM':
      return { name: 'Chuyển Phát Tiết Kiệm', tag: 'Tiết Kiệm Đường Bộ' };
    case 'CHUAN':
      return { name: 'Chuyển Phát Tiêu Chuẩn', tag: 'Tiêu Chuẩn 24h - 48h' };
    case 'DONG_GIA':
      return { name: 'Giao Đồng Giá', tag: 'Nội Thành Trong Ngày' };
    default:
      return { name: 'Chuyển Phát Nhanh', tag: 'Chuyển Phát Nhanh' };
  }
}

export function generateTrackingCode(): string {
  const prefixes = ['VNP', 'EXP', 'JNT', 'VTP', 'GHN'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const randomNum = Math.floor(100000000 + Math.random() * 900000000);
  return `${prefix}${randomNum}`;
}

export function getCurrentDateTimeFormatted(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}:${s}`;
}
