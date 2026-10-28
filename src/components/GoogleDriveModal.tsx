import React, { useState, useEffect } from 'react';
import { 
  X, 
  Upload, 
  ExternalLink, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  HardDrive,
  FileText,
  Cloud
} from 'lucide-react';
import { User } from 'firebase/auth';
import { 
  uploadPdfToGoogleDrive, 
  listDriveInspectionFiles, 
  deleteDriveFile, 
  DriveFileItem 
} from '../services/driveService';
import { generatePdfBlob } from '../utils/pdfExport';
import { InspectionFormData } from '../types';
import { formatThaiDateParts } from '../utils/thaiNumerals';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  formData: InspectionFormData;
  onUpdateFormData: (updates: Partial<InspectionFormData>) => void;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  user,
  onSignIn,
  onSignOut,
  formData,
  onUpdateFormData
}) => {
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessUrl, setUploadSuccessUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadFiles = async () => {
    if (!user) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const files = await listDriveInspectionFiles();
      setDriveFiles(files);
    } catch (err: any) {
      setErrorMessage(err.message || 'ไม่สามารถโหลดรายการไฟล์จาก Google Drive ได้');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      loadFiles();
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleUploadCurrentDoc = async () => {
    if (!user) {
      onSignIn();
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setUploadSuccessUrl(null);

    try {
      const blob = await generatePdfBlob('official-doc-print-area');
      if (!blob) {
        throw new Error('ไม่สามารถสร้างข้อมูล PDF สำหรับอัปโหลดได้');
      }

      const dateInfo = formatThaiDateParts(formData.inspectionDate, formData.useThaiNumerals);
      const safeUnit = (formData.inspectionUnit || 'หน่วยรับการตรวจ').replace(/[\s/\\:*?"<>|]+/g, '_');
      const filename = `การตรวจความปลอดภัยข้อมูลข่าวสาร_${safeUnit}_${dateInfo.day}_${dateInfo.month}_${dateInfo.year}.pdf`;

      const uploadResult = await uploadPdfToGoogleDrive(
        blob,
        filename,
        `รายงานการตรวจความปลอดภัยเอกสารลับ หน่วย: ${formData.inspectionUnit} วันที่: ${dateInfo.fullText}`
      );

      setUploadSuccessUrl(uploadResult.webViewLink);
      onUpdateFormData({
        driveFileId: uploadResult.fileId,
        driveFileUrl: uploadResult.webViewLink
      });

      // Reload files list
      await loadFiles();
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการอัปโหลด');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (file: DriveFileItem) => {
    try {
      const deleted = await deleteDriveFile(file.id, file.name);
      if (deleted) {
        setDriveFiles((prev) => prev.filter((f) => f.id !== file.id));
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'ไม่สามารถลบไฟล์ได้');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <HardDrive className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span>จัดการ Google Drive & Firebase Cloud</span>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Cloud className="w-3 h-3" /> เชื่อมต่อ Cloud
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                สำรองและจัดเก็บรายงานผลการตรวจ PDF บน Google Drive และซิงค์ Firestore
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Section */}
        <div className="py-4 border-b border-slate-100">
          {!user ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <div className="font-bold text-sm text-slate-800">เข้าสู่ระบบด้วยบัญชี Google</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  เชื่อมต่อ Google Drive เพื่ออัปโหลดและเปิดไฟล์เอกสารลับได้ทันที
                </div>
              </div>

              {/* Official Google Sign-In Styled Button */}
              <button
                type="button"
                onClick={onSignIn}
                className="flex items-center gap-3 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs px-4 py-2.5 rounded-xl border border-slate-300 shadow-sm transition active:scale-95 shrink-0"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>Sign in with Google</span>
              </button>
            </div>
          ) : (
            <div className="bg-blue-50/70 border border-blue-200/60 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border border-blue-300" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-slate-800">{user.displayName || 'ผู้ใช้งาน Google'}</div>
                  <div className="text-[11px] text-slate-500">{user.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-600" /> เชื่อมต่อแล้ว
                </span>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="text-xs text-rose-600 hover:text-rose-700 hover:underline px-2 py-1"
                >
                  ออกจากระบบ
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action: Upload current report to Google Drive */}
        <div className="py-4 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 to-blue-50/40 p-4 rounded-xl border border-slate-200">
            <div>
              <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span>บันทึกแบบตรวจปัจจุบันลง Google Drive</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                หน่วย: {formData.inspectionUnit || 'ยังไม่ระบุชื่อหน่วย'}
              </div>
            </div>

            <button
              type="button"
              onClick={handleUploadCurrentDoc}
              disabled={isUploading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition active:scale-95 shrink-0"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>กำลังอัปโหลด...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>อัปโหลดลง Google Drive</span>
                </>
              )}
            </button>
          </div>

          {/* Feedback messages */}
          {uploadSuccessUrl && (
            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>อัปโหลดรายงานไปยัง Google Drive สำเร็จแล้ว!</span>
              </div>
              <a
                href={uploadSuccessUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline flex items-center gap-1 hover:text-emerald-950"
              >
                <span>เปิดดูใน Drive</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {errorMessage && (
            <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* List of files in Google Drive */}
        <div className="flex-1 overflow-y-auto py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              ไฟล์รายงานใน Google Drive ({driveFiles.length})
            </span>
            {user && (
              <button
                type="button"
                onClick={loadFiles}
                disabled={isLoading}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>รีเฟรช</span>
              </button>
            )}
          </div>

          {!user ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              กรุณาเข้าสู่ระบบด้วย Google เพื่อดูรายการไฟล์ที่บันทึกไว้ใน Google Drive
            </div>
          ) : isLoading ? (
            <div className="text-center py-8 text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>กำลังโหลดรายการไฟล์จาก Google Drive...</span>
            </div>
          ) : driveFiles.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-medium">ยังไม่มีไฟล์รายงานใน Google Drive</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                เมื่อกดปุ่ม &ldquo;อัปโหลดลง Google Drive&rdquo; ไฟล์จะปรากฏที่นี่
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {driveFiles.map((file) => (
                <div
                  key={file.id}
                  className="p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 transition flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="p-2 rounded-lg bg-rose-50 text-rose-600 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-800 truncate" title={file.name}>
                        {file.name}
                      </div>
                      {file.createdTime && (
                        <div className="text-[10px] text-slate-400">
                          {new Date(file.createdTime).toLocaleString('th-TH')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {file.webViewLink && (
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1 transition"
                      >
                        <span>เปิด</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteFile(file)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="ลบไฟล์ออกจาก Google Drive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
