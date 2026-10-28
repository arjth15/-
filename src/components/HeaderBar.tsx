import React from 'react';
import { 
  FileDown, 
  Printer, 
  Save, 
  History, 
  RotateCcw, 
  Eye, 
  Edit3, 
  Columns, 
  FileText,
  ShieldCheck,
  Check,
  HardDrive,
  CheckCircle2
} from 'lucide-react';

interface HeaderBarProps {
  viewMode: 'form' | 'preview' | 'split';
  setViewMode: (mode: 'form' | 'preview' | 'split') => void;
  useThaiNumerals: boolean;
  setUseThaiNumerals: (val: boolean) => void;
  onExportPdf: () => void;
  onPrint: () => void;
  onSaveDraft: () => void;
  onCompleteAndSave: () => void;
  onLoadSample: () => void;
  onReset: () => void;
  onOpenHistory: () => void;
  onOpenOriginal: () => void;
  onOpenDrive: () => void;
  isDriveConnected: boolean;
  userEmail?: string;
  savedCount: number;
  isExporting: boolean;
  saveFeedback: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  viewMode,
  setViewMode,
  useThaiNumerals,
  setUseThaiNumerals,
  onExportPdf,
  onPrint,
  onSaveDraft,
  onCompleteAndSave,
  onLoadSample,
  onReset,
  onOpenHistory,
  onOpenOriginal,
  onOpenDrive,
  isDriveConnected,
  userEmail,
  savedCount,
  isExporting,
  saveFeedback
}) => {
  return (
    <header className="no-print bg-slate-900 text-white shadow-md sticky top-0 z-40">
      <div className="max-w-[1600px] mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Logo and title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <span>การตรวจการรักษาความปลอดภัยข่าวสาร เอกสารลับ</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
                หน้าเดียวแนวนอน
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              รองรับ iPad • แสดงผลเลขไทย • รายงานผลหน้าเดียว A4 แนวนอน
            </p>
          </div>
        </div>

        {/* View Mode Switcher (iPad Landscape Optimized) */}
        <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button
            type="button"
            onClick={() => setViewMode('form')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              viewMode === 'form'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>ฟอร์มตรวจ</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              viewMode === 'preview'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>ตัวอย่างเอกสารรายงาน (หน้าเดียว)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`hidden lg:flex px-3 py-1.5 rounded-lg text-xs font-semibold items-center gap-1.5 transition ${
              viewMode === 'split'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>มุมมองเคียงข้าง</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Thai numeral toggle */}
          <button
            type="button"
            onClick={() => setUseThaiNumerals(!useThaiNumerals)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition active:scale-95 ${
              useThaiNumerals
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="สลับการแสดงผลตัวเลขไทย / อารบิก"
          >
            <span className="font-bold text-sm">๑๒๓</span>
            <span>เลขไทย: {useThaiNumerals ? 'เปิด' : 'ปิด'}</span>
          </button>

          {/* Load Sample Data */}
          <button
            type="button"
            onClick={onLoadSample}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-medium transition active:scale-95 flex items-center gap-1"
            title="ใส่ข้อมูลตัวอย่าง"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ข้อมูลตัวอย่าง</span>
          </button>

          {/* View Original Template */}
          <button
            type="button"
            onClick={onOpenOriginal}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl text-xs font-medium transition active:scale-95 flex items-center gap-1"
            title="เปิดดูไฟล์ต้นฉบับแนบ"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden md:inline">ดูไฟล์ต้นฉบับ</span>
          </button>

          {/* History */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-medium transition active:scale-95 flex items-center gap-1 relative"
            title="ประวัติการตรวจ"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ประวัติ</span>
            {savedCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold">
                {savedCount}
              </span>
            )}
          </button>

          {/* Google Drive & Cloud button */}
          <button
            type="button"
            onClick={onOpenDrive}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition active:scale-95 ${
              isDriveConnected
                ? 'bg-blue-600/30 text-blue-200 border-blue-500/50 hover:bg-blue-600/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="จัดการและบันทึกลง Google Drive"
          >
            <HardDrive className={`w-3.5 h-3.5 ${isDriveConnected ? 'text-blue-300' : 'text-slate-400'}`} />
            <span>Google Drive</span>
            {isDriveConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            )}
          </button>

          {/* 🌟 New Primary Button: ตรวจเสร็จและบันทึกไว้ */}
          <button
            type="button"
            onClick={onCompleteAndSave}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition active:scale-95"
            title="ตรวจเสร็จสมบูรณ์และบันทึกข้อมูล"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>ตรวจเสร็จและบันทึกไว้</span>
          </button>

          {/* Save Draft */}
          <button
            type="button"
            onClick={onSaveDraft}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 ${
              saveFeedback
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {saveFeedback ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saveFeedback ? 'บันทึกแล้ว!' : 'บันทึกฉบับร่าง'}</span>
          </button>

          {/* Direct PDF Download (Single Page) */}
          <button
            type="button"
            onClick={onExportPdf}
            disabled={isExporting}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/30 transition active:scale-95"
            title="ดาวน์โหลดเป็นไฟล์ PDF แนวนอน (หน้าเดียว) ตามแบบไฟล์ที่แนบ"
          >
            <FileDown className="w-4 h-4" />
            <span>{isExporting ? 'กำลังสร้าง PDF...' : 'ดาวน์โหลด PDF'}</span>
          </button>

          {/* Print / Save to PDF (Single Page) */}
          <button
            type="button"
            onClick={onPrint}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition active:scale-95"
            title="สั่งพิมพ์ หรือ บันทึกเป็น PDF หน้าเดียวใน iPad"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>พิมพ์รายงาน</span>
          </button>

          {/* Reset */}
          <button
            type="button"
            onClick={onReset}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            title="ล้างข้อมูลฟอร์ม"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
