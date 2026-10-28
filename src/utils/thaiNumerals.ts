/**
 * Utilities for Thai numerals and Buddhist Calendar formatting
 */

const THAI_DIGITS = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];

export function toThaiNumerals(strOrNum: string | number | undefined | null): string {
  if (strOrNum === undefined || strOrNum === null) return '';
  return String(strOrNum).replace(/[0-9]/g, (match) => THAI_DIGITS[parseInt(match, 10)]);
}

export function toArabicNumerals(str: string): string {
  return str.replace(/[๐-๙]/g, (match) => String(THAI_DIGITS.indexOf(match)));
}

export const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

export interface FormattedThaiDate {
  day: string;
  month: string;
  year: string;
  fullText: string;
  slashFormat: string;
}

export function formatThaiDateParts(isoDateStr?: string, useThaiNum = true): FormattedThaiDate {
  let d: Date;
  if (!isoDateStr) {
    d = new Date();
  } else {
    d = new Date(isoDateStr);
    if (isNaN(d.getTime())) {
      d = new Date();
    }
  }

  const dayNum = d.getDate();
  const monthIndex = d.getMonth();
  const beYear = d.getFullYear() + 543;

  const dayStr = String(dayNum).padStart(2, '0');
  const monthNumStr = String(monthIndex + 1).padStart(2, '0');
  const yearStr = String(beYear);

  const displayDay = useThaiNum ? toThaiNumerals(dayStr) : dayStr;
  const displayMonthNum = useThaiNum ? toThaiNumerals(monthNumStr) : monthNumStr;
  const displayYear = useThaiNum ? toThaiNumerals(yearStr) : yearStr;
  const monthName = THAI_MONTHS_FULL[monthIndex];

  return {
    day: displayDay,
    month: monthName,
    year: displayYear,
    fullText: `${displayDay} ${monthName} ${displayYear}`,
    slashFormat: `${displayDay}/${displayMonthNum}/${displayYear}`
  };
}
