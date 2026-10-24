import React from 'react';
import { Shipment } from '../types';
import { formatCurrencyVND, formatWeight, getStatusInfo, getPaymentMethodLabel, getServiceTypeLabel } from '../utils/formatters';
import { Printer, X, ShieldCheck, Box, MapPin, QrCode } from 'lucide-react';

interface PrintReceiptModalProps {
  shipment: Shipment;
  onClose: () => void;
}

export const PrintReceiptModal: React.FC<PrintReceiptModalProps> = ({ shipment, onClose }) => {
  const statusInfo = getStatusInfo(shipment.currentStatus);
  const service = getServiceTypeLabel(shipment.serviceType);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 md:p-8 my-8 relative print:m-0 print:p-0 print:shadow-none print:w-full">
        {/* Modal Controls (Hidden in print) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-orange-600" />
            <h3 className="font-bold text-slate-800 text-lg">Biên Nhận / Phiếu Gửi Hàng</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium text-sm rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              In phiếu này
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Bill Area */}
        <div className="mt-4 border-2 border-slate-800 p-5 rounded-lg font-sans text-slate-900 bg-white">
          {/* Header */}
          <div className="flex justify-between items-start pb-4 border-b-2 border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-orange-600 text-white font-black text-xl px-2 py-0.5 rounded tracking-tighter">
                  EXPRESS
                </span>
                <span className="font-bold text-slate-900 text-lg tracking-tight">LOGISTICS VIỆT NAM</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">Dịch vụ chuyển phát hỏa tốc & bưu chính toàn quốc</p>
              <p className="text-xs text-slate-500 font-mono">Hotline: 1900 0000 | www.expresslogistics.vn</p>
            </div>
            <div className="text-right">
              <div className="font-mono font-bold text-xl tracking-wider text-slate-900 bg-slate-100 px-3 py-1 rounded border border-slate-300">
                {shipment.trackingCode}
              </div>
              <span className="inline-block mt-1 text-[11px] font-semibold bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
                {service.name}
              </span>
            </div>
          </div>

          {/* Barcode Mock & Status */}
          <div className="flex items-center justify-between py-3 border-b border-slate-300 text-xs">
            <div className="flex items-center gap-3">
              <QrCode className="w-12 h-12 text-slate-800" />
              <div>
                <p className="font-mono text-slate-600">Mã đơn: <strong className="text-slate-900">{shipment.trackingCode}</strong></p>
                <p className="text-slate-500">Ngày tạo: {shipment.createdAt}</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded border ${statusInfo.badgeClass}`}>
                {statusInfo.label}
              </span>
            </div>
          </div>

          {/* From & To Addresses */}
          <div className="grid grid-cols-2 gap-4 py-4 border-b-2 border-slate-800 text-xs">
            {/* Sender */}
            <div className="pr-3 border-r border-slate-300">
              <div className="flex items-center gap-1 font-bold text-slate-700 uppercase mb-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                1. Người Gửi (From):
              </div>
              <p className="font-bold text-sm text-slate-900">{shipment.senderName}</p>
              <p className="text-slate-600 font-mono mt-0.5">SĐT: {shipment.senderPhone}</p>
              <p className="text-slate-700 mt-1 leading-relaxed">
                {shipment.senderAddress}, {shipment.senderCity}
              </p>
            </div>

            {/* Receiver */}
            <div className="pl-1">
              <div className="flex items-center gap-1 font-bold text-orange-700 uppercase mb-1">
                <MapPin className="w-3.5 h-3.5 text-orange-600" />
                2. Người Nhận (To):
              </div>
              <p className="font-bold text-sm text-slate-900">{shipment.receiverName}</p>
              <p className="text-slate-600 font-mono mt-0.5">SĐT: {shipment.receiverPhone}</p>
              <p className="text-slate-700 mt-1 leading-relaxed">
                {shipment.receiverAddress}, {shipment.receiverCity}
              </p>
            </div>
          </div>

          {/* Package info */}
          <div className="py-3 border-b border-slate-300 text-xs">
            <div className="flex items-center gap-1 font-bold text-slate-700 uppercase mb-2">
              <Box className="w-3.5 h-3.5 text-slate-500" />
              3. Thông Tin Hàng Hóa & Cước Phí
            </div>
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded border border-slate-200">
              <div>
                <span className="text-slate-500 block">Nội dung bưu gửi:</span>
                <span className="font-semibold text-slate-900">{shipment.packageName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Trọng lượng:</span>
                <span className="font-semibold text-slate-900">{formatWeight(shipment.weightKg)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Kích thước:</span>
                <span className="font-semibold text-slate-900">{shipment.dimensions || 'Tiêu chuẩn'}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-2">
              <div className="border border-slate-200 p-2 rounded">
                <span className="text-slate-500 block">Thu hộ (COD):</span>
                <span className="font-bold text-sm text-orange-600">
                  {shipment.codAmount > 0 ? formatCurrencyVND(shipment.codAmount) : 'Không thu COD'}
                </span>
              </div>
              <div className="border border-slate-200 p-2 rounded">
                <span className="text-slate-500 block">Cước vận chuyển:</span>
                <span className="font-bold text-sm text-slate-800">{formatCurrencyVND(shipment.shippingFee)}</span>
              </div>
              <div className="border border-slate-200 p-2 rounded">
                <span className="text-slate-500 block">Hình thức cước:</span>
                <span className="font-semibold text-xs text-slate-800">{getPaymentMethodLabel(shipment.paymentMethod)}</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-4 pt-4 text-center text-xs">
            <div>
              <p className="font-bold text-slate-700">Chữ ký người gửi</p>
              <p className="text-[10px] text-slate-400 mt-1">(Cam kết hàng hóa đúng quy định)</p>
              <div className="h-16"></div>
            </div>
            <div>
              <p className="font-bold text-slate-700">Bưu tá nhận hàng</p>
              <p className="text-[10px] text-slate-400 mt-1">(Xác nhận đã nhận đủ)</p>
              <div className="h-16"></div>
            </div>
            <div>
              <p className="font-bold text-slate-700">Chữ ký người nhận</p>
              <p className="text-[10px] text-slate-400 mt-1">(Đồng kiểm hàng nguyên vẹn)</p>
              <div className="h-16"></div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Hàng hóa được bảo hiểm trách nhiệm dân sự vận chuyển bởi Express Logistics Việt Nam.
          </div>
        </div>
      </div>
    </div>
  );
};
