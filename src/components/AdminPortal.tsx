import React, { useState } from 'react';
import { Shipment, ShipmentStatus, TimelineEvent, PaymentMethod, ServiceType } from '../types';
import {
  formatCurrencyVND,
  formatWeight,
  getStatusInfo,
  generateTrackingCode,
  getCurrentDateTimeFormatted,
  getPaymentMethodLabel,
  getServiceTypeLabel,
} from '../utils/formatters';
import {
  Lock,
  Package,
  Truck,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  CheckCircle,
  Clock,
  MapPin,
  ExternalLink,
  LogOut,
  AlertTriangle,
  RotateCcw,
  Save,
  X,
  Phone,
  User,
  Layers,
  ArrowRight,
  ShieldCheck,
  Eye,
  Check,
} from 'lucide-react';

interface AdminPortalProps {
  shipments: Shipment[];
  onSaveShipments: (updated: Shipment[]) => void;
  onResetShipments: () => void;
  onGoToCustomerTracking: (trackingCode?: string) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  shipments,
  onSaveShipments,
  onResetShipments,
  onGoToCustomerTracking,
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('express_admin_auth') === 'true';
  });
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  // Dashboard Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [quickMilestoneShipment, setQuickMilestoneShipment] = useState<Shipment | null>(null);

  // New Shipment Form State
  const initialNewShipment: Partial<Shipment> = {
    trackingCode: generateTrackingCode(),
    senderName: '',
    senderPhone: '',
    senderAddress: '',
    senderCity: 'TP. Hồ Chí Minh',
    receiverName: '',
    receiverPhone: '',
    receiverAddress: '',
    receiverCity: 'Hà Nội',
    packageName: '',
    weightKg: 1.0,
    dimensions: '25 x 15 x 10 cm',
    codAmount: 0,
    shippingFee: 35000,
    paymentMethod: 'NGUOI_NHAN_TRA',
    serviceType: 'CHUAN',
    currentStatus: 'PENDING_PICKUP',
    notes: 'Cho xem hàng trước khi nhận',
  };
  const [newShipmentData, setNewShipmentData] = useState<Partial<Shipment>>(initialNewShipment);

  // Quick milestone form state
  const [milestoneLocation, setMilestoneLocation] = useState<string>('Kho Tổng Phân Loại SOC');
  const [milestoneStatus, setMilestoneStatus] = useState<ShipmentStatus>('IN_TRANSIT');
  const [milestoneTitle, setMilestoneTitle] = useState<string>('Đã nhập kho trung chuyển');
  const [milestoneDesc, setMilestoneDesc] = useState<string>('Kiện hàng đã qua máy quét phân loại và chuyển tiếp chặng tiếp theo.');
  const [milestoneShipperName, setMilestoneShipperName] = useState<string>('');
  const [milestoneShipperPhone, setMilestoneShipperPhone] = useState<string>('');

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameInput.trim() === 'tsanduongvi123' && passwordInput.trim() === 'duongvi123') {
      setIsAuthenticated(true);
      sessionStorage.setItem('express_admin_auth', 'true');
      setLoginError('');
    } else {
      setLoginError('Tài khoản hoặc mật khẩu quản trị viên không chính xác!');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('express_admin_auth');
    setIsAuthenticated(false);
    onGoToCustomerTracking();
  };

  // Quick Status change from table dropdown
  const handleQuickStatusChange = (shipmentId: string, newStatus: ShipmentStatus) => {
    const updated = shipments.map((s) => {
      if (s.id !== shipmentId) return s;

      const info = getStatusInfo(newStatus);
      const newEvent: TimelineEvent = {
        id: `ev-auto-${Date.now()}`,
        timestamp: getCurrentDateTimeFormatted(),
        location: s.currentStatus === 'OUT_FOR_DELIVERY' || newStatus === 'OUT_FOR_DELIVERY'
          ? `Bưu cục phát ${s.receiverCity}`
          : `Trạm trung chuyển liên tỉnh`,
        status: newStatus,
        title: `Cập nhật trạng thái: ${info.label}`,
        description: info.description,
      };

      return {
        ...s,
        currentStatus: newStatus,
        timeline: [newEvent, ...s.timeline],
      };
    });

    onSaveShipments(updated);
  };

  // Delete shipment
  const handleDeleteShipment = (id: string, code: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn mã vận đơn ${code}?`)) {
      const updated = shipments.filter((s) => s.id !== id);
      onSaveShipments(updated);
    }
  };

  // Create new shipment
  const handleCreateShipmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShipmentData.trackingCode?.trim()) {
      alert('Vui lòng nhập hoặc tự động tạo mã vận đơn!');
      return;
    }
    if (!newShipmentData.senderName?.trim() || !newShipmentData.receiverName?.trim()) {
      alert('Vui lòng nhập họ tên người gửi và người nhận!');
      return;
    }
    if (!newShipmentData.senderAddress?.trim() || !newShipmentData.receiverAddress?.trim()) {
      alert('Vui lòng nhập đầy đủ địa chỉ gửi và địa chỉ nhận hàng!');
      return;
    }

    const code = newShipmentData.trackingCode.trim().toUpperCase().replace(/[\s-]/g, '');
    // Check duplicate
    if (shipments.some((s) => s.trackingCode.toUpperCase() === code)) {
      alert(`Mã vận đơn ${code} đã tồn tại trong hệ thống! Vui lòng chọn mã khác.`);
      return;
    }

    const nowStr = getCurrentDateTimeFormatted();
    const status = newShipmentData.currentStatus || 'PENDING_PICKUP';
    const info = getStatusInfo(status);

    const initialEvent: TimelineEvent = {
      id: `ev-${Date.now()}`,
      timestamp: nowStr,
      location: `${newShipmentData.senderAddress}, ${newShipmentData.senderCity}`,
      status: status,
      title: info.label,
      description: info.description,
    };

    const newShipment: Shipment = {
      id: `ship-${Date.now()}`,
      trackingCode: code,
      senderName: newShipmentData.senderName || '',
      senderPhone: newShipmentData.senderPhone || '',
      senderAddress: newShipmentData.senderAddress || '',
      senderCity: newShipmentData.senderCity || 'TP. Hồ Chí Minh',
      receiverName: newShipmentData.receiverName || '',
      receiverPhone: newShipmentData.receiverPhone || '',
      receiverAddress: newShipmentData.receiverAddress || '',
      receiverCity: newShipmentData.receiverCity || 'Hà Nội',
      packageName: newShipmentData.packageName || 'Kiện hàng bưu phẩm tiêu chuẩn',
      weightKg: Number(newShipmentData.weightKg) || 1,
      dimensions: newShipmentData.dimensions || '20 x 15 x 10 cm',
      codAmount: Number(newShipmentData.codAmount) || 0,
      shippingFee: Number(newShipmentData.shippingFee) || 30000,
      paymentMethod: (newShipmentData.paymentMethod as PaymentMethod) || 'NGUOI_NHAN_TRA',
      serviceType: (newShipmentData.serviceType as ServiceType) || 'CHUAN',
      currentStatus: status,
      createdAt: nowStr,
      estimatedDelivery: newShipmentData.estimatedDelivery || 'Trong vòng 24h - 48h tới',
      notes: newShipmentData.notes || '',
      timeline: [initialEvent],
    };

    onSaveShipments([newShipment, ...shipments]);
    setIsCreateModalOpen(false);
    setNewShipmentData(initialNewShipment);
    alert(`Đã tạo thành công mã vận đơn: ${code}!`);
  };

  // Save edited shipment
  const handleEditShipmentSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShipment) return;

    const updated = shipments.map((s) => (s.id === editingShipment.id ? editingShipment : s));
    onSaveShipments(updated);
    setEditingShipment(null);
    alert('Đã cập nhật thông tin mã vận đơn thành công!');
  };

  // Add milestone to edited shipment
  const handleAddMilestoneToEdited = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShipment) return;

    const newEvt: TimelineEvent = {
      id: `ev-manual-${Date.now()}`,
      timestamp: getCurrentDateTimeFormatted(),
      location: milestoneLocation,
      status: milestoneStatus,
      title: milestoneTitle,
      description: milestoneDesc,
      shipperName: milestoneShipperName.trim() || undefined,
      shipperPhone: milestoneShipperPhone.trim() || undefined,
    };

    const updated: Shipment = {
      ...editingShipment,
      currentStatus: milestoneStatus,
      timeline: [newEvt, ...editingShipment.timeline],
    };

    setEditingShipment(updated);
    // Also save to all
    const allUpdated = shipments.map((s) => (s.id === updated.id ? updated : s));
    onSaveShipments(allUpdated);

    // Reset inputs
    setMilestoneTitle('Đã nhập kho trung chuyển');
    setMilestoneLocation('Kho Tổng Phân Loại SOC');
    setMilestoneDesc('Kiện hàng đã cập bến và đang điều phối.');
    setMilestoneShipperName('');
    setMilestoneShipperPhone('');
    alert('Đã bổ sung mốc hành trình mới thành công!');
  };

  // Delete milestone from edited shipment
  const handleDeleteMilestone = (evtId: string) => {
    if (!editingShipment) return;
    if (window.confirm('Xóa mốc hành trình này?')) {
      const updatedTimeline = editingShipment.timeline.filter((e) => e.id !== evtId);
      const updated: Shipment = {
        ...editingShipment,
        timeline: updatedTimeline,
      };
      setEditingShipment(updated);
      const allUpdated = shipments.map((s) => (s.id === updated.id ? updated : s));
      onSaveShipments(allUpdated);
    }
  };

  // Filtered shipments
  const filteredShipments = shipments.filter((s) => {
    const matchesSearch =
      s.trackingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.receiverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.senderPhone.includes(searchQuery) ||
      s.receiverPhone.includes(searchQuery) ||
      s.senderAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.receiverAddress.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || s.currentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats calculation
  const totalShipments = shipments.length;
  const inTransitCount = shipments.filter((s) => s.currentStatus === 'IN_TRANSIT').length;
  const outForDeliveryCount = shipments.filter((s) => s.currentStatus === 'OUT_FOR_DELIVERY').length;
  const deliveredCount = shipments.filter((s) => s.currentStatus === 'DELIVERED').length;
  const pendingPickupCount = shipments.filter((s) => s.currentStatus === 'PENDING_PICKUP').length;
  const totalCodAmount = shipments.reduce((sum, s) => sum + (s.codAmount || 0), 0);

  // ===================== LOGIN SCREEN =====================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-950 flex flex-col justify-center items-center px-4 font-sans relative">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-slate-700/30 relative z-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-orange-600 text-white flex items-center justify-center mx-auto mb-4 shadow-xl shadow-orange-600/30">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              CỔNG QUẢN TRỊ VIÊN
            </h1>
            <p className="text-xs font-semibold text-orange-600 uppercase tracking-widest mt-1">
              Hệ Thống Vận Hành Express Logistics
            </p>
            <p className="text-slate-500 text-xs mt-2">
              Khu vực bảo mật dành riêng cho ban quản lý và điều phối viên
            </p>
          </div>

          {loginError && (
            <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Tài khoản quản trị viên
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Nhập tên tài khoản..."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:bg-white focus:outline-hidden transition-all text-slate-900 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Mật khẩu quản trị
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:bg-white focus:outline-hidden transition-all text-slate-900 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-linear-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl shadow-lg shadow-orange-600/30 transition-all text-sm cursor-pointer mt-2"
            >
              ĐĂNG NHẬP QUẢN TRỊ
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-200 text-center">
            <button
              onClick={() => onGoToCustomerTracking()}
              className="text-xs text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1 font-medium"
            >
              ← Quay về trang tra cứu khách hàng
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===================== AUTHENTICATED ADMIN DASHBOARD =====================
  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      {/* Top Admin Navbar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center font-bold text-white shadow-md shadow-orange-600/30">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight">EXPRESS ADMIN</span>
                <span className="text-[10px] bg-orange-500/20 text-orange-400 font-mono px-2 py-0.5 rounded-full border border-orange-500/30">
                  PORTAL QUẢN TRỊ
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Điều phối hành trình & Quản lý toàn bộ mã vận đơn</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-300 font-mono">tsanduongvi123</span>
              <span className="text-slate-500">(Admin)</span>
            </div>

            <button
              onClick={() => onGoToCustomerTracking()}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden sm:inline">Xem trang</span> Khách hàng
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-xs font-semibold rounded-xl border border-rose-700/60 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* KPI Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-bold uppercase block">Tổng vận đơn</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block font-mono">{totalShipments}</span>
            <span className="text-[11px] text-slate-400">Tất cả hồ sơ</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-orange-200 shadow-xs bg-orange-50/20">
            <span className="text-xs text-orange-700 font-bold uppercase block">Đang giao hàng</span>
            <span className="text-2xl font-black text-orange-600 mt-1 block font-mono">{outForDeliveryCount}</span>
            <span className="text-[11px] text-orange-600">Bưu tá đang phát</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-indigo-200 shadow-xs bg-indigo-50/20">
            <span className="text-xs text-indigo-700 font-bold uppercase block">Đang trung chuyển</span>
            <span className="text-2xl font-black text-indigo-600 mt-1 block font-mono">{inTransitCount}</span>
            <span className="text-[11px] text-indigo-600">Tại các kho SOC</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/20">
            <span className="text-xs text-emerald-700 font-bold uppercase block">Đã giao thành công</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block font-mono">{deliveredCount}</span>
            <span className="text-[11px] text-emerald-600">Hoàn tất nhận hàng</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs bg-amber-50/20">
            <span className="text-xs text-amber-700 font-bold uppercase block">Chờ lấy hàng</span>
            <span className="text-2xl font-black text-amber-600 mt-1 block font-mono">{pendingPickupCount}</span>
            <span className="text-[11px] text-amber-600">Tại shop người gửi</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-bold uppercase block">Tổng tiền COD</span>
            <span className="text-lg font-black text-slate-900 mt-1 block font-mono truncate">
              {formatCurrencyVND(totalCodAmount)}
            </span>
            <span className="text-[11px] text-slate-400">Đang luân chuyển</span>
          </div>
        </div>

        {/* Toolbar & Action Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search box & filter */}
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã vận đơn, người gửi, người nhận, địa chỉ..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              >
                <option value="ALL">Tất cả trạng thái ({shipments.length})</option>
                <option value="PENDING_PICKUP">Chờ lấy hàng</option>
                <option value="PICKED_UP">Đã lấy hàng & Nhập kho</option>
                <option value="IN_TRANSIT">Đang trung chuyển</option>
                <option value="OUT_FOR_DELIVERY">Đang giao hàng</option>
                <option value="DELIVERED">Giao thành công</option>
                <option value="FAILED_ATTEMPT">Giao không thành công</option>
                <option value="RETURNED">Đang chuyển hoàn</option>
                <option value="CANCELLED">Đã hủy đơn</option>
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                setNewShipmentData({
                  ...initialNewShipment,
                  trackingCode: generateTrackingCode(),
                });
                setIsCreateModalOpen(true);
              }}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Tạo Mã Vận Đơn Mới
            </button>

            <button
              onClick={() => {
                if (window.confirm('Khôi phục danh sách vận đơn ban đầu với các mẫu dữ liệu thực tế?')) {
                  onResetShipments();
                }
              }}
              title="Khôi phục dữ liệu mẫu ban đầu"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Shipments Table List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-sm">
              Danh Sách Vận Đơn Quản Trị ({filteredShipments.length})
            </h2>
            <span className="text-xs text-slate-500">
              Nhấp vào mã đơn để xem trang khách hoặc chỉnh sửa chi tiết
            </span>
          </div>

          {filteredShipments.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-700">Không tìm thấy mã vận đơn nào phù hợp!</p>
              <p className="text-xs text-slate-400 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc bấm &quot;Tạo Mã Vận Đơn Mới&quot;.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-4">Mã Vận Đơn</th>
                    <th className="py-3 px-4">Từ Địa Chỉ (Gửi)</th>
                    <th className="py-3 px-4">Giao Đến Địa Chỉ (Nhận)</th>
                    <th className="py-3 px-4">Hàng Hóa & COD</th>
                    <th className="py-3 px-4">Trạng Thái Hiện Tại</th>
                    <th className="py-3 px-4">Hành Trình</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredShipments.map((s) => {
                    const statusInfo = getStatusInfo(s.currentStatus);
                    const serviceInfo = getServiceTypeLabel(s.serviceType);

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Tracking Code */}
                        <td className="py-3.5 px-4 font-mono">
                          <button
                            onClick={() => onGoToCustomerTracking(s.trackingCode)}
                            className="font-bold text-orange-600 hover:text-orange-800 hover:underline flex items-center gap-1 text-sm"
                            title="Mở kiểm tra trên giao diện khách"
                          >
                            {s.trackingCode}
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </button>
                          <span className="inline-block mt-0.5 text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-sans font-medium">
                            {serviceInfo.tag}
                          </span>
                        </td>

                        {/* Sender */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-bold text-slate-900 text-xs truncate">{s.senderName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{s.senderPhone}</div>
                          <div className="text-[11px] text-slate-600 truncate mt-0.5" title={s.senderAddress}>
                            {s.senderAddress}, <strong>{s.senderCity}</strong>
                          </div>
                        </td>

                        {/* Receiver */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-bold text-slate-900 text-xs truncate">{s.receiverName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{s.receiverPhone}</div>
                          <div className="text-[11px] text-slate-600 truncate mt-0.5" title={s.receiverAddress}>
                            {s.receiverAddress}, <strong>{s.receiverCity}</strong>
                          </div>
                        </td>

                        {/* Package specs */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800 truncate max-w-[180px]" title={s.packageName}>
                            {s.packageName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {formatWeight(s.weightKg)} • {s.dimensions || 'Chuẩn'}
                          </div>
                          <div className="text-xs font-bold text-orange-700 mt-0.5">
                            {s.codAmount > 0 ? `COD: ${formatCurrencyVND(s.codAmount)}` : 'Không COD'}
                          </div>
                        </td>

                        {/* Quick Status Dropdown */}
                        <td className="py-3.5 px-4">
                          <select
                            value={s.currentStatus}
                            onChange={(e) => handleQuickStatusChange(s.id, e.target.value as ShipmentStatus)}
                            className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border focus:outline-hidden cursor-pointer ${statusInfo.badgeClass}`}
                          >
                            <option value="PENDING_PICKUP">Chờ lấy hàng</option>
                            <option value="PICKED_UP">Đã lấy hàng & Nhập kho</option>
                            <option value="IN_TRANSIT">Đang trung chuyển</option>
                            <option value="OUT_FOR_DELIVERY">Đang giao hàng</option>
                            <option value="DELIVERED">Giao thành công</option>
                            <option value="FAILED_ATTEMPT">Giao không thành công</option>
                            <option value="RETURNED">Đang chuyển hoàn</option>
                            <option value="CANCELLED">Đã hủy đơn</option>
                          </select>
                        </td>

                        {/* Timeline snippet */}
                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          <span className="font-semibold text-slate-700 block">
                            {s.timeline.length} trạm ghi nhận
                          </span>
                          <span className="truncate block max-w-[150px] text-[10px] text-slate-400">
                            Gần nhất: {s.timeline[0]?.title || 'Mới tạo'}
                          </span>
                        </td>

                        {/* Action buttons */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingShipment(s)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-orange-100 hover:text-orange-700 text-slate-700 transition-colors"
                              title="Chỉnh sửa toàn bộ thông tin"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => onGoToCustomerTracking(s.trackingCode)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-700 transition-colors"
                              title="Kiểm tra giao diện khách hàng"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteShipment(s.id, s.trackingCode)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-700 transition-colors"
                              title="Xóa mã vận đơn này"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ===================== MODAL: TẠO MÃ VẬN ĐƠN MỚI ===================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 md:p-8 my-8 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Tạo Mã Vận Đơn Mới</h3>
                  <p className="text-xs text-slate-500">Khách hàng có thể dùng mã này để tra cứu ngay sau khi tạo</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShipmentSubmit} className="mt-5 space-y-5 text-xs">
              {/* Tracking Code and Service Type */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Mã Vận Đơn (Tracking Code) *
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        value={newShipmentData.trackingCode}
                        onChange={(e) =>
                          setNewShipmentData({
                            ...newShipmentData,
                            trackingCode: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="Ví dụ: VNP88992211"
                        className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-sm text-slate-900 uppercase focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setNewShipmentData({
                            ...newShipmentData,
                            trackingCode: generateTrackingCode(),
                          })
                        }
                        className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl text-xs transition-colors shrink-0"
                      >
                        Tạo ngẫu nhiên
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Loại Dịch Vụ Vận Chuyển
                    </label>
                    <select
                      value={newShipmentData.serviceType}
                      onChange={(e) =>
                        setNewShipmentData({
                          ...newShipmentData,
                          serviceType: e.target.value as ServiceType,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    >
                      <option value="HOA_TOC">Hỏa Tốc Máy Bay (12h - 24h)</option>
                      <option value="CHUAN">Chuyển Phát Nhanh Tiêu Chuẩn</option>
                      <option value="TIET_KIEM">Chuyển Phát Tiết Kiệm Đường Bộ</option>
                      <option value="DONG_GIA">Giao Đồng Giá Nội Thành</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SENDER INFO (TỪ ĐỊA CHỈ...) */}
              <div className="border border-blue-200 bg-blue-50/40 p-4 rounded-2xl">
                <span className="font-bold text-blue-900 text-sm uppercase flex items-center gap-1.5 mb-3">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  1. Thông Tin Người Gửi (Từ Địa Chỉ...)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Họ tên người gửi *</label>
                    <input
                      type="text"
                      required
                      value={newShipmentData.senderName}
                      onChange={(e) => setNewShipmentData({ ...newShipmentData, senderName: e.target.value })}
                      placeholder="VD: Cửa Hàng Thời Trang Anna"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Số điện thoại người gửi *</label>
                    <input
                      type="text"
                      required
                      value={newShipmentData.senderPhone}
                      onChange={(e) => setNewShipmentData({ ...newShipmentData, senderPhone: e.target.value })}
                      placeholder="VD: 0988 123 456"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Địa chỉ gửi chi tiết (Từ địa chỉ) *</label>
                    <input
                      type="text"
                      required
                      value={newShipmentData.senderAddress}
                      onChange={(e) => setNewShipmentData({ ...newShipmentData, senderAddress: e.target.value })}
                      placeholder="VD: Số 12 Đường Hoa Phượng, Phường 2, Quận Phú Nhuận"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Tỉnh / Thành phố gửi *</label>
                    <input
                      type="text"
                      required
                      value={newShipmentData.senderCity}
                      onChange={(e) => setNewShipmentData({ ...newShipmentData, senderCity: e.target.value })}
                      placeholder="VD: TP. Hồ Chí Minh"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* RECEIVER INFO (GIAO ĐẾN ĐỊA CHỈ...) */}
              <div className="border border-orange-200 bg-orange-50/40 p-4 rounded-2xl">
                <span className="font-bold text-orange-900 text-sm uppercase flex items-center gap-1.5 mb-3">
                  <MapPin className="w-4 h-4 text-orange-600" />
                  2. Thông Tin Người Nhận (Giao Đến Địa Chỉ...)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Họ tên người nhận *</label>
                    <input
                      type="text"
                      required
                      value={newShipmentData.receiverName}
                      onChange={(e) => setNewShipmentData({ ...newShipmentData, receiverName: e.target.value })}
                      placeholder="VD: Nguyễn Văn A"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Số điện thoại người nhận *</label>
                    <input
                      type="text"
                      required
                      value={newShipmentData.receiverPhone}
                      onChange={(e) => setNewShipmentData({ ...newShipmentData, receiverPhone: e.target.value })}
                      placeholder="VD: 0912 345 678"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Địa chỉ giao chi tiết (Giao đến địa chỉ) *</label>
                    <input
                      type="text"
                      required
                      value={newShipmentData.receiverAddress}
                      onChange={(e) => setNewShipmentData({ ...newShipmentData, receiverAddress: e.target.value })}
                      placeholder="VD: Căn hộ 502 Tòa Landmark 81, 720A Điện Biên Phủ, Phường 22, Quận Bình Thạnh"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Tỉnh / Thành phố nhận *</label>
                    <input
                      type="text"
                      required
                      value={newShipmentData.receiverCity}
                      onChange={(e) => setNewShipmentData({ ...newShipmentData, receiverCity: e.target.value })}
                      placeholder="VD: TP. Hồ Chí Minh"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* PACKAGE & CHARGES */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="font-bold text-slate-800 text-sm uppercase flex items-center gap-1.5 mb-3">
                  <Package className="w-4 h-4 text-slate-600" />
                  3. Thông Tin Hàng Hóa & Cước Phí
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Tên mặt hàng / Nội dung bưu gửi</label>
                    <input
                      type="text"
                      value={newShipmentData.packageName}
                      onChange={(e) => setNewShipmentData({ ...newShipmentData, packageName: e.target.value })}
                      placeholder="VD: Quần áo thể thao, Giày dép..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Khối lượng (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newShipmentData.weightKg}
                      onChange={(e) => setNewShipmentData({ ...newShipmentData, weightKg: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tiền thu hộ COD (VNĐ)</label>
                    <input
                      type="number"
                      step="1000"
                      value={newShipmentData.codAmount}
                      onChange={(e) => setNewShipmentData({ ...newShipmentData, codAmount: parseInt(e.target.value, 10) || 0 })}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-orange-600 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Cước vận chuyển (VNĐ)</label>
                    <input
                      type="number"
                      step="1000"
                      value={newShipmentData.shippingFee}
                      onChange={(e) => setNewShipmentData({ ...newShipmentData, shippingFee: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Trạng thái khởi tạo</label>
                    <select
                      value={newShipmentData.currentStatus}
                      onChange={(e) =>
                        setNewShipmentData({
                          ...newShipmentData,
                          currentStatus: e.target.value as ShipmentStatus,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    >
                      <option value="PENDING_PICKUP">Chờ lấy hàng</option>
                      <option value="PICKED_UP">Đã lấy hàng & Nhập kho</option>
                      <option value="IN_TRANSIT">Đang trung chuyển</option>
                      <option value="OUT_FOR_DELIVERY">Đang giao hàng</option>
                      <option value="DELIVERED">Giao thành công</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-600/30 transition-all flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Lưu & Đưa Vào Vận Hành
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: CHỈNH SỬA CHI TIẾT & HÀNH TRÌNH ===================== */}
      {editingShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full p-6 md:p-8 my-8 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold text-orange-600 uppercase tracking-widest block">
                  Chỉnh Sửa Vận Đơn
                </span>
                <h3 className="font-mono font-black text-slate-900 text-xl tracking-wider">
                  {editingShipment.trackingCode}
                </h3>
              </div>
              <button
                onClick={() => setEditingShipment(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Edit Shipment Form */}
            <form onSubmit={handleEditShipmentSave} className="mt-5 space-y-5 text-xs">
              {/* Quick Status and Basic properties */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Trạng thái vận đơn hiện thời</label>
                    <select
                      value={editingShipment.currentStatus}
                      onChange={(e) =>
                        setEditingShipment({
                          ...editingShipment,
                          currentStatus: e.target.value as ShipmentStatus,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    >
                      <option value="PENDING_PICKUP">Chờ lấy hàng</option>
                      <option value="PICKED_UP">Đã lấy hàng & Nhập kho</option>
                      <option value="IN_TRANSIT">Đang trung chuyển liên tỉnh</option>
                      <option value="OUT_FOR_DELIVERY">Đang phát hàng (Bưu tá giao)</option>
                      <option value="DELIVERED">Giao hàng thành công</option>
                      <option value="FAILED_ATTEMPT">Giao không thành công (Hẹn lại)</option>
                      <option value="RETURNED">Đang chuyển hoàn</option>
                      <option value="CANCELLED">Đã hủy đơn</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Dự kiến giao hàng</label>
                    <input
                      type="text"
                      value={editingShipment.estimatedDelivery}
                      onChange={(e) =>
                        setEditingShipment({
                          ...editingShipment,
                          estimatedDelivery: e.target.value,
                        })
                      }
                      placeholder="VD: 2026-10-25 18:00:00"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tiền thu hộ COD (VNĐ)</label>
                    <input
                      type="number"
                      step="1000"
                      value={editingShipment.codAmount}
                      onChange={(e) =>
                        setEditingShipment({
                          ...editingShipment,
                          codAmount: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-orange-600 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* SENDER & RECEIVER EDIT */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sender */}
                <div className="border border-blue-200 bg-blue-50/40 p-4 rounded-2xl space-y-2">
                  <span className="font-bold text-blue-900 uppercase block mb-1">
                    Người Gửi (Từ địa chỉ...)
                  </span>
                  <div>
                    <label className="text-[11px] text-slate-600 font-semibold block">Họ tên người gửi:</label>
                    <input
                      type="text"
                      value={editingShipment.senderName}
                      onChange={(e) => setEditingShipment({ ...editingShipment, senderName: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 font-semibold block">SĐT người gửi:</label>
                    <input
                      type="text"
                      value={editingShipment.senderPhone}
                      onChange={(e) => setEditingShipment({ ...editingShipment, senderPhone: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 font-semibold block">Từ địa chỉ chi tiết:</label>
                    <input
                      type="text"
                      value={editingShipment.senderAddress}
                      onChange={(e) => setEditingShipment({ ...editingShipment, senderAddress: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 font-semibold block">Tỉnh/TP gửi:</label>
                    <input
                      type="text"
                      value={editingShipment.senderCity}
                      onChange={(e) => setEditingShipment({ ...editingShipment, senderCity: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>

                {/* Receiver */}
                <div className="border border-orange-200 bg-orange-50/40 p-4 rounded-2xl space-y-2">
                  <span className="font-bold text-orange-900 uppercase block mb-1">
                    Người Nhận (Giao đến địa chỉ...)
                  </span>
                  <div>
                    <label className="text-[11px] text-slate-600 font-semibold block">Họ tên người nhận:</label>
                    <input
                      type="text"
                      value={editingShipment.receiverName}
                      onChange={(e) => setEditingShipment({ ...editingShipment, receiverName: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 font-semibold block">SĐT người nhận:</label>
                    <input
                      type="text"
                      value={editingShipment.receiverPhone}
                      onChange={(e) => setEditingShipment({ ...editingShipment, receiverPhone: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 font-semibold block">Giao đến địa chỉ chi tiết:</label>
                    <input
                      type="text"
                      value={editingShipment.receiverAddress}
                      onChange={(e) => setEditingShipment({ ...editingShipment, receiverAddress: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 font-semibold block">Tỉnh/TP nhận:</label>
                    <input
                      type="text"
                      value={editingShipment.receiverCity}
                      onChange={(e) => setEditingShipment({ ...editingShipment, receiverCity: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Package Name & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tên hàng hóa bưu kiện:</label>
                  <input
                    type="text"
                    value={editingShipment.packageName}
                    onChange={(e) => setEditingShipment({ ...editingShipment, packageName: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Ghi chú giao hàng:</label>
                  <input
                    type="text"
                    value={editingShipment.notes || ''}
                    onChange={(e) => setEditingShipment({ ...editingShipment, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* TIMELINE / MILESTONES MANAGER */}
              <div className="border border-slate-300 rounded-2xl p-4 sm:p-5 bg-white">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <h4 className="font-bold text-slate-900 text-sm">
                      Lịch Trình Di Chuyển Của Bưu Kiện ({editingShipment.timeline.length} mốc)
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500">Mốc mới nhất nằm ở trên cùng</span>
                </div>

                {/* Add new milestone sub-form */}
                <div className="bg-orange-50/50 p-3.5 rounded-xl border border-orange-200 mb-4 space-y-2.5">
                  <span className="font-bold text-orange-950 text-xs block">
                    + Thêm một mốc hành trình / trạm trung chuyển mới:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-600 font-bold block mb-0.5">Tiêu đề mốc:</label>
                      <input
                        type="text"
                        value={milestoneTitle}
                        onChange={(e) => setMilestoneTitle(e.target.value)}
                        placeholder="VD: Đã đến kho trung chuyển"
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-600 font-bold block mb-0.5">Địa điểm trạm bưu cục:</label>
                      <input
                        type="text"
                        value={milestoneLocation}
                        onChange={(e) => setMilestoneLocation(e.target.value)}
                        placeholder="VD: Kho Củ Chi SOC, TP.HCM"
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-600 font-bold block mb-0.5">Trạng thái gắn kèm:</label>
                      <select
                        value={milestoneStatus}
                        onChange={(e) => setMilestoneStatus(e.target.value as ShipmentStatus)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                      >
                        <option value="PICKED_UP">Đã lấy hàng</option>
                        <option value="IN_TRANSIT">Đang trung chuyển</option>
                        <option value="OUT_FOR_DELIVERY">Đang giao hàng</option>
                        <option value="DELIVERED">Giao thành công</option>
                        <option value="FAILED_ATTEMPT">Giao không thành công</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-600 font-bold block mb-0.5">Mô tả hành trình chi tiết:</label>
                    <input
                      type="text"
                      value={milestoneDesc}
                      onChange={(e) => setMilestoneDesc(e.target.value)}
                      placeholder="VD: Kiện hàng đang được phân tuyến tự động..."
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  {milestoneStatus === 'OUT_FOR_DELIVERY' && (
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-orange-200">
                      <div>
                        <label className="text-[10px] text-slate-600 font-bold block mb-0.5">Tên bưu tá (Shipper):</label>
                        <input
                          type="text"
                          value={milestoneShipperName}
                          onChange={(e) => setMilestoneShipperName(e.target.value)}
                          placeholder="VD: Trần Văn Nam"
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-600 font-bold block mb-0.5">SĐT bưu tá:</label>
                        <input
                          type="text"
                          value={milestoneShipperPhone}
                          onChange={(e) => setMilestoneShipperPhone(e.target.value)}
                          placeholder="VD: 0912 345 678"
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                        />
                      </div>
                    </div>
                  )}

                  <div className="text-right pt-1">
                    <button
                      type="button"
                      onClick={handleAddMilestoneToEdited}
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      + Lưu Thêm Mốc Này
                    </button>
                  </div>
                </div>

                {/* Timeline list */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {editingShipment.timeline.map((evt, idx) => (
                    <div
                      key={evt.id || idx}
                      className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{evt.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({evt.timestamp})</span>
                        </div>
                        <p className="text-slate-600 text-[11px] font-medium mt-0.5">
                          📍 {evt.location}
                        </p>
                        <p className="text-slate-500 text-[11px] mt-0.5">{evt.description}</p>
                        {evt.shipperName && (
                          <span className="inline-block mt-1 text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 text-orange-700 font-semibold">
                            Bưu tá: {evt.shipperName} ({evt.shipperPhone})
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteMilestone(evt.id)}
                        className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 rounded"
                        title="Xóa mốc này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => onGoToCustomerTracking(editingShipment.trackingCode)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-4 h-4 text-orange-600" />
                  Xem thử trên trang khách hàng
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingShipment(null)}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-100 transition-colors"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    Lưu Thay Đổi
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
