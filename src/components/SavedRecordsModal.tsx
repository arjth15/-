import React from 'react';
import { InspectionFormData } from '../types';
import { Trash2, FolderOpen, X, Clock, Calendar, Building2 } from 'lucide-react';
import { toThaiNumerals, formatThaiDateParts } from '../utils/thaiNumerals';

interface SavedRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedRecords: InspectionFormData[];
  onLoadRecord: (record: InspectionFormData) => void;
  onDeleteRecord: (id: string) => void;
  useThaiNumerals: boolean;
}

export const SavedRecordsModal: React.FC<SavedRecordsModalProps> = ({
  isOpen,
  onClose,
  savedRecords,
  onLoadRecord,
  onDeleteRecord,
  useThaiNumerals
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                ประวัติแบบฟอร์มการตรวจที่บันทึกไว้
              </h3>
              <p className="text-xs text-slate-500">
                บันทึกไว้ในความจำของเครื่อง iPad เพื่อเรียกดูหรือออกรายงาน PDF ซ้ำได้
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {savedRecords.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Building2 className="w-12 h-12 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">ยังไม่มีประวัติการบันทึก</p>
              <p className="text-xs text-slate-400 mt-1">
                เมื่อกรอกข้อมูลและกด &ldquo;บันทึกฉบับร่าง&rdquo; ข้อมูลจะปรากฏที่นี่
              </p>
            </div>
          ) : (
            savedRecords.map((rec) => {
              const dateInfo = formatThaiDateParts(rec.inspectionDate, useThaiNumerals);
              const passCount = rec.categories.filter((c) => c.status === 'pass').length;
              const failCount = rec.categories.filter((c) => c.status === 'fail').length;

              return (
                <div
                  key={rec.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 transition flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-slate-900 text-sm md:text-base flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>{rec.inspectionUnit || 'ไม่ระบุชื่อหน่วย'}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        วันที่: {dateInfo.fullText}
                      </span>
                      {rec.inspectorName && (
                        <span>ผู้ตรวจ: {rec.inspectorName}</span>
                      )}
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                        เรียบร้อย {useThaiNumerals ? toThaiNumerals(passCount) : passCount}
                      </span>
                      {failCount > 0 && (
                        <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-medium">
                          ไม่เรียบร้อย {useThaiNumerals ? toThaiNumerals(failCount) : failCount}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onLoadRecord(rec);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition active:scale-95"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>เปิดข้อมูล</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteRecord(rec.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="ลบ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
