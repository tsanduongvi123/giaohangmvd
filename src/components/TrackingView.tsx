import React, { useState, useEffect } from 'react';
import { Shipment, ShipmentStatus } from '../types';
import {
  formatCurrencyVND,
  formatWeight,
  getStatusInfo,
  getPaymentMethodLabel,
  getServiceTypeLabel,
} from '../utils/formatters';
import { PrintReceiptModal } from './PrintReceiptModal';
import {
  Search,
  Package,
  Truck,
  MapPin,
  Clock,
  Phone,
  Copy,
  Check,
  Printer,
  Share2,
  AlertCircle,
  Building2,
  Calendar,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Headphones,
  Navigation,
  FileText,
  Award,
  Globe2,
  Plane,
  BadgeCheck,
  HelpCircle,
  ChevronRight,
  Warehouse,
} from 'lucide-react';

interface TrackingViewProps {
  shipments: Shipment[];
  initialTrackingCode?: string;
  onCodeSearched?: (code: string) => void;
}

export const TrackingView: React.FC<TrackingViewProps> = ({
  shipments,
  initialTrackingCode = '',
  onCodeSearched,
}) => {
  const [searchInput, setSearchInput] = useState<string>(initialTrackingCode || '');
  const [activeShipment, setActiveShipment] = useState<Shipment | null>(() => {
    if (!initialTrackingCode) return null;
    const clean = initialTrackingCode.trim().toUpperCase().replace(/[\s-]/g, '');
    return shipments.find((s) => s.trackingCode.toUpperCase().replace(/[\s-]/g, '') === clean) || null;
  });
  const [searchedCode, setSearchedCode] = useState<string>(initialTrackingCode || '');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(Boolean(initialTrackingCode));
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  useEffect(() => {
    if (initialTrackingCode) {
      setSearchInput(initialTrackingCode);
      const clean = initialTrackingCode.trim().toUpperCase().replace(/[\s-]/g, '');
      const found = shipments.find((s) => s.trackingCode.toUpperCase().replace(/[\s-]/g, '') === clean);
      setActiveShipment(found || null);
      setSearchedCode(initialTrackingCode);
      setHasSearched(true);
    }
  }, [initialTrackingCode, shipments]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = searchInput.trim().toUpperCase().replace(/[\s-]/g, '');
    if (!clean) return;

    setIsSearching(true);
    setSearchedCode(searchInput.trim());
    setHasSearched(true);

    if (onCodeSearched) {
      onCodeSearched(clean);
    }

    setTimeout(() => {
      const found = shipments.find(
        (s) => s.trackingCode.toUpperCase().replace(/[\s-]/g, '') === clean
      );
      setActiveShipment(found || null);
      setIsSearching(false);
    }, 220);
  };

  const copyToClipboard = (text: string, type: 'code' | 'link') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const currentStatusInfo = activeShipment ? getStatusInfo(activeShipment.currentStatus) : null;
  const serviceInfo = activeShipment ? getServiceTypeLabel(activeShipment.serviceType) : null;

  // 5 Step definitions
  const steps = [
    { label: 'Tạo đơn', desc: 'Đã lên phiếu' },
    { label: 'Đã lấy hàng', desc: 'Đã nhập kho' },
    { label: 'Trung chuyển', desc: 'Qua kho SOC' },
    { label: 'Đang giao', desc: 'Bưu tá phát' },
    { label: 'Thành công', desc: 'Đã nhận hàng' },
  ];

  const getStepStatus = (index: number, currentStatus: ShipmentStatus) => {
    const info = getStatusInfo(currentStatus);
    if (currentStatus === 'CANCELLED') return 'cancelled';
    if (currentStatus === 'FAILED_ATTEMPT' && index === 3) return 'failed';
    if (index < info.stepIndex) return 'completed';
    if (index === info.stepIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* Top Customer Announcement */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-200 font-medium">Hệ thống bưu chính toàn quốc hoạt động 24/7 không gián đoạn</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span className="flex items-center gap-1 text-slate-300">
              <Headphones className="w-3.5 h-3.5 text-orange-400" />
              Tổng đài CSKH: <strong className="text-white ml-0.5 font-mono">1900 0000</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar (Pure customer brand - NO ADMIN BUTTON) */}
      <header className="bg-white sticky top-0 z-30 shadow-xs border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-slate-900">EXPRESS</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">
                  VIỆT NAM
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500">Hệ Thống Tra Cứu Vận Đơn Trực Tuyến Toàn Quốc</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 text-orange-700 font-bold text-xs sm:text-sm border border-orange-200">
              <Headphones className="w-4 h-4 text-orange-600" />
              <span className="font-mono">1900 0000</span>
            </div>
          </div>
        </div>
      </header>

      {/* Search Hero Section (Clean, NO SAMPLE BADGES) */}
      <section className="bg-slate-900 text-white pt-10 pb-16 px-4 sm:px-6 relative overflow-hidden">
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-300 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            Hệ thống bưu chính trực thuộc - Định vị thời gian thực
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">
            Kiểm Tra Mã Vận Đơn Bưu Kiện
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto mb-6 leading-relaxed">
            Nhập chính xác mã vận đơn để theo dõi hành trình di chuyển, người giao nhận và thời gian nhận hàng.
          </p>

          {/* Clean Search Input (NO sample chips underneath) */}
          <div className="bg-white p-2 sm:p-2.5 rounded-2xl shadow-xl max-w-2xl mx-auto text-slate-800">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-5 h-5 text-orange-500" />
                </div>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                  placeholder="Nhập mã vận đơn cần kiểm tra..."
                  className="w-full pl-11 pr-10 py-3 bg-slate-50 focus:bg-white text-slate-900 font-mono font-bold text-base rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-orange-500 uppercase placeholder:normal-case placeholder:font-sans placeholder:font-normal placeholder:text-slate-400"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-lg font-bold"
                  >
                    ×
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isSearching || !searchInput.trim()}
                className="px-7 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 text-sm"
              >
                {isSearching ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang tìm...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>TRA CỨU NGAY</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 -mt-8 relative z-20 pb-16 w-full flex-1">
        {/* Loading Spinner */}
        {isSearching && (
          <div className="bg-white rounded-2xl shadow-lg p-10 text-center border border-slate-200 my-4">
            <div className="inline-block w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-3" />
            <h3 className="text-base font-bold text-slate-800">Đang truy xuất thông tin bưu kiện...</h3>
            <p className="text-slate-500 text-xs mt-1">Đang đồng bộ dữ liệu trạm cân và hệ thống phân loại toàn quốc</p>
          </div>
        )}

        {/* NOT SEARCHED YET (Initial Greeting) */}
        {!isSearching && !hasSearched && (
          <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8 border border-slate-200 text-center my-4">
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 mx-auto mb-3 border border-orange-100">
              <Package className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Sẵn Sàng Tra Cứu Hành Trình Đơn Hàng
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto mb-6 leading-relaxed">
              Vui lòng nhập mã vận đơn được in trên phiếu gửi hàng hoặc qua tin nhắn thông báo của shop để kiểm tra chi tiết.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto text-left text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                <div>
                  <strong className="text-slate-800 block">Nhập mã vận đơn</strong>
                  <span className="text-slate-500 text-[11px]">Điền mã vào thanh tìm kiếm phía trên</span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                <div>
                  <strong className="text-slate-800 block">Bấm Tra cứu</strong>
                  <span className="text-slate-500 text-[11px]">Hệ thống đồng bộ dữ liệu toàn quốc</span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                <div>
                  <strong className="text-slate-800 block">Xem lộ trình</strong>
                  <span className="text-slate-500 text-[11px]">Chi tiết bưu tá và mốc thời gian nhận</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NOT FOUND STATE */}
        {!isSearching && hasSearched && !activeShipment && (
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-10 text-center border border-rose-200 my-4">
            <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mx-auto mb-3 border border-rose-100">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">
              Không tìm thấy thông tin đơn hàng
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm max-w-md mx-auto mb-4">
              Mã <span className="font-mono font-bold text-rose-600">{searchedCode}</span> không tồn tại trong hệ thống hoặc chưa được kích hoạt. Quý khách vui lòng kiểm tra lại ký tự mã.
            </p>
            <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
              <Headphones className="w-3.5 h-3.5 text-orange-600" />
              Cần hỗ trợ? Tổng đài CSKH: <strong className="text-slate-800 font-mono">1900 0000</strong>
            </div>
          </div>
        )}

        {/* SHIPMENT FOUND DETAIL VIEW */}
        {!isSearching && activeShipment && currentStatusInfo && (
          <div className="space-y-5 my-2">
            {/* 1. TOP STATUS HIGHLIGHT BANNER */}
            <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-4 sm:p-6 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Mã vận đơn:
                    </span>
                    <button
                      onClick={() => copyToClipboard(activeShipment.trackingCode, 'code')}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-bold transition-colors"
                      title="Sao chép mã"
                    >
                      {activeShipment.trackingCode}
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                    {serviceInfo && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded">
                        {serviceInfo.name}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black font-mono text-slate-900 tracking-wide break-all">
                    {activeShipment.trackingCode}
                  </h2>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowPrintModal(true)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    In phiếu
                  </button>
                  <button
                    onClick={() => copyToClipboard(window.location.href, 'link')}
                    className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl text-xs font-semibold flex items-center gap-1 border border-orange-200 transition-colors"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-orange-600" />}
                    {copiedLink ? 'Đã chép link' : 'Chia sẻ'}
                  </button>
                </div>
              </div>

              {/* Status Big Badge & Description */}
              <div className={`mt-4 p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${currentStatusInfo.bgColor} ${currentStatusInfo.borderColor}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${currentStatusInfo.badgeClass}`}>
                    <Truck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Trạng thái hiện tại:
                    </span>
                    <h3 className={`text-base sm:text-lg font-black tracking-tight leading-snug ${currentStatusInfo.color}`}>
                      {currentStatusInfo.label}
                    </h3>
                  </div>
                </div>

                {activeShipment.estimatedDelivery && (
                  <div className="sm:text-right text-xs text-slate-600 bg-white/70 px-3 py-1.5 rounded-lg border border-slate-200/60 shrink-0">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Dự kiến giao:</span>
                    <strong className="text-slate-900">{activeShipment.estimatedDelivery}</strong>
                  </div>
                )}
              </div>

              {/* Explanation text */}
              <p className="text-xs text-slate-600 mt-2.5 px-1 leading-relaxed">
                {currentStatusInfo.description}
              </p>

              {/* Progress Stepper */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                {/* Desktop Stepper */}
                <div className="hidden sm:grid grid-cols-5 gap-2 relative text-center">
                  {steps.map((st, idx) => {
                    const stepState = getStepStatus(idx, activeShipment.currentStatus);
                    return (
                      <div key={idx} className="flex flex-col items-center relative">
                        {idx < steps.length - 1 && (
                          <div
                            className={`absolute top-3.5 left-1/2 w-full h-1 -z-0 ${
                              stepState === 'completed' ? 'bg-emerald-500' : 'bg-slate-200'
                            }`}
                          />
                        )}
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs relative z-10 transition-all ${
                            stepState === 'completed'
                              ? 'bg-emerald-600 text-white'
                              : stepState === 'current'
                              ? 'bg-orange-600 text-white ring-4 ring-orange-100 animate-pulse'
                              : 'bg-slate-200 text-slate-400'
                          }`}
                        >
                          {stepState === 'completed' ? <Check className="w-4 h-4" /> : idx + 1}
                        </div>
                        <span className={`text-xs mt-1.5 font-bold ${
                          stepState === 'current' ? 'text-orange-700' : stepState === 'completed' ? 'text-slate-800' : 'text-slate-400'
                        }`}>
                          {st.label}
                        </span>
                        <span className="text-[10px] text-slate-400">{st.desc}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Mobile Stepper */}
                <div className="sm:hidden">
                  <div className="flex items-center justify-between text-xs mb-1.5 font-semibold">
                    <span className="text-slate-500">Tiến trình đơn hàng:</span>
                    <span className="text-orange-700 font-bold">
                      Bước {Math.min(currentStatusInfo.stepIndex + 1, 5)}/5: {currentStatusInfo.shortLabel}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                    <div
                      className="bg-orange-600 h-full transition-all duration-500"
                      style={{ width: `${((currentStatusInfo.stepIndex + 1) / 5) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>Đã tạo đơn</span>
                    <span>Trung chuyển</span>
                    <span>Đã nhận hàng</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. LỘ TRÌNH VẬN CHUYỂN */}
            <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-4 sm:p-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-orange-600" />
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    Lộ Trình Giao Nhận Bưu Kiện
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                  {activeShipment.senderCity} ➔ {activeShipment.receiverCity}
                </span>
              </div>

              {/* Connected Route Container */}
              <div className="relative pl-7 sm:pl-9 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-linear-to-b before:from-blue-500 before:via-orange-400 before:to-emerald-500">
                {/* 1. Điểm Gửi (Từ địa chỉ...) */}
                <div className="relative">
                  <div className="absolute -left-7 sm:-left-9 top-0.5 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs ring-4 ring-blue-50">
                    A
                  </div>

                  <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200">
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                      <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wide">
                        ● Nơi gửi (Xuất phát)
                      </span>
                      <span className="text-[11px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {activeShipment.senderCity}
                      </span>
                    </div>

                    <div className="font-extrabold text-slate-900 text-sm sm:text-base">
                      {activeShipment.senderName}
                    </div>

                    <div className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      SĐT: {activeShipment.senderPhone}
                    </div>

                    <div className="mt-2 text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed break-words">
                      <span className="text-slate-400 font-medium block text-[10px] uppercase">Từ địa chỉ:</span>
                      {activeShipment.senderAddress}
                    </div>
                  </div>
                </div>

                {/* 2. Điểm Nhận (Giao đến địa chỉ...) */}
                <div className="relative">
                  <div className="absolute -left-7 sm:-left-9 top-0.5 w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-xs ring-4 ring-orange-50">
                    B
                  </div>

                  <div className="bg-orange-50/50 p-3 sm:p-4 rounded-xl border border-orange-200">
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                      <span className="text-[11px] font-bold text-orange-800 uppercase tracking-wide">
                        ● Nơi nhận (Điểm đến)
                      </span>
                      <span className="text-[11px] font-bold text-orange-900 bg-white px-2 py-0.5 rounded border border-orange-200">
                        {activeShipment.receiverCity}
                      </span>
                    </div>

                    <div className="font-extrabold text-slate-900 text-sm sm:text-base">
                      {activeShipment.receiverName}
                    </div>

                    <div className="text-xs text-slate-600 font-mono mt-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-orange-500" />
                      SĐT: {activeShipment.receiverPhone}
                    </div>

                    <div className="mt-2 text-xs text-slate-800 bg-white p-2.5 rounded-lg border border-orange-200 leading-relaxed break-words shadow-xs">
                      <span className="text-orange-600 font-medium block text-[10px] uppercase">Giao đến địa chỉ:</span>
                      {activeShipment.receiverAddress}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. GRID 2 CỘT: NHẬT KÝ HÀNH TRÌNH & THÔNG TIN KIỆN HÀNG */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* TIMELINE (Left 7 Columns) */}
              <div className="md:col-span-7 bg-white rounded-2xl shadow-md border border-slate-200 p-4 sm:p-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                      Lịch Trình Vận Chuyển Chi Tiết
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {activeShipment.timeline.length} mốc cập nhật
                  </span>
                </div>

                {activeShipment.timeline.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">Chưa có bản ghi lộ trình.</p>
                ) : (
                  <div className="relative pl-5 sm:pl-6 space-y-4 before:absolute before:left-2 before:top-2.5 before:bottom-2.5 before:w-0.5 before:bg-slate-200">
                    {activeShipment.timeline.map((evt, idx) => {
                      const isLatest = idx === 0;
                      return (
                        <div key={evt.id || idx} className="relative">
                          <div
                            className={`absolute -left-5 sm:-left-6 top-1.5 w-4 h-4 rounded-full flex items-center justify-center border-2 bg-white ${
                              isLatest
                                ? 'border-orange-600 bg-orange-600 ring-2 ring-orange-100'
                                : 'border-slate-300'
                            }`}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full ${isLatest ? 'bg-white' : 'bg-slate-400'}`} />
                          </div>

                          <div className={`p-3 rounded-xl border transition-all ${
                            isLatest ? 'bg-orange-50/50 border-orange-200' : 'bg-slate-50/70 border-slate-200/80'
                          }`}>
                            <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                              <h4 className={`text-xs sm:text-sm font-bold ${isLatest ? 'text-orange-950 font-extrabold' : 'text-slate-800'}`}>
                                {evt.title}
                              </h4>
                              <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                                {evt.timestamp}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-600 font-medium flex items-center gap-1 mb-1">
                              <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                              {evt.location}
                            </p>

                            <p className="text-xs text-slate-700 leading-relaxed break-words">
                              {evt.description}
                            </p>

                            {/* Shipper info card if present */}
                            {evt.shipperName && (
                              <div className="mt-2 pt-2 border-t border-slate-200/70 flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                                <div>
                                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Bưu tá phát:</span>
                                  <span className="text-xs font-bold text-slate-900">{evt.shipperName}</span>
                                </div>
                                {evt.shipperPhone && (
                                  <div className="px-2.5 py-1 rounded bg-orange-50 text-orange-700 text-[11px] font-mono font-bold flex items-center gap-1 border border-orange-200">
                                    <Phone className="w-3 h-3 text-orange-600" />
                                    {evt.shipperPhone}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* PACKAGE & PAYMENT DETAILS (Right 5 Columns) */}
              <div className="md:col-span-5 space-y-4">
                {/* Package Specifications Card */}
                <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-4 sm:p-5">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-3">
                    <Package className="w-4 h-4 text-orange-600" />
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      Thông Tin Hàng Hóa
                    </h3>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Tên mặt hàng:</span>
                      <strong className="text-slate-900 block mt-0.5 break-words">
                        {activeShipment.packageName}
                      </strong>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Trọng lượng:</span>
                        <strong className="text-slate-900 text-sm block mt-0.5">
                          {formatWeight(activeShipment.weightKg)}
                        </strong>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Kích thước:</span>
                        <strong className="text-slate-900 text-sm block mt-0.5">
                          {activeShipment.dimensions || 'Chuẩn'}
                        </strong>
                      </div>
                    </div>

                    {activeShipment.notes && (
                      <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed break-words">
                        <span className="font-bold block mb-0.5">Ghi chú gửi hàng:</span>
                        {activeShipment.notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* COD & Charges Card */}
                <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-4 sm:p-5">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-3">
                    <Layers className="w-4 h-4 text-orange-600" />
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      Cước Phí & Tiền Thu Hộ (COD)
                    </h3>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-orange-50 rounded-xl border border-orange-200 flex items-center justify-between">
                      <span className="font-semibold text-orange-950">Tiền thu hộ COD:</span>
                      <strong className="text-base font-extrabold text-orange-600 font-mono">
                        {activeShipment.codAmount > 0
                          ? formatCurrencyVND(activeShipment.codAmount)
                          : '0 ₫ (Không thu COD)'}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between py-1.5 px-1 border-b border-slate-100">
                      <span className="text-slate-600">Cước vận chuyển:</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {formatCurrencyVND(activeShipment.shippingFee)}
                      </span>
                    </div>

                    <div className="py-1 px-1">
                      <span className="text-slate-500 block text-[10px] mb-0.5">Hình thức cước:</span>
                      <span className="font-semibold text-slate-800">
                        {getPaymentMethodLabel(activeShipment.paymentMethod)}
                      </span>
                    </div>

                    <div className="pt-2">
                      <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 text-[11px] text-emerald-800 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        Được kiểm tra hàng ngoại quan trước khi nhận.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* COMPREHENSIVE TRUST & CREDENTIALS SECTION (HIỆN ĐẦY ĐỦ THÔNG TIN UY TÍN) */}
        {/* ========================================================================= */}

        {/* 1. NĂNG LỰC HẠ TẦNG VẬN TẢI & CAM KẾT CHẤT LƯỢNG */}
        <section className="mt-12 bg-white rounded-2xl p-5 sm:p-7 border border-slate-200 shadow-xs">
          <div className="text-center sm:text-left mb-6 pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">
                <BadgeCheck className="w-4 h-4" />
                Hệ Thống Tiêu Chuẩn Quốc Gia
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                Hạ Tầng Vận Tải & Cam Kết Chất Lượng Dịch Vụ
              </h2>
            </div>
            <span className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 self-start sm:self-auto">
              Đồng bộ mạng lưới 63 Tỉnh/Thành
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Card 1 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-orange-300 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold mb-3">
                <Globe2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1.5">2.800+ Điểm Bưu Cục</h3>
              <p className="text-slate-600 leading-relaxed">
                Mạng lưới bao phủ 100% quận huyện và hải đảo, xe trung chuyển chuyên tuyến luân chuyển hàng ngày.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-orange-300 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold mb-3">
                <Plane className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1.5">Hỏa Tốc Hàng Không</h3>
              <p className="text-slate-600 leading-relaxed">
                Kết nối chuyến bay chuyên dụng Tân Sơn Nhất - Nội Bài - Đà Nẵng, giao nhận nhanh chóng từ 12h đến 24h.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-orange-300 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1.5">Bảo Hiểm 100% Giá Trị</h3>
              <p className="text-slate-600 leading-relaxed">
                Cam kết đền bù toàn bộ giá trị khai báo khi phát sinh sự cố hư hại, thất lạc trong suốt quá trình vận hành.
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-orange-300 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold mb-3">
                <Warehouse className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1.5">Kho Tổng SOC Tự Động</h3>
              <p className="text-slate-600 leading-relaxed">
                Hệ thống phân luồng Cross-belt tốc độ cao công suất 1.500.000 bưu kiện/ngày với độ chuẩn xác 99.98%.
              </p>
            </div>
          </div>
        </section>

        {/* 2. HỆ THỐNG TRUNG TÂM KHAI THÁC & KHO TỔNG PHÂN LOẠI 3 MIỀN */}
        <section className="mt-6 bg-white rounded-2xl p-5 sm:p-7 border border-slate-200 shadow-xs">
          <div className="mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-orange-600" />
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
              Hệ Thống Tổng Kho Phân Loại & Trung Tâm Khai Thác Bưu Chính
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
              <span className="text-[10px] font-bold text-blue-700 uppercase block mb-1">
                ● Cụm Miền Bắc (Hà Nội Hub)
              </span>
              <strong className="text-slate-900 block text-xs mb-1">
                Trung Tâm Khai Thác SOC Mê Linh - Hà Nội
              </strong>
              <p className="text-slate-600 leading-relaxed">
                Địa chỉ: Lô CN-08, Khu Công Nghiệp Quang Minh, Huyện Mê Linh, TP. Hà Nội
              </p>
              <span className="text-[10px] text-slate-400 block mt-2 font-mono">Quy mô: 45.000 m² sàn phân loại</span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
              <span className="text-[10px] font-bold text-amber-700 uppercase block mb-1">
                ● Cụm Miền Trung (Đà Nẵng Hub)
              </span>
              <strong className="text-slate-900 block text-xs mb-1">
                Trung Tâm Khai Thác Central SOC - Đà Nẵng
              </strong>
              <p className="text-slate-600 leading-relaxed">
                Địa chỉ: Đường số 3, Khu Công Nghiệp Hòa Cầm, Quận Cẩm Lệ, TP. Đà Nẵng
              </p>
              <span className="text-[10px] text-slate-400 block mt-2 font-mono">Quy mô: 28.000 m² sàn phân loại</span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
              <span className="text-[10px] font-bold text-orange-700 uppercase block mb-1">
                ● Cụm Miền Nam (TP.HCM Hub)
              </span>
              <strong className="text-slate-900 block text-xs mb-1">
                Tổng Kho Phân Loại Tân Phú SOC - TP.HCM
              </strong>
              <p className="text-slate-600 leading-relaxed">
                Địa chỉ: Số 18 Đường Tân Thới Nhất 17, Phường Tân Thới Nhất, Quận 12, TP. Hồ Chí Minh
              </p>
              <span className="text-[10px] text-slate-400 block mt-2 font-mono">Quy mô: 60.000 m² sàn phân loại</span>
            </div>
          </div>
        </section>

        {/* 3. THÔNG TIN PHÁP LÝ & GIẤY PHÉP BƯU CHÍNH CHỨNG THỰC UY TÍN */}
        <section className="mt-6 bg-slate-900 text-slate-300 rounded-2xl p-5 sm:p-7 border border-slate-800 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">
                <Award className="w-4 h-4 text-orange-400" />
                Chứng Nhận & Cấp Phép Hoạt Động
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Thông Tin Pháp Nhân Doanh Nghiệp Bưu Chính
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded bg-slate-800 text-emerald-400 font-semibold border border-slate-700">
                ✓ Đã Đăng Ký Bộ TT&TT
              </span>
              <span className="px-2.5 py-1 rounded bg-slate-800 text-blue-400 font-semibold border border-slate-700">
                ISO 9001:2015
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5 text-xs text-slate-400">
            <div>
              <h4 className="text-white font-bold text-xs uppercase mb-2">Thông Tin Đăng Ký Bưu Chính</h4>
              <ul className="space-y-1.5">
                <li>• <strong>Giấy phép bưu chính:</strong> Số 888/GP-BTTTT cấp bởi Bộ Thông tin và Truyền thông</li>
                <li>• <strong>Mã số doanh nghiệp:</strong> 0109888899</li>
                <li>• <strong>Phạm vi hoạt động:</strong> Toàn quốc & Liên tuyến quốc tế</li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase mb-2">Trụ Sở & Văn Phòng Điều Hành</h4>
              <ul className="space-y-1.5">
                <li>• <strong>Trụ sở chính:</strong> Tòa nhà Express Tower, 102 Đường Duy Tân, Quận Cầu Giấy, TP. Hà Nội</li>
                <li>• <strong>VP Đại diện Miền Nam:</strong> 45 Đường Cộng Hòa, Phường 4, Quận Tân Bình, TP. Hồ Chí Minh</li>
                <li>• <strong>Email liên hệ:</strong> cskh@expresslogistics.vn</li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase mb-2">Cam Kết Trách Nhiệm Dịch Vụ</h4>
              <p className="leading-relaxed">
                Mọi bưu phẩm được kiểm soát định vị qua mã vạch điện tử, hỗ trợ đồng kiểm bưu tá, đối soát tiền thu hộ COD minh bạch và chi trả tự động hàng ngày.
              </p>
            </div>
          </div>
        </section>

        {/* 4. CÂU HỎI THƯỜNG GẶP (FAQ) */}
        <section className="mt-6 bg-white rounded-2xl p-5 sm:p-7 border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <HelpCircle className="w-5 h-5 text-orange-600" />
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
              Câu Hỏi Thường Gặp Khi Kiểm Tra Mã Đơn Hàng
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-xs mb-1">
                1. Khi nào tôi có thể bắt đầu tra cứu mã vận đơn?
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Ngay sau khi người gửi tạo đơn và bàn giao bưu phẩm cho bưu tá quét mã nhận, thông tin sẽ hiển thị trên hệ thống trong vòng 15-30 phút.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-xs mb-1">
                2. Tôi có được đồng kiểm kiện hàng trước khi thanh toán tiền COD?
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Quý khách hoàn toàn được quyền kiểm tra tình trạng đóng gói bên ngoài và tem niêm phong bưu phẩm trước khi thanh toán tiền thu hộ cho bưu tá.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-xs mb-1">
                3. Bưu tá phát hàng bao nhiêu lần nếu tôi chưa kịp nghe máy?
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Bưu tá sẽ hỗ trợ lưu bưu cục và giao lại miễn phí tối đa 3 lần hoặc theo lịch hẹn cụ thể mà quý khách thỏa thuận.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-xs mb-1">
                4. Tiền thu hộ COD và đối soát cước phí được thực hiện như thế nào?
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Hệ thống kế toán tự động đối soát và chuyển tiền COD về tài khoản ngân hàng của người gửi ngay sau khi đơn hàng được ghi nhận phát thành công.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Customer Footer (NO admin link whatsoever) */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-10 border-t border-slate-800 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-8 border-b border-slate-800">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 text-white font-bold text-base mb-2">
                <Truck className="w-5 h-5 text-orange-500" />
                TỔNG CÔNG TY CHUYỂN PHÁT NHANH EXPRESS VIỆT NAM
              </div>
              <p className="text-slate-400 text-xs leading-relaxed max-w-md">
                Đơn vị cung cấp dịch vụ chuyển phát hỏa tốc bưu phẩm, tài liệu và hàng hóa thương mại điện tử uy tín hàng đầu với mạng lưới 63 tỉnh thành.
              </p>
              <div className="mt-3 text-[11px] text-slate-500 space-y-1">
                <p>• GP hoạt động bưu chính: 888/GP-BTTTT do Bộ Thông tin & Truyền thông cấp</p>
                <p>• Mã số thuế / Doanh nghiệp: 0109888899</p>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase mb-3">Dịch Vụ Chính</h4>
              <ul className="space-y-1.5 text-slate-400 text-xs">
                <li>• Chuyển phát hỏa tốc hàng không</li>
                <li>• Chuyển phát nhanh tiêu chuẩn</li>
                <li>• Thu hộ tiền hàng (Ship COD toàn quốc)</li>
                <li>• Dịch vụ lưu kho và phân loại SOC</li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase mb-3">Hỗ Trợ Khách Hàng</h4>
              <div className="text-orange-400 font-mono font-bold text-lg mb-1">
                1900 0000
              </div>
              <p className="text-slate-400 text-xs mb-2">Thời gian làm việc: 24/7 toàn quốc</p>
              <p className="text-slate-500 text-[11px]">Email hỗ trợ: cskh@expresslogistics.vn</p>
            </div>
          </div>

          <div className="pt-6 text-center sm:text-left text-slate-500 text-[11px] flex flex-col sm:flex-row justify-between items-center gap-2">
            <span>© 2026 Tổng Công Ty Express Logistics Việt Nam. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <span>Chính sách bảo mật thông tin</span>
              <span>•</span>
              <span>Điều khoản vận chuyển</span>
              <span>•</span>
              <span>Quy trình khiếu nại</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Printable Receipt Modal */}
      {showPrintModal && activeShipment && (
        <PrintReceiptModal
          shipment={activeShipment}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
};
