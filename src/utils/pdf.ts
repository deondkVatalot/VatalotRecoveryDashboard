import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DataRecord } from '../types';

const LOGO_URL = 'https://vatalot.com/wp-content/uploads/2024/09/Vatalot-transparent-2022-Dark.png';

export async function generatePDF(
  data: DataRecord[],
  title: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Convert and add logo
  const img = new Image();
  img.crossOrigin = 'anonymous';
  
  await new Promise<void>((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw image on canvas
      ctx?.drawImage(img, 0, 0);
      
      // Convert to base64
      const base64 = canvas.toDataURL('image/png');
      
      try {
        const imgWidth = 50;
        const imgHeight = (img.height * imgWidth) / img.width;
        doc.addImage(base64, 'PNG', 10, 10, imgWidth, imgHeight);
        resolve();
      } catch (error) {
        console.warn('Logo processing error:', error);
        resolve();
      }
    };
    img.onerror = () => {
      console.warn('Logo loading failed');
      resolve();
    };
    img.src = LOGO_URL;
  });

  // Add title
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFontSize(16);
  doc.text(title, pageWidth / 2, 25, { align: 'center' });

  // Add metadata
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 10, 35);

  // Prepare table data
  const headers = Object.keys(data[0]);
  const tableData = data.map(row => 
    headers.map(header => {
      const value = row[header];
      return value !== null && value !== undefined ? String(value) : '';
    })
  );

  // Calculate progress steps
  const totalRows = data.length;
  const rowsPerPage = 25;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  let currentPage = 0;

  // Generate table
  await new Promise<void>((resolve, reject) => {
    try {
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 45,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: 'linebreak',
          cellWidth: 'wrap'
        },
        headStyles: {
          fillColor: [33, 72, 102],
          textColor: 255,
          fontSize: 9,
          fontStyle: 'bold'
        },
        didDrawPage: () => {
          currentPage++;
          if (onProgress) {
            const progress = Math.min(Math.round((currentPage / totalPages) * 100), 100);
            onProgress(progress);
          }
        },
        margin: { top: 45 },
        columnStyles: headers.reduce((acc, _, index) => ({
          ...acc,
          [index]: { cellWidth: 'auto' }
        }), {}),
        bodyStyles: {
          fillColor: undefined
        },
        alternateRowStyles: {
          fillColor: undefined
        },
        rowStyles: (row) => {
          const verified = row.raw[headers.indexOf('Verified')];
          if (verified === '0') {
            return { fillColor: [255, 200, 200] };
          } else if (verified === '2') {
            return { fillColor: [255, 255, 200] };
          }
          return {};
        }
      });
      resolve();
    } catch (error) {
      reject(error);
    }
  });

  // Save the PDF
  const fileName = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}