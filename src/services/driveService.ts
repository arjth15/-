import { getAccessToken } from './firebase';

export interface DriveFileItem {
  id: string;
  name: string;
  webViewLink?: string;
  createdTime?: string;
  size?: string;
}

/**
 * Uploads a PDF Blob to Google Drive using multipart upload
 */
export async function uploadPdfToGoogleDrive(
  pdfBlob: Blob,
  fileName: string,
  description?: string
): Promise<{ fileId: string; webViewLink: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('กรุณาลงชื่อเข้าใช้ด้วย Google ก่อนบันทึกลง Google Drive');
  }

  const metadata = {
    name: fileName,
    mimeType: 'application/pdf',
    description: description || 'แบบรายงานการตรวจเรื่องการรักษาความปลอดภัยข่าวสาร เอกสารลับ'
  };

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  form.append('file', pdfBlob);

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: form
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google Drive Upload Error:', errorText);
    throw new Error(`เกิดข้อผิดพลาดในการอัปโหลดไปยัง Google Drive: ${response.statusText}`);
  }

  const result = await response.json();
  return {
    fileId: result.id,
    webViewLink: result.webViewLink || `https://drive.google.com/file/d/${result.id}/view`
  };
}

/**
 * Lists inspection PDF files from the user's Google Drive
 */
export async function listDriveInspectionFiles(): Promise<DriveFileItem[]> {
  const token = await getAccessToken();
  if (!token) return [];

  // Query PDF files with relevant keywords
  const query = encodeURIComponent("mimeType = 'application/pdf' and trashed = false and name contains 'การตรวจ'");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink,createdTime,size)&pageSize=30&orderBy=createdTime desc`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    console.error('Failed to list files from Google Drive');
    return [];
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Deletes a file from Google Drive with mandatory user confirmation
 */
export async function deleteDriveFile(fileId: string, fileName: string): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) throw new Error('Unauthenticated');

  const confirmed = window.confirm(
    `คุณต้องการลบไฟล์ "${fileName}" ออกจาก Google Drive ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`
  );
  if (!confirmed) return false;

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('ไม่สามารถลบไฟล์จาก Google Drive ได้');
  }

  return true;
}
