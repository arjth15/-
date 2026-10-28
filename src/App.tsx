import React, { useState, useEffect, useRef } from 'react';
import { 
  createInitialFormData, 
  createSampleFormData 
} from './data/inspectionTemplate';
import { InspectionFormData, InspectionCategory, InspectionStatus } from './types';
import { HeaderBar } from './components/HeaderBar';
import { InspectionTable } from './components/InspectionTable';
import { OfficialDocumentView } from './components/OfficialDocumentView';
import { SignaturePad } from './components/SignaturePad';
import { SavedRecordsModal } from './components/SavedRecordsModal';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import { CompletionModal } from './components/CompletionModal';
import { exportToPdf, triggerBrowserPrint } from './utils/pdfExport';
import { toThaiNumerals, formatThaiDateParts } from './utils/thaiNumerals';
import { 
  initAuth, 
  signInWithGoogle, 
  signOutUser 
} from './services/firebase';
import { 
  saveInspectionToFirestore, 
  subscribeToUserInspections, 
  deleteInspectionFromFirestore 
} from './services/inspectionStore';
import { User } from 'firebase/auth';
import { 
  Building2, 
  Calendar, 
  User as UserIcon, 
  Briefcase, 
  CheckCircle2, 
  AlertCircle, 
  FileCheck2,
  Info,
  HardDrive,
  Cloud,
  Check
} from 'lucide-react';

const STORAGE_KEY = 'secret_doc_inspection_current';
const HISTORY_KEY = 'secret_doc_inspection_history';

