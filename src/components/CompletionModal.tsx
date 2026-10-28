import React from 'react';
import { 
  CheckCircle2, 
  FileDown, 
  Printer, 
  HardDrive, 
  Eye, 
  PlusCircle, 
  X, 
  Building2, 
  Calendar,
  CloudCheck
} from 'lucide-react';
import { InspectionFormData } from '../types';
import { formatThaiDateParts, toThaiNumerals } from '../utils/thaiNumerals';

interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: InspectionFormData;
  onViewReport: () => void;
  onDownloadPdf: () => void;
  onPrint: () => void;
  onOpenDrive: () => void;
  onNewInspection: () => void;
  isExporting: boolean;
  isCloudSynced: boolean;
}

export const CompletionModal: React.FC<CompletionModalProps> = ({
  isOpen,
  onClose,
  formData,
  onViewReport,
  onDownloadPdf,
  onPrint,
  onOpenDrive,
  onNewInspection,
  isExporting,
  isCloudSynced
}) => {
  if (!isOpen) return null;

  const dateInfo = formatThaiDateParts(formData.inspectionDate, formData.useThaiNumerals);
  const passCount = formData.categories.filter((c) => c.status === 'pass').length;
  const failCount = formData.categories.filter((c) => c.status === 'fail').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 overflow-hidden text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <h3 className="text-xl font-bold text-slate-800">
          บันทึกการตรวจเรียบร้อยแล้ว
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          เอกสารรายงานผลการตรวจได้รับการบันทึกและพร้อมจัดพิมพ์/ส่งออกในรูปแบบแนวนอนหน้าเดียว
        </p>

        {/* Summary Details */}
        <div className="mt-4 bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left text-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-700">
            <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-semibold">หน่วยรับการตรวจ:</span>
            <span className="truncate font-bold text-slate-900">{formData.inspectionUnit || 'ไม่ระบุชื่อหน่วย'}</span>
          </div>

          <div className="flex items-center gap-2 text-slate-700">
            <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-semibold">วันที่ตรวจ:</span>
            <span>{dateInfo.fullText}</span>
          </div>

          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
            <span className="text-slate-600">ผลการตรวจ:</span>
            <div className="flex items-center gap-2 font-semibold">
              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                เรียบร้อย {formData.useThaiNumerals ? toThaiNumerals(passCount) : passCount} ข้อ
              </span>
              {failCount > 0 && (
                <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md">
                  ไม่เรียบร้อย {formData.useThaiNumerals ? toThaiNumerals(failCount) : failCount} ข้อ
                </span>
              )}
            </div>
          </div>

          {isCloudSynced && (
            <div className="pt-1 text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
              <CloudCheck className="w-3.5 h-3.5" />
              <span>ซิงค์ข้อมูลไปยัง Firebase Cloud สำเร็จแล้ว</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-5 space-y-2.5">
          {/* Primary View Report */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onViewReport();
            }}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition active:scale-98"
          >
            <Eye className="w-4 h-4" />
            <span>ดูเอกสารรายงานผล (หน้าเดียวแนวนอน)</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onDownloadPdf();
              }}
              disabled={isExporting}
              className="py-2.5 px-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
            >
              <FileDown className="w-4 h-4" />
              <span>ดาวน์โหลด PDF</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onPrint();
              }}
              className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์รายงาน (iPad)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenDrive();
            }}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 border border-slate-300 transition active:scale-98"
          >
            <HardDrive className="w-4 h-4 text-blue-600" />
            <span>บันทึกลง Google Drive</span>
          </button>
        </div>

        {/* Footer New Inspection */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              onNewInspection();
            }}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>เริ่มตรวจหน่วยถัดไป</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
