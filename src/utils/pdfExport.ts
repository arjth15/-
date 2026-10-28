import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function generatePdfBlob(elementId: string): Promise<Blob | null> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return null;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1200
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    // Create A4 Landscape (297mm x 210mm) - Guaranteed Single Page
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = 297;
    const pdfHeight = 210;
    let imgWidth = pdfWidth - 24; // 12mm margins
    let imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Strict single page constraint
    if (imgHeight > pdfHeight - 16) {
      const scaleFactor = (pdfHeight - 16) / imgHeight;
      imgHeight = pdfHeight - 16;
      imgWidth = imgWidth * scaleFactor;
    }

    const xOffset = Math.max(8, (pdfWidth - imgWidth) / 2);
    const yOffset = Math.max(8, (pdfHeight - imgHeight) / 2);

    pdf.addImage(imgData, 'JPEG', xOffset, yOffset, imgWidth, imgHeight, undefined, 'FAST');
    return pdf.output('blob');
  } catch (error) {
    console.error('Failed to generate PDF Blob:', error);
    return null;
  }
}

export async function exportToPdf(elementId: string, filename: string): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return false;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // 2x for sharp print quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1200
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    // Create A4 Landscape PDF (297mm x 210mm) - Strictly 1 Page
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = 297;
    const pdfHeight = 210;

    let imgWidth = pdfWidth - 24; // 12mm side margins
    let imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Strict single page constraint: fit inside 210mm height
    if (imgHeight > pdfHeight - 16) {
      const scaleFactor = (pdfHeight - 16) / imgHeight;
      imgHeight = pdfHeight - 16;
      imgWidth = imgWidth * scaleFactor;
    }

    const xOffset = Math.max(8, (pdfWidth - imgWidth) / 2);
    const yOffset = Math.max(8, (pdfHeight - imgHeight) / 2);

    pdf.addImage(imgData, 'JPEG', xOffset, yOffset, imgWidth, imgHeight, undefined, 'FAST');
    pdf.save(filename);
    return true;
  } catch (error) {
    console.error('Failed to export PDF:', error);
    return false;
  }
}

export function triggerBrowserPrint() {
  window.print();
}
