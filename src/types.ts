export type InspectionStatus = 'pass' | 'fail' | null;

export interface InspectionSubItem {
  id: string;
  text: string;
  status?: InspectionStatus;
  note?: string;
}

export interface InspectionCategory {
  id: number;
  thaiNum: string;
  title: string;
  subItems: InspectionSubItem[];
  status: InspectionStatus; // 'pass' = เรียบร้อย, 'fail' = ไม่เรียบร้อย, null = ยังไม่ได้ตรวจ
  remark: string;
}

export interface InspectionFormData {
  id: string;
  inspectionUnit: string; // หน่วยรับการตรวจ
  categories: InspectionCategory[];
  inspectorSignatureUrl: string; // Canvas data URL or empty
  inspectorName: string; // ชื่อ-สกุลผู้ตรวจ
  inspectorPosition: string; // ตำแหน่ง
  inspectionDate: string; // YYYY-MM-DD
  useThaiNumerals: boolean; // แสดงผลด้วยเลขไทย
  driveFileId?: string;
  driveFileUrl?: string;
  createdAt: string;
  updatedAt: string;
}
