import PDFDocument from "pdfkit";
import { uploadPdfToS3 } from "../../services/upload.js";
import stream from 'stream';

// const downloadReport =  async (req, res) => {
//   try {
//     const { reportTitle, reportData, metadata } = req.body;
    
//     if (!reportData || !Array.isArray(reportData) || reportData.length === 0) {
//       return res.status(400).json({ error: 'Invalid report data' });
//     }

//     // Create PDF document
//     const doc = new PDFDocument({ 
//       margin: 30,
//       size: 'A4',
//       layout: 'landscape' // Better for tables with many columns
//     });
    
//     // Set response headers
//     const filename = `${reportTitle || 'report'}_${Date.now()}.pdf`;
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    
//     // Pipe PDF to response
//     doc.pipe(res);
    
//     // Generate dynamic PDF
//     generateDynamicPDF(doc, reportTitle, reportData, metadata);
    
//     // Finalize PDF
//     doc.end();
    
//   } catch (error) {
//     console.error('Error generating PDF:', error);
//     if (!res.headersSent) {
//       res.status(500).json({ error: 'Failed to generate PDF' });
//     }
//   }
// }


// function generateDynamicPDF(doc, title, data, metadata = {}) {
//   const pageWidth = doc.page.width - 60; // Account for margins
//   const pageHeight = doc.page.height - 60;
  
//   // Header
//   doc.fontSize(18)
//      .font('Helvetica-Bold')
//      .text(title || 'Report', { align: 'center' })
//      .moveDown(0.5);
  
//   // Metadata section
//   if (metadata && Object.keys(metadata).length > 0) {
//     doc.fontSize(9).font('Helvetica');
//     Object.entries(metadata).forEach(([key, value]) => {
//       doc.text(`${key}: ${value}`);
//     });
//     doc.moveDown(0.5);
//   }
  
//   // Line separator
//   doc.moveTo(30, doc.y)
//      .lineTo(doc.page.width - 30, doc.y)
//      .stroke()
//      .moveDown(0.5);
  
//   // Extract columns from first data row
//   const columns = Object.keys(data[0]);
//   const numColumns = columns.length;
  
//   // Calculate column widths dynamically
//   const columnWidth = pageWidth / numColumns;
//   const startX = 30;
//   let startY = doc.y;
  
//   // Function to draw table headers
//   function drawTableHeader() {
//     doc.font('Helvetica-Bold').fontSize(8);
    
//     columns.forEach((col, i) => {
//       const x = startX + (i * columnWidth);
//       const displayName = formatColumnName(col);
      
//       // Draw cell background
//       doc.rect(x, startY, columnWidth, 20)
//          .fillAndStroke('#e0e0e0', '#000000');
      
//       // Draw text
//       doc.fillColor('#000000')
//          .text(displayName, x + 5, startY + 6, {
//            width: columnWidth - 10,
//            align: 'left',
//            ellipsis: true
//          });
//     });
    
//     return startY + 20;
//   }
  
//   // Function to draw table row
//   function drawTableRow(rowData, y) {
//     doc.font('Helvetica').fontSize(7);
    
//     columns.forEach((col, i) => {
//       const x = startX + (i * columnWidth);
//       const value = formatCellValue(rowData[col]);
      
//       // Draw cell border
//       doc.rect(x, y, columnWidth, 18)
//          .stroke('#cccccc');
      
//       // Draw text
//       doc.fillColor('#000000')
//          .text(value, x + 5, y + 5, {
//            width: columnWidth - 10,
//            height: 18,
//            align: 'left',
//            ellipsis: true
//          });
//     });
    
//     return y + 18;
//   }
  
//   // Draw table headers
//   let currentY = drawTableHeader();
  
//   // Draw table rows
//   data.forEach((row, index) => {
//     // Check if we need a new page
//     if (currentY > pageHeight - 30) {
//       doc.addPage();
//       startY = 30;
//       currentY = drawTableHeader();
//     }
    
//     currentY = drawTableRow(row, currentY);
//   });
  
//   // Footer
//   const totalPages = doc.bufferedPageRange().count;
//   for (let i = 0; i < totalPages; i++) {
//     doc.switchToPage(i);
//     doc.fontSize(8)
//        .font('Helvetica')
//        .text(
//          `Page ${i + 1} of ${totalPages} | Generated on ${new Date().toLocaleString()}`,
//          30,
//          doc.page.height - 30,
//          { align: 'center' }
//        );
//   }
// }

// // Helper function to format column names
// function formatColumnName(name) {
//   return name
//     .replace(/_/g, ' ')
//     .replace(/([A-Z])/g, ' $1')
//     .trim()
//     .split(' ')
//     .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
//     .join(' ');
// }

// // Helper function to format cell values
// function formatCellValue(value) {
//   if (value === null || value === undefined) return '';
//   if (typeof value === 'object') return JSON.stringify(value);
//   if (typeof value === 'boolean') return value ? 'Yes' : 'No';
//   if (typeof value === 'number') {
//     // Format numbers with 2 decimal places if they have decimals
//     return value % 1 !== 0 ? value.toFixed(2) : value.toString();
//   }
//   return String(value);
// }



// export {downloadReport}