export default function App() {
  const [formData, setFormData] = useState<InspectionFormData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading draft', e);
    }
    return createInitialFormData();
  });

  const [savedRecords, setSavedRecords] = useState<InspectionFormData[]>(() => {
    try {
      const history = localStorage.getItem(HISTORY_KEY);
      if (history) return JSON.parse(history);
    } catch (e) {
      console.error('Error loading history', e);
    }
    return [];
  });

  const [user, setUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<'form' | 'preview' | 'split'>('form');
  const [isExporting, setIsExporting] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isOriginalOpen, setIsOriginalOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const printAreaRef = useRef<HTMLDivElement | null>(null);

  // Initialize Auth & listen for state changes
  useEffect(() => {
    const unsubscribeAuth = initAuth(
      (currentUser) => {
        setUser(currentUser);
      },
      () => {
        setUser(null);
      }
    );
    return () => {
      if (typeof unsubscribeAuth === 'function') unsubscribeAuth();
    };
  }, []);

  // Subscribe to real-time Firestore updates when logged in
  useEffect(() => {
    if (!user) return;

    const unsubscribeFirestore = subscribeToUserInspections(
      user.uid,
      (cloudRecords) => {
        if (cloudRecords.length > 0) {
          setSavedRecords(cloudRecords);
          try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(cloudRecords));
          } catch (e) {
            console.error('Failed to sync history to local cache', e);
          }
        }
      },
      (error) => {
        console.warn('Firestore subscription notice:', error.message);
      }
    );

    return () => {
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, [user]);

  // Auto-save draft on changes locally
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch (e) {
      console.error('Failed to autosave draft', e);
    }
  }, [formData]);

  const handleUpdateCategory = (id: number, updates: Partial<InspectionCategory>) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
      updatedAt: new Date().toISOString()
    }));
  };

  const handleSetAllStatus = (status: InspectionStatus) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => ({
        ...c,
        status: status
      })),
      updatedAt: new Date().toISOString()
    }));
  };

  const handleSaveDraft = async () => {
    const updatedRecord = {
      ...formData,
      updatedAt: new Date().toISOString()
    };
    
    // 1. Add or update in local history
    const existingIndex = savedRecords.findIndex((r) => r.id === formData.id);
    let newHistory: InspectionFormData[];
    if (existingIndex >= 0) {
      newHistory = [...savedRecords];
      newHistory[existingIndex] = updatedRecord;
    } else {
      newHistory = [updatedRecord, ...savedRecords];
    }

    setSavedRecords(newHistory);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    } catch (e) {
      console.error('Failed to save to history', e);
    }

    // 2. Sync to Firebase Firestore if logged in
    if (user) {
      try {
        await saveInspectionToFirestore(updatedRecord);
      } catch (e) {
        console.error('Firestore save note:', e);
      }
    }

    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2000);
  };

  // 🌟 Action: ตรวจเสร็จและบันทึกไว้
  const handleCompleteAndSave = async () => {
    const updatedRecord = {
      ...formData,
      updatedAt: new Date().toISOString()
    };

    // Save to local history
    const existingIndex = savedRecords.findIndex((r) => r.id === formData.id);
    let newHistory: InspectionFormData[];
    if (existingIndex >= 0) {
      newHistory = [...savedRecords];
      newHistory[existingIndex] = updatedRecord;
    } else {
      newHistory = [updatedRecord, ...savedRecords];
    }

    setSavedRecords(newHistory);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    } catch (e) {
      console.error('Failed to save to history', e);
    }

    // Save to Firebase Firestore if logged in
    if (user) {
      try {
        await saveInspectionToFirestore(updatedRecord);
      } catch (e) {
        console.error('Firestore save error:', e);
      }
    }

    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2000);

    // Open completion modal for quick actions (PDF, Print, Google Drive, View 1:1)
    setIsCompletionModalOpen(true);
  };

  const handleLoadRecord = (record: InspectionFormData) => {
    setFormData(JSON.parse(JSON.stringify(record)));
  };

  const handleDeleteRecord = async (id: string) => {
    const filtered = savedRecords.filter((r) => r.id !== id);
    setSavedRecords(filtered);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error('Failed to delete history record', e);
    }

    // Also delete from Firestore if logged in
    if (user) {
      try {
        await deleteInspectionFromFirestore(id);
      } catch (e) {
        console.error('Firestore delete note:', e);
      }
    }
  };

  const handleLoadSample = () => {
    if (window.confirm('ต้องการโหลดข้อมูลตัวอย่างการตรวจความปลอดภัยเอกสารลับใช่หรือไม่?')) {
      setFormData(createSampleFormData());
    }
  };

  const handleReset = () => {
    if (window.confirm('ต้องการล้างข้อมูลและเริ่มฟอร์มตรวจใหม่ใช่หรือไม่?')) {
      const fresh = createInitialFormData();
      setFormData(fresh);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    const dateInfo = formatThaiDateParts(formData.inspectionDate, formData.useThaiNumerals);
    const safeUnit = (formData.inspectionUnit || 'หน่วยรับการตรวจ').replace(/[\s/\\:*?"<>|]+/g, '_');
    const filename = `การตรวจความปลอดภัยข้อมูลข่าวสารเอกสารลับ_${safeUnit}_${dateInfo.day}_${dateInfo.month}_${dateInfo.year}.pdf`;
    
    await exportToPdf('official-doc-print-area', filename);
    setIsExporting(false);
  };

  const handlePrint = () => {
    triggerBrowserPrint();
  };

  const handleGoogleSignIn = async () => {
    try {
      const res = await signInWithGoogle();
      setUser(res.user);
    } catch (err) {
      console.error('Sign in failed:', err);
    }
  };

  const handleGoogleSignOut = async () => {
    await signOutUser();
    setUser(null);
  };

  const passCount = formData.categories.filter((c) => c.status === 'pass').length;
  const failCount = formData.categories.filter((c) => c.status === 'fail').length;
  const totalCount = formData.categories.length;

  const dateInfo = formatThaiDateParts(formData.inspectionDate, formData.useThaiNumerals);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800">
      {/* Top Navigation Bar */}
      <HeaderBar
        viewMode={viewMode}
        setViewMode={setViewMode}
        useThaiNumerals={formData.useThaiNumerals}
        setUseThaiNumerals={(val) =>
          setFormData((prev) => ({ ...prev, useThaiNumerals: val }))
        }
        onExportPdf={handleExportPdf}
        onPrint={handlePrint}
        onSaveDraft={handleSaveDraft}
        onCompleteAndSave={handleCompleteAndSave}
        onLoadSample={handleLoadSample}
        onReset={handleReset}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenOriginal={() => setIsOriginalOpen(true)}
        onOpenDrive={() => setIsDriveModalOpen(true)}
        isDriveConnected={!!user}
        userEmail={user?.email || undefined}
        savedCount={savedRecords.length}
        isExporting={isExporting}
        saveFeedback={saveFeedback}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-3 md:p-6 max-w-[1600px] w-full mx-auto">
        {/* Notice Banner with iPad & Google Drive / Firebase status */}
        <div className="no-print mb-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 text-blue-200">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm md:text-base flex items-center gap-2">
                <span>แบบบันทึกผลการตรวจการรักษาความปลอดภัยข่าวสาร เอกสารลับ</span>
                <span className="text-xs bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-md font-semibold">
                  รายงานผลหน้าเดียวแนวนอน A4
                </span>
              </div>
              <p className="text-xs text-blue-200/80">
                รองรับ iPad (Touch / Apple Pencil) • แสดงผลเลขไทย • จัดเก็บ Google Drive & Firebase
              </p>
            </div>
          </div>

          {/* Quick status & Actions */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Complete & Save Header Badge Button */}
            <button
              type="button"
              onClick={handleCompleteAndSave}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>ตรวจเสร็จและบันทึกไว้</span>
            </button>

            {/* Google Drive Status badge */}
            <button
              type="button"
              onClick={() => setIsDriveModalOpen(true)}
              className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition active:scale-95 border border-white/20"
            >
              <HardDrive className="w-3.5 h-3.5 text-blue-300" />
              <span>Drive: {user ? 'เชื่อมต่อแล้ว' : 'กดเชื่อมต่อ'}</span>
              {user && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
            </button>

            {/* Inspection counters */}
            <div className="bg-white/10 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <span className="text-blue-200">ตรวจแล้ว:</span>
              <span className="font-bold text-white">
                {formData.useThaiNumerals
                  ? toThaiNumerals(passCount + failCount)
                  : passCount + failCount}{' '}
                /{' '}
                {formData.useThaiNumerals
                  ? toThaiNumerals(totalCount)
                  : totalCount}
              </span>
            </div>
            {passCount > 0 && (
              <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1.5 rounded-xl font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  เรียบร้อย{' '}
                  {formData.useThaiNumerals
                    ? toThaiNumerals(passCount)
                    : passCount}
                </span>
              </div>
            )}
            {failCount > 0 && (
              <div className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-1.5 rounded-xl font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>
                  ไม่เรียบร้อย{' '}
                  {formData.useThaiNumerals
                    ? toThaiNumerals(failCount)
                    : failCount}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Views: Form, Preview, or Split */}
        <div className="w-full">
          {/* VIEW MODE: FORM (iPad Form Optimized) */}
          {viewMode === 'form' && (
            <div className="space-y-6">
              {/* Inspection Info Header Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* หน่วยรับการตรวจ */}
                  <div className="lg:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-blue-600" />
                        <span>หน่วยรับการตรวจ</span>
                        <span className="text-rose-500">*</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      value={formData.inspectionUnit}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          inspectionUnit: e.target.value
                        }))
                      }
                      placeholder="เช่น กองร้อยบริการที่ ๑ กองพันทหารราบที่ ๒ กรมทหารราบ..."
                      className="w-full text-sm md:text-base font-medium px-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition bg-slate-50 focus:bg-white"
                    />
                  </div>

                  {/* วันที่ตรวจ */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span>วันที่ตรวจ (พ.ศ.)</span>
                      </span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={formData.inspectionDate}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            inspectionDate: e.target.value
                          }))
                        }
                        className="w-full text-sm font-medium px-3 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition bg-slate-50 focus:bg-white"
                      />
                    </div>
                    <div className="mt-1 text-xs text-slate-500 font-medium">
                      แสดงในรายงาน: {dateInfo.day} / {dateInfo.month} / {dateInfo.year}
                    </div>
                  </div>
                </div>
              </div>

              {/* Inspection Main Table */}
              <InspectionTable
                categories={formData.categories}
                useThaiNumerals={formData.useThaiNumerals}
                onUpdateCategory={handleUpdateCategory}
                onSetAllStatus={handleSetAllStatus}
              />

              {/* Inspector Information & Digital Signature Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-6">
                <h3 className="font-bold text-slate-900 text-sm md:text-base mb-4 flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-blue-600" />
                  <span>ข้อมูลและลายมือชื่อผู้ตรวจราชการ</span>
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Name and Position */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                          <span>ชื่อ - สกุล ผู้ตรวจ (ลงชื่อในวงเล็บ)</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        value={formData.inspectorName}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            inspectorName: e.target.value
                          }))
                        }
                        placeholder="เช่น พ.อ. ปรีชา สมบูรณ์สุข"
                        className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition bg-slate-50 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                          <span>ตำแหน่ง</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        value={formData.inspectorPosition}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            inspectorPosition: e.target.value
                          }))
                        }
                        placeholder="เช่น นายทหารรักษาความปลอดภัย กรมยุทธการ..."
                        className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition bg-slate-50 focus:bg-white"
                      />
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs text-slate-600 space-y-1">
                      <div className="font-semibold text-slate-700 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-blue-600" />
                        <span>การแสดงผลในเอกสารราชการ (หน้าเดียว แนวนอน):</span>
                      </div>
                      <p>• รายงานผลจะถูกจัดรูปแบบให้อยู่ในหน้าเดียวตามแบบฟอร์มต้นฉบับ</p>
                      <p>• หากระบุชื่อ-สกุล ระบบจะพิมพ์ในเครื่องหมายวงเล็บ ( {formData.inspectorName || '...'} )</p>
                    </div>
                  </div>

                  {/* Right: Signature Canvas */}
                  <div>
                    <SignaturePad
                      signatureUrl={formData.inspectorSignatureUrl}
                      onSave={(dataUrl) =>
                        setFormData((prev) => ({
                          ...prev,
                          inspectorSignatureUrl: dataUrl
                        }))
                      }
                      onClear={() =>
                        setFormData((prev) => ({
                          ...prev,
                          inspectorSignatureUrl: ''
                        }))
                      }
                      inspectorName={formData.inspectorName}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setViewMode('preview')}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm rounded-xl transition flex items-center gap-2 shadow-sm"
                >
                  <span>ดูตัวอย่างเอกสารรายงานผล (หน้าเดียว)</span>
                </button>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Primary Complete & Save Button */}
                  <button
                    type="button"
                    onClick={handleCompleteAndSave}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 active:scale-95"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>ตรวจเสร็จและบันทึกไว้</span>
                  </button>

                  {/* Google Drive Upload quick button */}
                  <button
                    type="button"
                    onClick={() => setIsDriveModalOpen(true)}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-600/20 transition flex items-center gap-2 active:scale-95"
                  >
                    <HardDrive className="w-4 h-4" />
                    <span>บันทึกลง Google Drive</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportPdf}
                    disabled={isExporting}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-md shadow-rose-600/20 transition flex items-center gap-2 active:scale-95"
                  >
                    <span>{isExporting ? 'กำลังสร้างไฟล์ PDF...' : 'ดาวน์โหลด PDF (หน้าเดียว)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center gap-2 active:scale-95"
                  >
                    <span>พิมพ์รายงาน A4 (หน้าเดียว)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW MODE: PREVIEW (Official Document 1:1 Single Page) */}
          {viewMode === 'preview' && (
            <div className="space-y-4">
              <div className="no-print bg-emerald-50 border border-emerald-200 text-emerald-950 px-4 py-3 rounded-2xl text-xs md:text-sm flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>แบบรายงานผลการตรวจ (A4 แนวนอน หน้าเดียว):</strong> รูปแบบ ตาราง ข้อย่อย และลายมือชื่อตรงตามไฟล์ต้นฉบับ ๑๐๐%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportPdf}
                    disabled={isExporting}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                  >
                    ดาวน์โหลด PDF
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                  >
                    พิมพ์รายงาน
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('form')}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition"
                  >
                    กลับไปแก้ไข
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto pb-8">
                <OfficialDocumentView
                  formData={formData}
                  innerRef={printAreaRef}
                />
              </div>
            </div>
          )}

          {/* VIEW MODE: SPLIT (Side-by-Side Landscape) */}
          {viewMode === 'split' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
              {/* Left Column: Form Controls */}
              <div className="space-y-4">
                {/* Header Inputs */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        หน่วยรับการตรวจ
                      </label>
                      <input
                        type="text"
                        value={formData.inspectionUnit}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            inspectionUnit: e.target.value
                          }))
                        }
                        placeholder="ระบุชื่อหน่วยรับการตรวจ..."
                        className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          วันที่ตรวจ
                        </label>
                        <input
                          type="date"
                          value={formData.inspectionDate}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              inspectionDate: e.target.value
                            }))
                          }
                          className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          ชื่อผู้ตรวจ
                        </label>
                        <input
                          type="text"
                          value={formData.inspectorName}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              inspectorName: e.target.value
                            }))
                          }
                          placeholder="ชื่อ-สกุล ผู้ตรวจ..."
                          className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ตำแหน่ง
                      </label>
                      <input
                        type="text"
                        value={formData.inspectorPosition}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            inspectorPosition: e.target.value
                          }))
                        }
                        placeholder="ตำแหน่งผู้ตรวจ..."
                        className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Table */}
                <InspectionTable
                  categories={formData.categories}
                  useThaiNumerals={formData.useThaiNumerals}
                  onUpdateCategory={handleUpdateCategory}
                  onSetAllStatus={handleSetAllStatus}
                />

                {/* Signature Pad */}
                <SignaturePad
                  signatureUrl={formData.inspectorSignatureUrl}
                  onSave={(dataUrl) =>
                    setFormData((prev) => ({
                      ...prev,
                      inspectorSignatureUrl: dataUrl
                    }))
                  }
                  onClear={() =>
                    setFormData((prev) => ({
                      ...prev,
                      inspectorSignatureUrl: ''
                    }))
                  }
                  inspectorName={formData.inspectorName}
                />

                {/* Save and Complete action in split view */}
                <button
                  type="button"
                  onClick={handleCompleteAndSave}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ตรวจเสร็จและบันทึกไว้</span>
                </button>
              </div>

              {/* Right Column: Live Official Document Preview */}
              <div className="sticky top-20 overflow-x-auto pb-8">
                <OfficialDocumentView
                  formData={formData}
                  innerRef={printAreaRef}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Hidden container strictly for printing if in other view modes */}
      <div className="hidden print:block">
        <OfficialDocumentView formData={formData} />
      </div>

      {/* History Modal */}
      <SavedRecordsModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        savedRecords={savedRecords}
        onLoadRecord={handleLoadRecord}
        onDeleteRecord={handleDeleteRecord}
        useThaiNumerals={formData.useThaiNumerals}
      />

      {/* Completion Modal */}
      <CompletionModal
        isOpen={isCompletionModalOpen}
        onClose={() => setIsCompletionModalOpen(false)}
        formData={formData}
        onViewReport={() => setViewMode('preview')}
        onDownloadPdf={handleExportPdf}
        onPrint={handlePrint}
        onOpenDrive={() => setIsDriveModalOpen(true)}
        onNewInspection={() => {
          const fresh = createInitialFormData();
          setFormData(fresh);
          setViewMode('form');
        }}
        isExporting={isExporting}
        isCloudSynced={!!user}
      />

      {/* Google Drive & Firebase Modal */}
      <GoogleDriveModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        user={user}
        onSignIn={handleGoogleSignIn}
        onSignOut={handleGoogleSignOut}
        formData={formData}
        onUpdateFormData={(updates) => setFormData((prev) => ({ ...prev, ...updates }))}
      />

      {/* Original PDF Template Modal */}
      {isOriginalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-5xl w-full h-[85vh] p-4 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="font-bold text-slate-800 text-base flex items-center gap-2">
                <span>ไฟล์ต้นฉบับที่แนบ (แบบฟอร์มการตรวจการรักษาความปลอดภัยข่าวสาร เอกสารลับ)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOriginalOpen(false)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                ปิด
              </button>
            </div>
            <div className="flex-1 mt-3 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
              <iframe
                src="/assets/aistudio/02______________________________2_fcd2ed23.pdf"
                className="w-full h-full border-none"
                title="ไฟล์ต้นฉบับ"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
