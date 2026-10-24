import { Shipment } from '../types';

export const INITIAL_SHIPMENTS: Shipment[] = [
  {
    id: 'ship-001',
    trackingCode: 'VNP789234190',
    senderName: 'Kho Công Nghệ TechZone Sài Gòn',
    senderPhone: '0900 123 456',
    senderAddress: 'Tòa nhà Bitexco, 02 Hải Triều, Phường Bến Nghé, Quận 1',
    senderCity: 'TP. Hồ Chí Minh',
    receiverName: 'Anh Nguyễn Hoàng Long',
    receiverPhone: '0900 654 321',
    receiverAddress: 'Số 48 Ngõ 165 Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy',
    receiverCity: 'Hà Nội',
    packageName: 'Điện thoại Smartphone Flagship Pro Max + Phụ kiện sạc nhanh 65W',
    weightKg: 0.85,
    dimensions: '20 x 12 x 8 cm',
    codAmount: 18500000,
    shippingFee: 65000,
    paymentMethod: 'NGUOI_NHAN_TRA',
    serviceType: 'HOA_TOC',
    currentStatus: 'OUT_FOR_DELIVERY',
    createdAt: '2026-10-22 08:30:00',
    estimatedDelivery: '2026-10-24 17:00:00',
    notes: 'Hàng giá trị cao, dễ vỡ. Cho khách đồng kiểm ngoại quan trước khi nhận.',
    timeline: [
      {
        id: 'ev-001-5',
        timestamp: '2026-10-24 07:45:12',
        location: 'Bưu cục Cầu Giấy 02, Hà Nội',
        status: 'OUT_FOR_DELIVERY',
        title: 'Bưu tá đang phát hàng',
        description: 'Bưu tá Trần Văn Nam đang trên đường giao hàng đến địa chỉ người nhận. Vui lòng giữ liên lạc điện thoại.',
        shipperName: 'Trần Văn Nam',
        shipperPhone: '0900 345 889',
      },
      {
        id: 'ev-001-4',
        timestamp: '2026-10-23 21:15:00',
        location: 'Kho Tổng Trung Chuyển Bắc Ninh SOC',
        status: 'IN_TRANSIT',
        title: 'Đã xuất kho trung chuyển phân loại',
        description: 'Kiện hàng đã được phân luồng tự động và chuyển lên xe tải chuyên tuyến đến Bưu cục Cầu Giấy.',
      },
      {
        id: 'ev-001-3',
        timestamp: '2026-10-23 09:20:45',
        location: 'Trung tâm khai thác Hàng Không Tân Sơn Nhất (SGN Hub)',
        status: 'IN_TRANSIT',
        title: 'Đã xếp tải lên chuyến bay chuyên dụng',
        description: 'Đơn hàng bay chuyến hỏa tốc SGN - HAN, kiểm tra an ninh hàng không hoàn tất.',
      },
      {
        id: 'ev-001-2',
        timestamp: '2026-10-22 14:10:30',
        location: 'Kho Tiếp Nhận Quận 1 SOC, TP.HCM',
        status: 'PICKED_UP',
        title: 'Nhập kho tiếp nhận thành công',
        description: 'Kiện hàng đã được cân đo đối soát và dán tem niêm phong an toàn.',
      },
      {
        id: 'ev-001-1',
        timestamp: '2026-10-22 08:30:00',
        location: 'Shop Người Gửi (Quận 1, TP.HCM)',
        status: 'PENDING_PICKUP',
        title: 'Tạo đơn hàng thành công',
        description: 'Hệ thống đã ghi nhận thông tin gửi hàng, chờ tài xế lấy hàng tại địa chỉ.',
      },
    ],
  },
  {
    id: 'ship-002',
    trackingCode: 'JNT928173461',
    senderName: 'Thời Trang May Đo EcoStyle',
    senderPhone: '0900 789 012',
    senderAddress: 'Số 112 Đường Lê Duẩn, Phường Thạch Thang, Quận Hải Châu',
    senderCity: 'Đà Nẵng',
    receiverName: 'Chị Phạm Thùy Linh',
    receiverPhone: '0900 223 344',
    receiverAddress: 'Căn hộ B-1402, Chung cư Masteri Thảo Điền, 159 Xa Lộ Hà Nội, P. Thảo Điền',
    receiverCity: 'TP. Thủ Đức, TP. Hồ Chí Minh',
    packageName: 'Bộ đầm thiết kế lụa tơ tằm cao cấp + Hộp quà tặng',
    weightKg: 1.2,
    dimensions: '35 x 25 x 10 cm',
    codAmount: 0,
    shippingFee: 35000,
    paymentMethod: 'DA_THANH_TOAN',
    serviceType: 'CHUAN',
    currentStatus: 'DELIVERED',
    createdAt: '2026-10-20 10:15:00',
    estimatedDelivery: '2026-10-22 12:00:00',
    notes: 'Khách yêu cầu để hàng tại quầy lễ tân nếu vắng nhà.',
    timeline: [
      {
        id: 'ev-002-5',
        timestamp: '2026-10-22 11:30:00',
        location: 'Masteri Thảo Điền, TP. Thủ Đức',
        status: 'DELIVERED',
        title: 'Giao hàng thành công',
        description: 'Người nhận đã ký nhận bưu kiện tại quầy lễ tân chung cư. Hoàn tất hành trình.',
        shipperName: 'Nguyễn Văn Tuấn',
        shipperPhone: '0900 888 122',
      },
      {
        id: 'ev-002-4',
        timestamp: '2026-10-22 08:15:00',
        location: 'Bưu cục Thảo Điền, TP. Thủ Đức',
        status: 'OUT_FOR_DELIVERY',
        title: 'Bưu tá đang giao hàng',
        description: 'Đơn hàng đang được vận chuyển tới người nhận.',
        shipperName: 'Nguyễn Văn Tuấn',
        shipperPhone: '0900 888 122',
      },
      {
        id: 'ev-002-3',
        timestamp: '2026-10-21 16:40:00',
        location: 'Kho Tổng Củ Chi SOC, TP.HCM',
        status: 'IN_TRANSIT',
        title: 'Đã đến kho phân phối khu vực',
        description: 'Kiện hàng cập bến và đang điều phối về bưu cục phát quận huyện.',
      },
      {
        id: 'ev-002-2',
        timestamp: '2026-10-20 18:00:00',
        location: 'Kho Trung Chuyển Đà Nẵng Central Hub',
        status: 'PICKED_UP',
        title: 'Rời trạm gửi hàng',
        description: 'Hàng hóa đã được niêm phong vào thùng container vận chuyển xuyên đêm.',
      },
      {
        id: 'ev-002-1',
        timestamp: '2026-10-20 10:15:00',
        location: 'Cửa hàng EcoStyle (Hải Châu, Đà Nẵng)',
        status: 'PENDING_PICKUP',
        title: 'Đã tạo mã đơn hàng',
        description: 'Người gửi đã in phiếu vận đơn và đóng gói kiện hàng sẵn sàng.',
      },
    ],
  },
  {
    id: 'ship-003',
    trackingCode: 'VTP612984023',
    senderName: 'Công Ty Dược Phẩm Quốc Tế',
    senderPhone: '0900 444 555',
    senderAddress: 'Lô C4 KCN Quế Võ 1, Phường Nam Sơn, TP. Bắc Ninh',
    senderCity: 'Bắc Ninh',
    receiverName: 'Nhà Thuốc Bình Dân - DS. Huy',
    receiverPhone: '0900 555 432',
    receiverAddress: 'Số 154 Đường Trần Phú, Phường Hồng Sơn, TP. Vinh',
    receiverCity: 'Nghệ An',
    packageName: 'Kiện hàng thực phẩm bảo vệ sức khỏe & Dụng cụ y tế đạt chuẩn GSP',
    weightKg: 5.4,
    dimensions: '40 x 30 x 25 cm',
    codAmount: 4320000,
    shippingFee: 92000,
    paymentMethod: 'NGUOI_NHAN_TRA',
    serviceType: 'TIET_KIEM',
    currentStatus: 'IN_TRANSIT',
    createdAt: '2026-10-22 15:45:00',
    estimatedDelivery: '2026-10-25 11:00:00',
    notes: 'Bảo quản nhiệt độ mát dưới 30 độ C. Tránh va đập mạnh.',
    timeline: [
      {
        id: 'ev-003-3',
        timestamp: '2026-10-23 20:10:00',
        location: 'Kho Tổng Nghệ An SOC - TP. Vinh',
        status: 'IN_TRANSIT',
        title: 'Đã nhập kho trung chuyển phân loại tỉnh',
        description: 'Xe container tuyến Bắc - Trung đã cập cảng dỡ hàng, đang kiểm đếm kiện.',
      },
      {
        id: 'ev-003-2',
        timestamp: '2026-10-22 22:30:00',
        location: 'Kho Hub Mê Linh - Hà Nội',
        status: 'IN_TRANSIT',
        title: 'Xuất bến liên tỉnh',
        description: 'Kiện hàng rời Hà Nội di chuyển theo Quốc lộ 1A hướng vào Nghệ An.',
      },
      {
        id: 'ev-003-1',
        timestamp: '2026-10-22 15:45:00',
        location: 'Kho KCN Quế Võ, Bắc Ninh',
        status: 'PENDING_PICKUP',
        title: 'Đã nhận bàn giao từ kho gửi',
        description: 'Tài xế chuyên tuyến đã lấy bưu phẩm nguyên đai nguyên kiện.',
      },
    ],
  },
  {
    id: 'ship-004',
    trackingCode: 'EXP104928571',
    senderName: 'Tiệm Giày Sneaker Station',
    senderPhone: '0900 899 766',
    senderAddress: '450/12 Lê Văn Sỹ, Phường 14, Quận 3',
    senderCity: 'TP. Hồ Chí Minh',
    receiverName: 'Bạn Mai Tiến Đạt',
    receiverPhone: '0900 333 888',
    receiverAddress: 'Khu Đô Thị Ecopark, Xã Xuân Quan, Huyện Văn Giang',
    receiverCity: 'Hưng Yên',
    packageName: 'Giày Thể Thao Sneaker Size 42 + Tất vớ dệt kim cao cấp',
    weightKg: 1.1,
    dimensions: '32 x 20 x 14 cm',
    codAmount: 1250000,
    shippingFee: 45000,
    paymentMethod: 'NGUOI_NHAN_TRA',
    serviceType: 'CHUAN',
    currentStatus: 'PENDING_PICKUP',
    createdAt: '2026-10-23 22:00:00',
    estimatedDelivery: '2026-10-26 18:00:00',
    notes: 'Giao giờ hành chính, gọi trước khi đến.',
    timeline: [
      {
        id: 'ev-004-1',
        timestamp: '2026-10-23 22:00:00',
        location: 'Bưu cục Quận 3 Express Hub, TP.HCM',
        status: 'PENDING_PICKUP',
        title: 'Đã tiếp nhận yêu cầu gửi đơn',
        description: 'Người gửi vừa tạo phiếu vận chuyển. Shipper phụ trách khu vực chuẩn bị đến lấy.',
      },
    ],
  },
];

const STORAGE_KEY = 'express_logistics_shipments_db_v4';

export function getStoredShipments(): Shipment[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SHIPMENTS));
      return INITIAL_SHIPMENTS;
    }
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SHIPMENTS));
      return INITIAL_SHIPMENTS;
    }
    return parsed;
  } catch {
    return INITIAL_SHIPMENTS;
  }
}

export function saveStoredShipments(shipments: Shipment[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shipments));
  } catch (err) {
    console.error('Failed to save shipments to localStorage:', err);
  }
}

export function findShipmentByCode(code: string, shipments: Shipment[]): Shipment | undefined {
  if (!code) return undefined;
  const cleanCode = code.trim().toUpperCase().replace(/[\s-]/g, '');
  return shipments.find(
    (s) => s.trackingCode.toUpperCase().replace(/[\s-]/g, '') === cleanCode
  );
}
