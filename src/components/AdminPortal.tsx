import React, { useState, useEffect } from 'react';
import { Shipment, ShipmentStatus, TimelineEvent, PaymentMethod, ServiceType, RouteHub } from '../types';
import {
  formatCurrencyVND,
  formatWeight,
  getStatusInfo,
  generateTrackingCode,
  getCurrentDateTimeFormatted,
  getPaymentMethodLabel,
  getServiceTypeLabel,
} from '../utils/formatters';
import { autoBuildRouteHubs, generateAutoTimelineEvent } from '../utils/geoHubs';
import {
  getSavedSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  upsertShipmentToSupabase,
  deleteShipmentFromSupabase,
  SUPABASE_SQL_HELPER,
  fetchShipmentsFromSupabase,
} from '../services/supabase';
import {
  Lock,
  Package,
  Truck,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
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
  Image as ImageIcon,
  Database,
  Upload,
  Sparkles,
  Navigation,
  RefreshCw,
  Copy,
  CheckCircle,
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
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);

  // Supabase Status State
  const [supabaseConfig, setSupabaseConfig] = useState(getSavedSupabaseConfig);
  const [supabaseStatusMsg, setSupabaseStatusMsg] = useState<string>('');
  const [isTestingSupabase, setIsTestingSupabase] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  // New Shipment Form State
  const initialNewShipment: Partial<Shipment> = {
    trackingCode: generateTrackingCode(),
    senderName: '',
    senderPhone: '0900 123 456',
    senderAddress: '',
    senderCity: 'TP. Hồ Chí Minh',
    receiverName: '',
    receiverPhone: '0900 654 321',
    receiverAddress: '',
    receiverCity: 'Hà Nội',
    packageName: '',
    productImage: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=80',
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

  // Quick milestone form state for edit modal
  const [milestoneLocation, setMilestoneLocation] = useState<string>('Kho Tổng Phân Loại SOC');
  const [milestoneStatus, setMilestoneStatus] = useState<ShipmentStatus>('IN_TRANSIT');
  const [milestoneTitle, setMilestoneTitle] = useState<string>('Đã nhập kho trung chuyển');
  const [milestoneDesc, setMilestoneDesc] = useState<string>('Kiện hàng đã qua máy quét phân loại và chuyển tiếp chặng tiếp theo.');
  const [milestoneShipperName, setMilestoneShipperName] = useState<string>('Bưu tá Trần Văn Nam');
  const [milestoneShipperPhone, setMilestoneShipperPhone] = useState<string>('0900 345 889');

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

  // Image Upload Handler (converts to Base64 data URL)
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'new' | 'edit') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Vui lòng chọn ảnh có kích thước dưới 2MB!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (target === 'new') {
        setNewShipmentData((prev) => ({ ...prev, productImage: base64 }));
      } else if (editingShipment) {
        setEditingShipment((prev) => (prev ? { ...prev, productImage: base64 } : null));
      }
    };
    reader.readAsDataURL(file);
  };

  // Quick Status change with Smart Automated Hub Engine & Supabase Sync
  const handleQuickStatusChange = async (shipmentId: string, newStatus: ShipmentStatus) => {
    const targetShipment = shipments.find((s) => s.id === shipmentId);
    if (!targetShipment) return;

    // Automatically generate realistic hub milestone based on addresses
    const autoEvent = generateAutoTimelineEvent(
      newStatus,
      targetShipment.senderCity,
      targetShipment.senderAddress,
      targetShipment.receiverCity,
      targetShipment.receiverAddress,
      targetShipment.timeline[0]?.shipperName || 'Bưu tá phụ trách',
      targetShipment.timeline[0]?.shipperPhone || '0900 345 889'
    );

    const autoHubs = autoBuildRouteHubs(
      targetShipment.senderCity,
      targetShipment.senderAddress,
      targetShipment.receiverCity,
      targetShipment.receiverAddress
    );

    const updatedShipment: Shipment = {
      ...targetShipment,
      currentStatus: newStatus,
      timeline: [autoEvent, ...targetShipment.timeline],
      autoRouteHubs: autoHubs,
    };

    const updatedList = shipments.map((s) => (s.id === shipmentId ? updatedShipment : s));
    onSaveShipments(updatedList);

    // Sync to Supabase in background
    await upsertShipmentToSupabase(updatedShipment);
  };

  // Delete shipment with Supabase sync
  const handleDeleteShipment = async (id: string, code: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn mã vận đơn ${code}? (Hệ thống sẽ đồng bộ xóa sạch trên Supabase)`)) {
      const updated = shipments.filter((s) => s.id !== id);
      onSaveShipments(updated);
      await deleteShipmentFromSupabase(id);
    }
  };

  // Create new shipment with Smart Hub Routing & Supabase sync
  const handleCreateShipmentSubmit = async (e: React.FormEvent) => {
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
    if (shipments.some((s) => s.trackingCode.toUpperCase() === code)) {
      alert(`Mã vận đơn ${code} đã tồn tại trong hệ thống! Vui lòng chọn mã khác.`);
      return;
    }

    const status = newShipmentData.currentStatus || 'PENDING_PICKUP';
    const senderCity = newShipmentData.senderCity || 'TP. Hồ Chí Minh';
    const senderAddress = newShipmentData.senderAddress || '';
    const receiverCity = newShipmentData.receiverCity || 'Hà Nội';
    const receiverAddress = newShipmentData.receiverAddress || '';

    // Smart Hub Route Generator
    const autoHubs = autoBuildRouteHubs(senderCity, senderAddress, receiverCity, receiverAddress);
    const initialEvent = generateAutoTimelineEvent(
      status,
      senderCity,
      senderAddress,
      receiverCity,
      receiverAddress
    );

    const newShipment: Shipment = {
      id: `ship-${Date.now()}`,
      trackingCode: code,
      senderName: newShipmentData.senderName || '',
      senderPhone: newShipmentData.senderPhone || '0900 123 456',
      senderAddress: senderAddress,
      senderCity: senderCity,
      receiverName: newShipmentData.receiverName || '',
      receiverPhone: newShipmentData.receiverPhone || '0900 654 321',
      receiverAddress: receiverAddress,
      receiverCity: receiverCity,
      packageName: newShipmentData.packageName || 'Kiện hàng bưu phẩm tiêu chuẩn',
      productImage: newShipmentData.productImage,
      weightKg: Number(newShipmentData.weightKg) || 1,
      dimensions: newShipmentData.dimensions || '20 x 15 x 10 cm',
      codAmount: Number(newShipmentData.codAmount) || 0,
      shippingFee: Number(newShipmentData.shippingFee) || 35000,
      paymentMethod: (newShipmentData.paymentMethod as PaymentMethod) || 'NGUOI_NHAN_TRA',
      serviceType: (newShipmentData.serviceType as ServiceType) || 'CHUAN',
      currentStatus: status,
      createdAt: getCurrentDateTimeFormatted(),
      estimatedDelivery: newShipmentData.estimatedDelivery || 'Trong vòng 24h - 48h tới',
      notes: newShipmentData.notes || '',
      timeline: [initialEvent],
      autoRouteHubs: autoHubs,
    };

    const updated = [newShipment, ...shipments];
    onSaveShipments(updated);
    setIsCreateModalOpen(false);
    setNewShipmentData(initialNewShipment);

    // Sync to Supabase
    await upsertShipmentToSupabase(newShipment);
    alert(`Đã tạo thành công mã vận đơn: ${code} và tích hợp tuyến bưu cục tự động!`);
  };

  // Save edited shipment with Supabase sync
  const handleEditShipmentSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShipment) return;

    // Recalculate smart hubs if addresses changed
    const autoHubs = autoBuildRouteHubs(
      editingShipment.senderCity,
      editingShipment.senderAddress,
      editingShipment.receiverCity,
      editingShipment.receiverAddress
    );

    const updatedShipment = {
      ...editingShipment,
      autoRouteHubs: autoHubs,
    };

    const updated = shipments.map((s) => (s.id === updatedShipment.id ? updatedShipment : s));
    onSaveShipments(updated);
    setEditingShipment(null);

    // Sync to Supabase
    await upsertShipmentToSupabase(updatedShipment);
    alert('Đã cập nhật thông tin mã vận đơn và đồng bộ Supabase thành công!');
  };

  // Add custom milestone to edited shipment
  const handleAddMilestoneToEdited = async (e: React.FormEvent) => {
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
    const allUpdated = shipments.map((s) => (s.id === updated.id ? updated : s));
    onSaveShipments(allUpdated);

    await upsertShipmentToSupabase(updated);
    alert('Đã bổ sung mốc hành trình và đồng bộ Supabase!');
  };

  // Delete milestone from edited shipment
  const handleDeleteMilestone = async (evtId: string) => {
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
      await upsertShipmentToSupabase(updated);
    }
  };

  // Supabase Connection Test
  const handleTestSupabase = async () => {
    setIsTestingSupabase(true);
    saveSupabaseConfig(supabaseConfig);
    const result = await testSupabaseConnection();
    setSupabaseStatusMsg(result.message);
    setIsTestingSupabase(false);
  };

  // Sync all local shipments to Supabase
  const handleSyncAllToSupabase = async () => {
    setIsTestingSupabase(true);
    let successCount = 0;
    for (const ship of shipments) {
      const ok = await upsertShipmentToSupabase(ship);
      if (ok) successCount++;
    }
    setIsTestingSupabase(false);
    alert(`Đã đồng bộ ${successCount}/${shipments.length} vận đơn lên cơ sở dữ liệu Supabase!`);
  };

  // Pull data from Supabase
  const handlePullFromSupabase = async () => {
    setIsTestingSupabase(true);
    const cloudData = await fetchShipmentsFromSupabase();
    setIsTestingSupabase(false);
    if (cloudData && cloudData.length > 0) {
      onSaveShipments(cloudData);
      alert(`Đã tải về thành công ${cloudData.length} vận đơn từ Supabase!`);
    } else {
      alert('Không tìm thấy dữ liệu trên Supabase hoặc bảng rỗng.');
    }
  };

  // Filtered shipments
  const filteredShipments = shipments.filter((s) => {
    const matchesSearch =
      s.trackingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.receiverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.packageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.senderAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.receiverAddress.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || s.currentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate live route preview for New Shipment modal
  const previewNewHubs = autoBuildRouteHubs(
    newShipmentData.senderCity || 'TP. Hồ Chí Minh',
    newShipmentData.senderAddress || '',
    newShipmentData.receiverCity || 'Hà Nội',
    newShipmentData.receiverAddress || ''
  );

  // ===================== LOGIN SCREEN =====================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 font-sans relative">
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
              Khu vực bảo mật dành riêng cho quản trị viên
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
              className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg transition-all text-sm cursor-pointer mt-2"
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
            <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center font-bold text-white shadow-md">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight">EXPRESS ADMIN</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  Supabase Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Tự động tích hợp bưu cục trên bản đồ & đồng bộ cơ sở dữ liệu</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Supabase Config Trigger */}
            <button
              onClick={() => setIsSupabaseModalOpen(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold rounded-xl border border-emerald-500/40 transition-colors flex items-center gap-1.5"
              title="Quản lý kết nối cơ sở dữ liệu Supabase"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cơ Sở Dữ Liệu</span> Supabase
            </button>

            <button
              onClick={() => onGoToCustomerTracking()}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden sm:inline">Xem trang</span> Khách
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-xs font-semibold rounded-xl border border-rose-700/60 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* Smart Engine Announcement Banner */}
        <div className="bg-linear-to-r from-orange-500/10 via-amber-500/10 to-blue-500/10 border border-orange-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Tính Năng Tự Động Định Vị Bản Đồ & Gắn Ảnh Sản Phẩm Đã Bật!
              </h3>
              <p className="text-xs text-slate-600">
                Khi nhập địa chỉ gửi & nhận, hệ thống tự động dò bưu cục và kho SOC. Admin chỉ cần bấm đổi trạng thái là hệ thống tự điền trạm và mốc hành trình tương ứng.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setNewShipmentData({
                ...initialNewShipment,
                trackingCode: generateTrackingCode(),
              });
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Tạo Mã Vận Đơn Mới
          </button>
        </div>

        {/* Toolbar & Filter */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã vận đơn, người gửi, người nhận, tên hàng hóa..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
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

          <div className="flex items-center gap-2 shrink-0">
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
              Thay đổi trạng thái tại menu thả xuống sẽ tự động cập nhật trạm bưu cục & bản đồ
            </span>
          </div>

          {filteredShipments.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-700">Không tìm thấy mã vận đơn nào phù hợp!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-4">Ảnh & Mã Đơn</th>
                    <th className="py-3 px-4">Từ Địa Chỉ (Gửi)</th>
                    <th className="py-3 px-4">Giao Đến Địa Chỉ (Nhận)</th>
                    <th className="py-3 px-4">Hàng Hóa & COD</th>
                    <th className="py-3 px-4">Cập Nhật Trạng Thái Tự Động</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredShipments.map((s) => {
                    const statusInfo = getStatusInfo(s.currentStatus);

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Image & Tracking Code */}
                        <td className="py-3.5 px-4 font-mono">
                          <div className="flex items-center gap-2.5">
                            {s.productImage ? (
                              <img
                                src={s.productImage}
                                alt={s.packageName}
                                className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                            <div>
                              <button
                                onClick={() => onGoToCustomerTracking(s.trackingCode)}
                                className="font-bold text-orange-600 hover:text-orange-800 hover:underline flex items-center gap-1 text-sm"
                                title="Mở kiểm tra trên giao diện khách"
                              >
                                {s.trackingCode}
                                <ExternalLink className="w-3 h-3 text-slate-400" />
                              </button>
                              <span className="text-[10px] text-slate-400 font-sans block">
                                {s.createdAt.split(' ')[0]}
                              </span>
                            </div>
                          </div>
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
                          <div className="font-semibold text-slate-800 truncate max-w-[170px]" title={s.packageName}>
                            {s.packageName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {formatWeight(s.weightKg)}
                          </div>
                          <div className="text-xs font-bold text-orange-700 mt-0.5">
                            {s.codAmount > 0 ? `COD: ${formatCurrencyVND(s.codAmount)}` : 'Không COD'}
                          </div>
                        </td>

                        {/* Quick Status Dropdown (Trạng thái tự động gắn bưu cục) */}
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
                          <span className="text-[10px] text-slate-400 block mt-1">
                            📍 {s.timeline[0]?.location ? s.timeline[0].location.split(',')[0] : 'Đang điều phối'}
                          </span>
                        </td>

                        {/* Action buttons */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingShipment(s)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-orange-100 hover:text-orange-700 text-slate-700 transition-colors"
                              title="Chỉnh sửa toàn bộ thông tin & ảnh"
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
                              title="Xóa mã vận đơn này (Đồng bộ xóa Supabase)"
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

      {/* ===================== MODAL: TẠO MÃ VẬN ĐƠN MỚI (CÓ ẢNH & AUTO BƯU CỤC) ===================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 md:p-8 my-8 relative max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Tạo Mã Vận Đơn Mới</h3>
                  <p className="text-xs text-slate-500">Tự động gắn bưu cục trên bản đồ & đồng bộ Supabase</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShipmentSubmit} className="mt-5 space-y-4 text-xs">
              {/* Tracking Code and Service Type */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <div className="border border-blue-200 bg-blue-50/40 p-3.5 rounded-2xl">
                <span className="font-bold text-blue-900 text-xs uppercase flex items-center gap-1.5 mb-2.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  1. Thông Tin Người Gửi (Từ Địa Chỉ...)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">Họ tên người gửi *</label>
                    <input
                      type="text"
                      required
                      value={newShipmentData.senderName}
                      onChange={(e) => setNewShipmentData({ ...newShipmentData, senderName: e.target.value })}
                      placeholder="VD: Cửa Hàng Thời Trang Anna"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">Số điện thoại gửi *</label>
                    <input
                      type="text"
                      required
                      value={newShipmentData.senderPhone}
                      onChange={(e) => setNewShipmentData({ ...newShipmentData, senderPhone: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">Tỉnh / Thành phố gửi *</label>
                    <input
                      type="text"
                      required
                      value={newShipmentData.senderCity}
                      onChange={(e) => setNewShipmentData({ ...newShipmentData, senderCity: e.target.value })}
                      placeholder="VD: TP. Hồ Chí Minh"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">Địa chỉ gửi chi tiết (Từ địa chỉ) *</label>
                    <input
                      type="text"
                      required
                      value={newShipmentData.senderAddress}
                      onChange={(e) => setNewShipmentData({ ...newShipmentData, senderAddress: e.target.value })}
                      placeholder="VD: 02 Hải Triều, P. Bến Nghé, Quận 1"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* RECEIVER INFO (GIAO ĐẾN ĐỊA CHỈ...) */}
              <div className="border border-orange-200 bg-orange-50/40 p-3.5 rounded-2xl">
                <span className="font-bold text-orange-900 text-xs uppercase flex items-center gap-1.5 mb-2.5">
                  <MapPin className="w-3.5 h-3.5 text-orange-600" />
                  2. Thông Tin Người Nhận (Giao Đến Địa Chỉ...)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">Họ tên người nhận *</label>
                    <input
                      type="text"
                      required
                      value={newShipmentData.receiverName}
                      onChange={(e) => setNewShipmentData({ ...newShipmentData, receiverName: e.target.value })}
                      placeholder="VD: Anh Hoàng Long"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">Số điện thoại nhận *</label>
                    <input
                      type="text"
                      required
                      value={newShipmentData.receiverPhone}
                      onChange={(e) => setNewShipmentData({ ...newShipmentData, receiverPhone: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">Tỉnh / Thành phố nhận *</label>
                    <input
                      type="text"
                      required
                      value={newShipmentData.receiverCity}
                      onChange={(e) => setNewShipmentData({ ...newShipmentData, receiverCity: e.target.value })}
                      placeholder="VD: Hà Nội"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">Địa chỉ giao chi tiết (Giao đến địa chỉ) *</label>
                    <input
                      type="text"
                      required
                      value={newShipmentData.receiverAddress}
                      onChange={(e) => setNewShipmentData({ ...newShipmentData, receiverAddress: e.target.value })}
                      placeholder="VD: 48 Ngõ 165 Cầu Giấy, P. Dịch Vọng"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* AUTOMATIC POSTAL HUB DETECTION BADGE */}
              <div className="p-3 bg-slate-900 text-slate-200 rounded-xl border border-slate-800">
                <span className="font-bold text-[11px] text-orange-400 uppercase flex items-center gap-1 mb-1">
                  <Navigation className="w-3.5 h-3.5" />
                  Hệ thống tự động phát hiện trạm bưu cục theo địa chỉ:
                </span>
                <p className="text-[11px] text-slate-300">
                  {previewNewHubs.map((h, i) => (
                    <span key={i}>
                      {h.name} {i < previewNewHubs.length - 1 ? '➔ ' : ''}
                    </span>
                  ))}
                </p>
              </div>

              {/* PRODUCT IMAGE UPLOAD / PRESET */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="font-bold text-slate-800 text-xs uppercase flex items-center gap-1.5 mb-2.5">
                  <ImageIcon className="w-4 h-4 text-orange-600" />
                  Ảnh Sản Phẩm / Bưu Kiện Khi Gửi
                </span>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {newShipmentData.productImage ? (
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-orange-500 shrink-0">
                      <img
                        src={newShipmentData.productImage}
                        alt="Product preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setNewShipmentData({ ...newShipmentData, productImage: '' })}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:bg-rose-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 shrink-0 bg-white">
                      <ImageIcon className="w-6 h-6 mb-1" />
                      <span className="text-[10px]">Chưa có ảnh</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-2 w-full">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Tải ảnh từ thiết bị (Điện thoại / Máy tính):
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageFileUpload(e, 'new')}
                        className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-400">Hoặc chọn mẫu nhanh:</span>
                      <button
                        type="button"
                        onClick={() =>
                          setNewShipmentData({
                            ...newShipmentData,
                            productImage:
                              'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=80',
                          })
                        }
                        className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] hover:bg-orange-100"
                      >
                        Điện thoại
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setNewShipmentData({
                            ...newShipmentData,
                            productImage:
                              'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
                          })
                        }
                        className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] hover:bg-orange-100"
                      >
                        Giày Sneaker
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setNewShipmentData({
                            ...newShipmentData,
                            productImage:
                              'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80',
                          })
                        }
                        className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] hover:bg-orange-100"
                      >
                        Thời trang đầm
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* PACKAGE & CHARGES */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-0.5">Tên mặt hàng</label>
                    <input
                      type="text"
                      value={newShipmentData.packageName}
                      onChange={(e) => setNewShipmentData({ ...newShipmentData, packageName: e.target.value })}
                      placeholder="VD: Quần áo thể thao, Đồng hồ..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">Khối lượng (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newShipmentData.weightKg}
                      onChange={(e) => setNewShipmentData({ ...newShipmentData, weightKg: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">Tiền thu hộ COD (VNĐ)</label>
                    <input
                      type="number"
                      step="1000"
                      value={newShipmentData.codAmount}
                      onChange={(e) => setNewShipmentData({ ...newShipmentData, codAmount: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-orange-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">Cước phí (VNĐ)</label>
                    <input
                      type="number"
                      step="1000"
                      value={newShipmentData.shippingFee}
                      onChange={(e) => setNewShipmentData({ ...newShipmentData, shippingFee: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">Trạng thái khởi tạo</label>
                    <select
                      value={newShipmentData.currentStatus}
                      onChange={(e) =>
                        setNewShipmentData({
                          ...newShipmentData,
                          currentStatus: e.target.value as ShipmentStatus,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
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
                  className="px-5 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Lưu & Tự Động Định Tuyến
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: CHỈNH SỬA CHI TIẾT (CÓ ẢNH & AUTO BƯU CỤC) ===================== */}
      {editingShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full p-6 md:p-8 my-8 relative max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold text-orange-600 uppercase tracking-widest block">
                  Chỉnh Sửa Vận Đơn & Cập Nhật Supabase
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

            <form onSubmit={handleEditShipmentSave} className="mt-4 space-y-4 text-xs">
              {/* Status and Estimated Delivery */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Trạng thái vận đơn</label>
                    <select
                      value={editingShipment.currentStatus}
                      onChange={(e) =>
                        setEditingShipment({
                          ...editingShipment,
                          currentStatus: e.target.value as ShipmentStatus,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
                    >
                      <option value="PENDING_PICKUP">Chờ lấy hàng</option>
                      <option value="PICKED_UP">Đã lấy hàng & Nhập kho</option>
                      <option value="IN_TRANSIT">Đang trung chuyển liên tỉnh</option>
                      <option value="OUT_FOR_DELIVERY">Đang phát hàng (Bưu tá)</option>
                      <option value="DELIVERED">Giao hàng thành công</option>
                      <option value="FAILED_ATTEMPT">Giao không thành công</option>
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
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl"
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
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-orange-600"
                    />
                  </div>
                </div>
              </div>

              {/* Product Image Update */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="font-bold text-slate-800 text-xs uppercase flex items-center gap-1.5 mb-2">
                  <ImageIcon className="w-4 h-4 text-orange-600" />
                  Ảnh Sản Phẩm Bưu Kiện (Khách hàng sẽ nhìn thấy khi tra cứu)
                </span>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {editingShipment.productImage ? (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-orange-500 shrink-0">
                      <img
                        src={editingShipment.productImage}
                        alt="Product"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setEditingShipment({ ...editingShipment, productImage: '' })}
                        className="absolute top-1 right-1 p-0.5 rounded-full bg-black/70 text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0 bg-white">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  )}
                  <div className="flex-1 w-full space-y-1.5">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageFileUpload(e, 'edit')}
                      className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:bg-orange-50 file:text-orange-700"
                    />
                    <input
                      type="text"
                      placeholder="Hoặc dán URL ảnh trực tiếp..."
                      value={editingShipment.productImage || ''}
                      onChange={(e) => setEditingShipment({ ...editingShipment, productImage: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Sender & Receiver Address Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="border border-blue-200 bg-blue-50/40 p-3.5 rounded-2xl space-y-2">
                  <span className="font-bold text-blue-900 uppercase block">1. Người Gửi (Từ địa chỉ...)</span>
                  <input
                    type="text"
                    value={editingShipment.senderName}
                    onChange={(e) => setEditingShipment({ ...editingShipment, senderName: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    value={editingShipment.senderPhone}
                    onChange={(e) => setEditingShipment({ ...editingShipment, senderPhone: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  />
                  <input
                    type="text"
                    value={editingShipment.senderAddress}
                    onChange={(e) => setEditingShipment({ ...editingShipment, senderAddress: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    value={editingShipment.senderCity}
                    onChange={(e) => setEditingShipment({ ...editingShipment, senderCity: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div className="border border-orange-200 bg-orange-50/40 p-3.5 rounded-2xl space-y-2">
                  <span className="font-bold text-orange-900 uppercase block">2. Người Nhận (Giao đến địa chỉ...)</span>
                  <input
                    type="text"
                    value={editingShipment.receiverName}
                    onChange={(e) => setEditingShipment({ ...editingShipment, receiverName: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    value={editingShipment.receiverPhone}
                    onChange={(e) => setEditingShipment({ ...editingShipment, receiverPhone: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  />
                  <input
                    type="text"
                    value={editingShipment.receiverAddress}
                    onChange={(e) => setEditingShipment({ ...editingShipment, receiverAddress: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    value={editingShipment.receiverCity}
                    onChange={(e) => setEditingShipment({ ...editingShipment, receiverCity: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Package Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <label className="font-semibold text-slate-700 block mb-0.5">Tên hàng hóa:</label>
                  <input
                    type="text"
                    value={editingShipment.packageName}
                    onChange={(e) => setEditingShipment({ ...editingShipment, packageName: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-0.5">Ghi chú giao hàng:</label>
                  <input
                    type="text"
                    value={editingShipment.notes || ''}
                    onChange={(e) => setEditingShipment({ ...editingShipment, notes: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* TIMELINE / MILESTONES MANAGER */}
              <div className="border border-slate-300 rounded-2xl p-4 bg-white">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                      Lịch Trình Vận Chuyển ({editingShipment.timeline.length} mốc)
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400">Mốc mới nhất nằm ở trên cùng</span>
                </div>

                {/* Quick Add Milestone Sub-form */}
                <div className="bg-orange-50/50 p-3 rounded-xl border border-orange-200 mb-3 space-y-2">
                  <span className="font-bold text-orange-950 text-[11px] block">
                    + Thêm mốc hành trình thủ công nếu muốn:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={milestoneTitle}
                      onChange={(e) => setMilestoneTitle(e.target.value)}
                      placeholder="Tiêu đề mốc..."
                      className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      value={milestoneLocation}
                      onChange={(e) => setMilestoneLocation(e.target.value)}
                      placeholder="Địa điểm bưu cục..."
                      className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                    <select
                      value={milestoneStatus}
                      onChange={(e) => setMilestoneStatus(e.target.value as ShipmentStatus)}
                      className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                    >
                      <option value="PICKED_UP">Đã lấy hàng</option>
                      <option value="IN_TRANSIT">Đang trung chuyển</option>
                      <option value="OUT_FOR_DELIVERY">Đang giao hàng</option>
                      <option value="DELIVERED">Giao thành công</option>
                      <option value="FAILED_ATTEMPT">Giao không thành công</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={milestoneDesc}
                      onChange={(e) => setMilestoneDesc(e.target.value)}
                      placeholder="Mô tả bưu kiện..."
                      className="flex-1 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddMilestoneToEdited}
                      className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-lg shrink-0"
                    >
                      + Lưu mốc
                    </button>
                  </div>
                </div>

                {/* Timeline list */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {editingShipment.timeline.map((evt, idx) => (
                    <div
                      key={evt.id || idx}
                      className="p-2 rounded-lg border border-slate-200 bg-slate-50 flex items-start justify-between gap-2 text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-slate-900">{evt.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono ml-2">({evt.timestamp})</span>
                        <p className="text-slate-600 text-[11px] truncate">📍 {evt.location}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteMilestone(evt.id)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                        title="Xóa mốc này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => onGoToCustomerTracking(editingShipment.trackingCode)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5"
                >
                  <Eye className="w-4 h-4 text-orange-600" />
                  Xem trang khách hàng
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingShipment(null)}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-100"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5"
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

      {/* ===================== MODAL: KẾT NỐI SUPABASE CLOUD SYNC ===================== */}
      {isSupabaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 md:p-8 my-8 relative max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                    Quản Lý Cơ Sở Dữ Liệu Supabase
                  </h3>
                  <p className="text-xs text-slate-500">Mọi chỉnh sửa và xóa mã sẽ đồng bộ trực tiếp lên Supabase</p>
                </div>
              </div>
              <button
                onClick={() => setIsSupabaseModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {supabaseStatusMsg && (
                <div
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                    supabaseStatusMsg.includes('thành công')
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-amber-50 text-amber-800 border-amber-300'
                  }`}
                >
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{supabaseStatusMsg}</span>
                </div>
              )}

              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Supabase Project URL:
                  </label>
                  <input
                    type="text"
                    value={supabaseConfig.url}
                    onChange={(e) => setSupabaseConfig({ ...supabaseConfig, url: e.target.value.trim() })}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Supabase Anon Key:
                  </label>
                  <input
                    type="password"
                    value={supabaseConfig.anonKey}
                    onChange={(e) => setSupabaseConfig({ ...supabaseConfig, anonKey: e.target.value.trim() })}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isTestingSupabase}
                    onClick={handleTestSupabase}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingSupabase ? 'animate-spin' : ''}`} />
                    Kiểm Tra Kết Nối & Lưu Cấu Hình
                  </button>

                  <button
                    type="button"
                    disabled={isTestingSupabase}
                    onClick={handleSyncAllToSupabase}
                    className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    Đồng bộ toàn bộ dữ liệu lên Supabase
                  </button>

                  <button
                    type="button"
                    disabled={isTestingSupabase}
                    onClick={handlePullFromSupabase}
                    className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    Tải dữ liệu từ Supabase về
                  </button>
                </div>
              </div>

              {/* SQL Setup Helper */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-950 text-slate-300 font-mono text-[11px]">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                  <span className="text-emerald-400 font-bold">Lệnh SQL tạo bảng trong Supabase (Chạy 1 lần):</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(SUPABASE_SQL_HELPER);
                      setCopiedSql(true);
                      setTimeout(() => setCopiedSql(false), 2000);
                    }}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 text-[10px]"
                  >
                    {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedSql ? 'Đã sao chép' : 'Sao chép SQL'}
                  </button>
                </div>
                <pre className="overflow-x-auto text-slate-400 leading-relaxed max-h-36">
                  {SUPABASE_SQL_HELPER}
                </pre>
              </div>

              <div className="text-right pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSupabaseModalOpen(false)}
                  className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
