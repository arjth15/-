import React from 'react';
import { InspectionFormData } from '../types';
import { toThaiNumerals, formatThaiDateParts } from '../utils/thaiNumerals';

interface OfficialDocumentViewProps {
  formData: InspectionFormData;
  innerRef?: React.RefObject<HTMLDivElement | null>;
}

export const OfficialDocumentView: React.FC<OfficialDocumentViewProps> = ({
  formData,
  innerRef
}) => {
  const useThai = formData.useThaiNumerals;
  const dateParts = formatThaiDateParts(formData.inspectionDate, useThai);

  // Helper to convert numbers in remarks if Thai numerals is toggled
  const formatText = (text: string) => {
    return useThai ? toThaiNumerals(text) : text;
  };

  return (
    <div className="flex justify-center w-full">
      {/* 
        A4 Landscape dimensions standard ratio: 297mm x 210mm
        Guaranteed to fit 1 single page without page break
      */}
      <div
        ref={innerRef}
        id="official-doc-print-area"
        className="print-page-container bg-white text-black p-6 md:p-8 shadow-md border border-slate-300 w-full max-w-[1020px] mx-auto min-h-[560px] flex flex-col justify-between"
        style={{
          fontFamily: "'Sarabun', sans-serif",
          boxSizing: 'border-box',
          pageBreakInside: 'avoid',
          breakInside: 'avoid'
        }}
      >
        <div>
          {/* Header Title */}
          <div className="text-center mb-4">
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-black mb-1.5">
              การตรวจเรื่องการรักษาความปลอดภัยข่าวสาร เอกสารลับ
            </h1>
            <div className="text-sm md:text-base flex items-baseline justify-center">
              <span className="font-semibold mr-2 shrink-0">หน่วยรับการตรวจ</span>
              <span className="border-b border-dotted border-black inline-block min-w-[280px] md:min-w-[340px] px-2 text-center font-medium">
                {formData.inspectionUnit || '\u00A0'}
              </span>
            </div>
          </div>

          {/* Inspection Table */}
          <table className="w-full border-collapse border border-black text-black text-xs md:text-sm mb-4">
            <thead>
              <tr className="bg-transparent border-b border-black">
                <th className="border border-black py-1.5 px-2 text-center font-semibold w-12 shrink-0">
                  ลำดับ
                </th>
                <th className="border border-black py-1.5 px-3 text-center font-semibold">
                  รายการ
                </th>
                <th className="border border-black py-1.5 px-2 text-center font-semibold w-20 shrink-0">
                  เรียบร้อย
                </th>
                <th className="border border-black py-1.5 px-2 text-center font-semibold w-20 shrink-0">
                  ไม่เรียบร้อย
                </th>
                <th className="border border-black py-1.5 px-3 text-center font-semibold w-44 md:w-52 shrink-0">
                  หมายเหตุ
                </th>
              </tr>
            </thead>
            <tbody>
              {formData.categories.map((cat) => {
                const rowNum = useThai ? cat.thaiNum : String(cat.id);
                return (
                  <tr key={cat.id} className="border-b border-black align-top">
                    {/* ลำดับ */}
                    <td className="border border-black py-2 px-2 text-center font-medium">
                      {rowNum}
                    </td>

                    {/* รายการ */}
                    <td className="border border-black py-2 px-3 text-left leading-normal">
                      <div className="font-semibold text-black mb-0.5">
                        {cat.title}
                      </div>
                      <ul className="space-y-0.5 text-black font-normal text-[12px] md:text-[13px] leading-tight">
                        {cat.subItems.map((sub) => (
                          <li key={sub.id} className="pl-3 relative flex items-start">
                            <span className="mr-1.5 shrink-0">-</span>
                            <span>{sub.text}</span>
                          </li>
                        ))}
                      </ul>
                    </td>

                    {/* เรียบร้อย */}
                    <td className="border border-black py-2 px-2 text-center align-middle">
                      {cat.status === 'pass' && (
                        <span className="text-lg md:text-xl font-bold inline-block text-black">
                          ✓
                        </span>
                      )}
                    </td>

                    {/* ไม่เรียบร้อย */}
                    <td className="border border-black py-2 px-2 text-center align-middle">
                      {cat.status === 'fail' && (
                        <span className="text-lg md:text-xl font-bold inline-block text-black">
                          ✓
                        </span>
                      )}
                    </td>

                    {/* หมายเหตุ */}
                    <td className="border border-black py-2 px-2.5 text-left align-middle text-xs md:text-[13px] leading-snug">
                      {formatText(cat.remark) || ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer: Signatures & Inspector Details */}
        <div className="flex justify-end pr-2 md:pr-10 mt-2 text-xs md:text-sm leading-normal">
          <div className="w-[300px] md:w-[360px] text-left space-y-1.5">
            {/* Signature row */}
            <div className="flex items-center">
              <span className="shrink-0 mr-1">(ลงชื่อ)</span>
              <div className="relative flex-1 border-b border-dotted border-black min-h-[30px] flex items-center justify-center">
                {formData.inspectorSignatureUrl ? (
                  <img
                    src={formData.inspectorSignatureUrl}
                    alt="ลายมือชื่อ"
                    className="max-h-10 max-w-[160px] object-contain mx-auto"
                  />
                ) : (
                  <span className="text-transparent">.</span>
                )}
              </div>
              <span className="shrink-0 ml-2">ผู้ตรวจ</span>
            </div>

            {/* Name row */}
            <div className="flex items-center">
              <span className="shrink-0 mr-1">(</span>
              <div className="flex-1 border-b border-dotted border-black text-center min-h-[20px]">
                {formData.inspectorName ? (
                  <span className="font-medium">{formData.inspectorName}</span>
                ) : (
                  <span className="text-transparent">.</span>
                )}
              </div>
              <span className="shrink-0 ml-1">)</span>
            </div>

            {/* Position row */}
            <div className="flex items-center">
              <span className="shrink-0 mr-1">ตำแหน่ง</span>
              <div className="flex-1 border-b border-dotted border-black text-center min-h-[20px]">
                {formData.inspectorPosition ? (
                  <span className="font-medium">{formatText(formData.inspectorPosition)}</span>
                ) : (
                  <span className="text-transparent">.</span>
                )}
              </div>
            </div>

            {/* Date row */}
            <div className="flex items-center justify-start pt-0.5">
              <span className="mr-2">วันที่</span>
              <span className="border-b border-dotted border-black px-1.5 min-w-[32px] text-center inline-block">
                {dateParts.day}
              </span>
              <span className="mx-1">/</span>
              <span className="border-b border-dotted border-black px-1.5 min-w-[70px] text-center inline-block">
                {dateParts.month}
              </span>
              <span className="mx-1">/</span>
              <span className="border-b border-dotted border-black px-1.5 min-w-[45px] text-center inline-block">
                {dateParts.year}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