const downloadReport = async (req, res) => {
  try {
    const { reportTitle, reportData, metadata } = req.body;
    
    if (!reportData || !Array.isArray(reportData) || reportData.length === 0) {
      return res.status(400).json({ error: 'Invalid report data' });
    }

    const filename = `${reportTitle || 'report'}_${Date.now()}.pdf`;

    // Create PDF document
    const doc = new PDFDocument({ 
      margin: 30,
      size: 'A4',
      layout: 'landscape'
    });
    
    // Create buffers array to capture PDF data
    const buffers = [];
    
    // Create a writable stream to collect PDF chunks
    const writableStream = new stream.Writable({
      write(chunk, encoding, callback) {
        buffers.push(chunk);
        callback();
      }
    });
    
    // Pipe PDF to writable stream
    doc.pipe(writableStream);
    
    // Generate dynamic PDF
    generateDynamicPDF(doc, reportTitle, reportData, metadata);
    
    // Finalize PDF
    doc.end();
    
    // Wait for PDF generation to complete
    writableStream.on('finish', async () => {
      try {
        // Combine all buffers into a single buffer
        const pdfBuffer = Buffer.concat(buffers);
        
        // Upload to S3
        const s3Url = await uploadPdfToS3(pdfBuffer, filename);
        console.log(`PDF uploaded to S3: ${s3Url}`);
        
        // Send PDF to user for download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.send(pdfBuffer);
        
      } catch (s3Error) {
        console.error('Error uploading to S3:', s3Error);
        // Still send the PDF to user even if S3 upload fails
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.send(Buffer.concat(buffers));
      }
    });
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
  }
};

// Alternative version: Only upload to S3, return URL (no download)
const generateAndUploadReport = async (req, res) => {
  try {
    const { reportTitle, reportData, metadata } = req.body;
    
    if (!reportData || !Array.isArray(reportData) || reportData.length === 0) {
      return res.status(400).json({ error: 'Invalid report data' });
    }

    const filename = `${reportTitle || 'report'}_${Date.now()}.pdf`;

    const doc = new PDFDocument({ 
      margin: 30,
      size: 'A4',
      layout: 'landscape'
    });
    
    const buffers = [];
    const writableStream = new stream.Writable({
      write(chunk, encoding, callback) {
        buffers.push(chunk);
        callback();
      }
    });
    
    doc.pipe(writableStream);
    generateDynamicPDF(doc, reportTitle, reportData, metadata);
    doc.end();
    
    writableStream.on('finish', async () => {
      try {
        const pdfBuffer = Buffer.concat(buffers);
        const s3Url = await uploadPdfToS3(pdfBuffer, filename);
        
        res.json({
          success: true,
          message: 'PDF generated and uploaded to S3',
          s3Url,
          filename
        });
        
      } catch (s3Error) {
        console.error('Error uploading to S3:', s3Error);
        res.status(500).json({ error: 'Failed to upload PDF to S3' });
      }
    });
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

function generateDynamicPDF(doc, title, data, metadata = {}) {
  const pageWidth = doc.page.width - 60;
  const pageHeight = doc.page.height - 60;
  
  // Header
  doc.fontSize(18)
     .font('Helvetica-Bold')
     .text(title || 'Report', { align: 'center' })
     .moveDown(0.5);
  
  // Metadata section
  if (metadata && Object.keys(metadata).length > 0) {
    doc.fontSize(9).font('Helvetica');
    Object.entries(metadata).forEach(([key, value]) => {
      doc.text(`${key}: ${value}`);
    });
    doc.moveDown(0.5);
  }
  
  // Line separator
  doc.moveTo(30, doc.y)
     .lineTo(doc.page.width - 30, doc.y)
     .stroke()
     .moveDown(0.5);
  
  // Extract columns from first data row
  const columns = Object.keys(data[0]);
  const numColumns = columns.length;
  
  // Calculate column widths dynamically
  const columnWidth = pageWidth / numColumns;
  const startX = 30;
  let startY = doc.y;
  
  // Function to draw table headers
  function drawTableHeader() {
    doc.font('Helvetica-Bold').fontSize(8);
    
    columns.forEach((col, i) => {
      const x = startX + (i * columnWidth);
      const displayName = formatColumnName(col);
      
      // Draw cell background
      doc.rect(x, startY, columnWidth, 20)
         .fillAndStroke('#e0e0e0', '#000000');
      
      // Draw text
      doc.fillColor('#000000')
         .text(displayName, x + 5, startY + 6, {
           width: columnWidth - 10,
           align: 'left',
           ellipsis: true
         });
    });
    
    return startY + 20;
  }
  
  // Function to draw table row
  function drawTableRow(rowData, y) {
    doc.font('Helvetica').fontSize(7);
    
    columns.forEach((col, i) => {
      const x = startX + (i * columnWidth);
      const value = formatCellValue(rowData[col]);
      
      // Draw cell border
      doc.rect(x, y, columnWidth, 18)
         .stroke('#cccccc');
      
      // Draw text
      doc.fillColor('#000000')
         .text(value, x + 5, y + 5, {
           width: columnWidth - 10,
           height: 18,
           align: 'left',
           ellipsis: true
         });
    });
    
    return y + 18;
  }
  
  // Draw table headers
  let currentY = drawTableHeader();
  
  // Draw table rows
  data.forEach((row, index) => {
    // Check if we need a new page
    if (currentY > pageHeight - 30) {
      doc.addPage();
      startY = 30;
      currentY = drawTableHeader();
    }
    
    currentY = drawTableRow(row, currentY);
  });
  
  // Footer
  const totalPages = doc.bufferedPageRange().count;
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    doc.fontSize(8)
       .font('Helvetica')
       .text(
         `Page ${i + 1} of ${totalPages} | Generated on ${new Date().toLocaleString()}`,
         30,
         doc.page.height - 30,
         { align: 'center' }
       );
  }
}

// Helper function to format column names
function formatColumnName(name) {
  return name
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Helper function to format cell values
function formatCellValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') {
    // Format numbers with 2 decimal places if they have decimals
    return value % 1 !== 0 ? value.toFixed(2) : value.toString();
  }
  return String(value);
}

export { downloadReport, generateAndUploadReport };