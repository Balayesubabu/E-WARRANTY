import PDFDocument from 'pdfkit';
import { Base64Encode } from 'base64-stream';

/**
 * Generates a table-style PDF report for warranty codes
 * Includes: Product Name, Warranty Code, Serial No, Dealer Name, Status
 */
const generateWarrantyReportPDF = async (warrantyDataArray, reportTitle = 'Warranty Codes Report') => {
    const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        layout: 'landscape'
    });

    let finalString = '';
    const stream = doc.pipe(new Base64Encode());

    const pageWidth = doc.page.width - 80;
    const startX = 40;
    let currentY = 40;

    // Column configuration
    const columns = [
        { header: 'S.No', width: 40 },
        { header: 'Product Name', width: 150 },
        { header: 'Warranty Code', width: 120 },
        { header: 'Serial No', width: 120 },
        { header: 'Dealer Name', width: 150 },
        { header: 'Status', width: 80 }
    ];

    const totalWidth = columns.reduce((sum, col) => sum + col.width, 0);
    const rowHeight = 25;
    const headerHeight = 30;

    // Draw title
    doc.fontSize(16).font('Helvetica-Bold');
    doc.text(reportTitle, startX, currentY, { align: 'center', width: pageWidth });
    currentY += 30;

    // Draw generation date
    doc.fontSize(10).font('Helvetica');
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })}`, startX, currentY);
    currentY += 20;

    // Draw total count
    doc.text(`Total Records: ${warrantyDataArray.length}`, startX, currentY);
    currentY += 25;

    // Function to draw table header
    const drawTableHeader = () => {
        let colX = startX;
        
        // Header background
        doc.fillColor('#1A7FC1')
           .rect(startX, currentY, totalWidth, headerHeight)
           .fill();

        // Header text
        doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
        columns.forEach(col => {
            doc.text(col.header, colX + 5, currentY + 9, {
                width: col.width - 10,
                align: 'left'
            });
            colX += col.width;
        });

        currentY += headerHeight;
        doc.fillColor('#000000');
    };

    // Function to draw a data row
    const drawDataRow = (data, index, isAlternate) => {
        let colX = startX;

        // Alternate row background
        if (isAlternate) {
            doc.fillColor('#F8FAFC')
               .rect(startX, currentY, totalWidth, rowHeight)
               .fill();
        }

        // Row border
        doc.strokeColor('#E2E8F0')
           .rect(startX, currentY, totalWidth, rowHeight)
           .stroke();

        // Row data
        doc.fillColor('#334155').fontSize(8).font('Helvetica');
        
        const rowData = [
            (index + 1).toString(),
            data.product_name || '—',
            data.warranty_code || '—',
            data.serial_no || '—',
            data.dealer_name || 'Not Assigned',
            data.status || '—'
        ];

        rowData.forEach((text, i) => {
            // Truncate long text
            let displayText = text;
            if (text.length > 25 && i !== 0 && i !== 5) {
                displayText = text.substring(0, 22) + '...';
            }
            
            doc.text(displayText, colX + 5, currentY + 8, {
                width: columns[i].width - 10,
                align: 'left',
                lineBreak: false
            });
            colX += columns[i].width;
        });

        currentY += rowHeight;
    };

    // Check if we need a new page
    const checkNewPage = () => {
        if (currentY > doc.page.height - 60) {
            doc.addPage();
            currentY = 40;
            drawTableHeader();
        }
    };

    // Draw initial header
    drawTableHeader();

    // Draw all data rows
    warrantyDataArray.forEach((data, index) => {
        checkNewPage();
        drawDataRow(data, index, index % 2 === 1);
    });

    // Draw bottom border
    doc.strokeColor('#1A7FC1')
       .lineWidth(2)
       .moveTo(startX, currentY)
       .lineTo(startX + totalWidth, currentY)
       .stroke();

    return new Promise((resolve, reject) => {
        stream.on('data', chunk => finalString += chunk);
        stream.on('end', () => resolve(finalString));
        stream.on('error', reject);
        doc.end();
    });
};

export { generateWarrantyReportPDF };
