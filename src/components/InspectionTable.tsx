import React, { useState } from 'react';
import { InspectionCategory, InspectionStatus } from '../types';
import { CheckCircle2, XCircle, Sparkles, MessageSquare } from 'lucide-react';
import { SUGGESTED_REMARKS } from '../data/inspectionTemplate';

interface InspectionTableProps {
  categories: InspectionCategory[];
  useThaiNumerals: boolean;
  onUpdateCategory: (id: number, updates: Partial<InspectionCategory>) => void;
  onSetAllStatus: (status: InspectionStatus) => void;
}

export const InspectionTable: React.FC<InspectionTableProps> = ({
  categories,
  useThaiNumerals,
  onUpdateCategory,
  onSetAllStatus
}) => {
  const [activeRemarkModalId, setActiveRemarkModalId] = useState<number | null>(null);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Toolbar */}
      <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            รายการตรวจ ({useThaiNumerals ? '๔' : '4'} หมวดหลัก)
          </span>
          <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-medium">
            iPad Touch Ready
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSetAllStatus('pass')}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
            title="เลือกเรียบร้อยทุกข้อ"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>เรียบร้อยทุกรายการ</span>
          </button>
          <button
            type="button"
            onClick={() => onSetAllStatus(null)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium transition active:scale-95"
          >
            <span>ล้างผลทั้งหมด</span>
          </button>
        </div>
      </div>

      {/* Main Form Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-700 text-xs font-bold">
              <th className="py-3 px-3 text-center w-14 shrink-0">ลำดับ</th>
              <th className="py-3 px-4 min-w-[320px]">รายการตรวจสอบ</th>
              <th className="py-3 px-2 text-center w-32 shrink-0">เรียบร้อย</th>
              <th className="py-3 px-2 text-center w-32 shrink-0">ไม่เรียบร้อย</th>
              <th className="py-3 px-4 min-w-[240px]">หมายเหตุ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {categories.map((cat) => {
              const rowNum = useThaiNumerals ? cat.thaiNum : String(cat.id);
              const isPass = cat.status === 'pass';
              const isFail = cat.status === 'fail';

              return (
                <tr
                  key={cat.id}
                  className={`transition-colors ${
                    isPass
                      ? 'bg-emerald-50/30'
                      : isFail
                      ? 'bg-rose-50/30'
                      : 'hover:bg-slate-50/60'
                  }`}
                >
                  {/* ลำดับ */}
                  <td className="py-4 px-3 text-center align-top font-bold text-slate-800 text-base">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-700">
                      {rowNum}
                    </span>
                  </td>

                  {/* รายการ */}
                  <td className="py-4 px-4 align-top">
                    <div className="font-bold text-slate-900 text-[15px] mb-1.5 leading-snug">
                      {cat.title}
                    </div>
                    <ul className="space-y-1.5 text-slate-600 text-xs md:text-sm pl-1">
                      {cat.subItems.map((sub) => (
                        <li key={sub.id} className="flex items-start gap-1.5 leading-relaxed">
                          <span className="text-slate-400 select-none">•</span>
                          <span>{sub.text}</span>
                        </li>
                      ))}
                    </ul>
                  </td>

                  {/* เรียบร้อย Toggle Button */}
                  <td className="py-4 px-2 text-center align-top">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateCategory(cat.id, {
                          status: isPass ? null : 'pass'
                        })
                      }
                      className={`w-full py-3 px-2 rounded-xl font-semibold text-xs flex flex-col items-center justify-center gap-1 transition-all border-2 active:scale-95 ${
                        isPass
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-200'
                          : 'bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border-slate-200'
                      }`}
                    >
                      <CheckCircle2 className={`w-5 h-5 ${isPass ? 'text-white' : 'text-slate-400'}`} />
                      <span>เรียบร้อย</span>
                    </button>
                  </td>

                  {/* ไม่เรียบร้อย Toggle Button */}
                  <td className="py-4 px-2 text-center align-top">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateCategory(cat.id, {
                          status: isFail ? null : 'fail'
                        })
                      }
                      className={`w-full py-3 px-2 rounded-xl font-semibold text-xs flex flex-col items-center justify-center gap-1 transition-all border-2 active:scale-95 ${
                        isFail
                          ? 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-200'
                          : 'bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border-slate-200'
                      }`}
                    >
                      <XCircle className={`w-5 h-5 ${isFail ? 'text-white' : 'text-slate-400'}`} />
                      <span>ไม่เรียบร้อย</span>
                    </button>
                  </td>

                  {/* หมายเหตุ */}
                  <td className="py-4 px-4 align-top">
                    <div className="space-y-2">
                      <div className="relative">
                        <textarea
                          rows={2}
                          value={cat.remark}
                          onChange={(e) =>
                            onUpdateCategory(cat.id, { remark: e.target.value })
                          }
                          placeholder="ระบุหมายเหตุ หรือข้อตรวจพบ..."
                          className="w-full text-xs md:text-sm p-2.5 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none bg-slate-50 focus:bg-white transition"
                        />
                      </div>

                      {/* Quick preset suggestions */}
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="text-[11px] text-slate-600 font-medium flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          ข้อความด่วน:
                        </span>
                        {SUGGESTED_REMARKS.slice(0, 3).map((suggestion, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() =>
                              onUpdateCategory(cat.id, {
                                remark: cat.remark
                                  ? `${cat.remark} ${suggestion}`
                                  : suggestion
                              })
                            }
                            className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-600 rounded-md transition truncate max-w-[180px]"
                            title={suggestion}
                          >
                            +{suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
