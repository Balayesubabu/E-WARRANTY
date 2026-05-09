import PDFDocument from "pdfkit";
import fs from "fs";
import axios from "axios";

const classicInvoiceTemplate = async (data) => {
  const {
    provider,
    provider_customer,
    franchise,
    staff,
    invoice_number,
    original_invoice_number,
    invoice_type,
    invoice_status,
    invoice_date,
    invoice_total_amount,
    is_invoice_fully_paid,
    invoice_discount_amount,
    invoice_additional_discount_percentage,
    invoice_additional_discount_amount,
    invoice_gst_amount,
    invoice_tds_percentage,
    invoice_tds_amount,
    invoice_tcs_percentage,
    invoice_tcs_amount,
    invoice_shipping_charges,
    is_auto_round_off,
    auto_round_off_amount,
    invoice_pending_amount,
    invoice_paid_amount,
    invoice_total_tax_amount,
    invoice_total_parts_amount,
    invoice_total_parts_tax_amount,
    invoice_total_services_amount,
    invoice_total_services_tax_amount,
    invoice_total_parts_services_amount,
    invoice_total_parts_services_tax_amount,
    advance_payment_type,
    invoice_advance_amount,
    advance_amount_online_transaction_id,
    advance_payment_date,
    invoice_payment_status,
    terms_and_conditions,
    additional_notes,
    invoice_pdf_url,
    due_date_terms,
    due_date,
    next_service_date,
    next_service_kilometers,
    customer_requirements,
    work_details,
    is_deleted,
    deleted_at,
    deleted_by_id,
    deleted_by,
    created_at,
    updated_at,
    SalesPart,
    SalesService,
    SalesInvoiceTransactions,
    SalesCustomerVehicle,
    SalesPackage,
    SalesInvoiceParty,
    Transaction,
    SalesAdditionalCharges,
  } = data;

  const doc = new PDFDocument({ margin: 40, size: "A4" });

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const margin = 20;

  // Draw border around the page with 20px margin
  doc
    .lineWidth(1)
    .rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2)
    .stroke();

  // Add title
  doc.text(`${data.invoice_type}`, { align: "center", fontSize: 40 });
  doc.moveDown(0.5);

  // Add horizontal line
  const lineY = doc.y;
  doc
    .lineWidth(1)
    .moveTo(margin, lineY)
    .lineTo(pageWidth - margin, lineY)
    .stroke();
  doc.moveDown(1);

  // Calculate vertical line position (middle of the page)
  const verticalLineX = margin + (pageWidth - margin * 2) / 2;

  // Draw vertical line from top horizontal line to second horizontal line (will be updated later)
  // We'll draw it after we know the position of the second horizontal line

  // Left side content (Company/Provider details)
  const leftContentX = margin + 20;
  const leftContentY = lineY + 20;
  const leftContentWidth = verticalLineX - leftContentX - 20;

  // Try to add company logo if available
  let logoAdded = false;
  if (provider && provider.company_logo) {
    try {
      const response = await axios.get(provider.company_logo, {
        responseType: "arraybuffer",
      });
      const logoBuffer = Buffer.from(response.data, "base64");
      doc.image(logoBuffer, leftContentX, leftContentY, {
        width: 70,
        height: 70,
      });
      logoAdded = true;
    } catch (error) {
      console.log("Could not load company logo:", error.message);
    }
  }

  // Add company details
  let companyDetailsHeight = 0;
  if (provider) {
    const companyDetails = [];

    if (provider.company_name) {
      companyDetails.push(provider.company_name);
    }

    if (provider.company_website) {
      companyDetails.push(`Website: ${provider.company_website}`);
    }

    if (provider.user && provider.user.email) {
      companyDetails.push(`Email: ${provider.user.email}`);
    }

    if (provider.company_address) {
      companyDetails.push(`Address: ${provider.company_address}`);
    }

    if (provider.gst_number) {
      companyDetails.push(`GST No: ${provider.gst_number}`);
    }

    if (provider.user && provider.user.phone_number) {
      companyDetails.push(`Phone: ${provider.user.phone_number}`);
    }

    // Calculate text position - start after logo if logo exists
    let textY = leftContentY;
    if (logoAdded) {
      textY = leftContentY + 80; // Start text after logo (70px height + 10px gap)
    } else {
      textY = leftContentY + 20; // Start text with some margin if no logo
    }

    // Add company details with proper formatting
    companyDetails.forEach((detail, index) => {
      doc.fontSize(10).text(detail, leftContentX, textY + index * 15, {
        width: leftContentWidth,
        align: "left",
      });
    });

    // Calculate the height of company details section
    companyDetailsHeight = textY + companyDetails.length * 15 - leftContentY;
  }

  // Right side content (Invoice details)
  const rightContentX = verticalLineX + 20;
  const rightContentY = lineY + 20;
  const rightContentWidth = pageWidth - margin - rightContentX - 20;

  // Add invoice details on the right side
  const invoiceDetails = [];

  if (invoice_number) {
    invoiceDetails.push(`Invoice ID: ${invoice_number}`);
  }

  // Get vehicle number from SalesCustomerVehicle if available
  let vehicleNumber = null;
  if (SalesCustomerVehicle && SalesCustomerVehicle.length > 0) {
    vehicleNumber = SalesCustomerVehicle[0].vehicle_number;
  }

  if (vehicleNumber) {
    invoiceDetails.push(`Vehicle No.: ${vehicleNumber}`);
  }

  if (due_date) {
    const dueDate = new Date(due_date);
    invoiceDetails.push(`Due Date: ${dueDate.toISOString().split("T")[0]}`);
  }

  if (invoice_date) {
    const issueDate = new Date(invoice_date);
    invoiceDetails.push(`Issue Date: ${issueDate.toISOString().split("T")[0]}`);
  }

  // Add invoice details
  invoiceDetails.forEach((detail, index) => {
    doc.fontSize(10).text(detail, rightContentX, rightContentY + index * 15, {
      width: rightContentWidth,
      align: "left",
    });
  });

  // Calculate where the horizontal line should end based on content
  const maxContentHeight = Math.max(
    companyDetailsHeight + 100, // Company details height + some padding
    invoiceDetails.length * 15 + 100 // Invoice details height + some padding
  );

  // Draw horizontal line where the provider data ends
  const horizontalLineEndY = leftContentY + maxContentHeight;
  doc
    .lineWidth(1)
    .moveTo(margin, horizontalLineEndY)
    .lineTo(pageWidth - margin, horizontalLineEndY)
    .stroke();

  // Add items table in the middle section
  const tableStartY = horizontalLineEndY + 50; // Start table after the horizontal line with some gap

  // Add Billed To and Shipped To sections
  const billedShippedStartY = horizontalLineEndY + 20;
  const billedShippedContentWidth = verticalLineX - leftContentX - 20;

  // Left side - Billed To
  const billedToDetails = [];
  if (provider_customer) {
    billedToDetails.push("Billed To:");
    if (provider_customer.customer_name) {
      billedToDetails.push(`Name: ${provider_customer.customer_name}`);
    }
    if (provider_customer.customer_address) {
      billedToDetails.push(`Address: ${provider_customer.customer_address}`);
    }
    if (provider_customer.customer_phone) {
      billedToDetails.push(`Phone: ${provider_customer.customer_phone}`);
    }
    if (provider_customer.customer_gstin_number) {
      billedToDetails.push(
        `GST Number: ${provider_customer.customer_gstin_number}`
      );
    }

    // Get vehicle number from SalesCustomerVehicle
    if (SalesCustomerVehicle && SalesCustomerVehicle.length > 0) {
      const vehicleNumber = SalesCustomerVehicle[0].vehicle_number;
      if (vehicleNumber) {
        billedToDetails.push(`Vehicle Number: ${vehicleNumber}`);
      }
    }
  }

  // Add Billed To details
  billedToDetails.forEach((detail, index) => {
    doc
      .fontSize(10)
      .text(detail, leftContentX, billedShippedStartY + index * 15, {
        width: billedShippedContentWidth,
        align: "left",
      });
  });

  // Right side - Shipped To
  const shippedToDetails = [];
  if (provider_customer) {
    shippedToDetails.push("Shipped To:");
    if (provider_customer.customer_name) {
      shippedToDetails.push(`Name: ${provider_customer.customer_name}`);
    }
    if (provider_customer.customer_address) {
      shippedToDetails.push(`Address: ${provider_customer.customer_address}`);
    }
    if (provider_customer.customer_phone) {
      shippedToDetails.push(`Phone: ${provider_customer.customer_phone}`);
    }
  }

  // Add Shipped To details
  shippedToDetails.forEach((detail, index) => {
    doc
      .fontSize(10)
      .text(detail, rightContentX, billedShippedStartY + index * 15, {
        width: rightContentWidth,
        align: "left",
      });
  });

  // Calculate the height of billed/shipped section
  const maxBilledShippedHeight = Math.max(
    billedToDetails.length * 15,
    shippedToDetails.length * 15
  );

  // Draw horizontal line after billed/shipped section
  const secondHorizontalLineY =
    billedShippedStartY + maxBilledShippedHeight + 20;
  doc
    .lineWidth(1)
    .moveTo(margin, secondHorizontalLineY)
    .lineTo(pageWidth - margin, secondHorizontalLineY)
    .stroke();

  // Draw vertical line from first horizontal line to second horizontal line
  doc
    .lineWidth(1)
    .moveTo(verticalLineX, lineY)
    .lineTo(verticalLineX, secondHorizontalLineY)
    .stroke();

  // Update table start position to be after the second horizontal line
  const updatedTableStartY = secondHorizontalLineY + 30;

  // Create proper table with headers
  const tableHeaders = [
    "S No.",
    "Item Name",
    "HSN",
    "Qty",
    "Rate",
    "Discount",
    "GST",
    "Amount",
  ];
  const columnWidths = [40, 120, 60, 40, 60, 60, 50, 70];
  const tableStartX = margin + 20;

  // Calculate total table width
  const totalTableWidth = columnWidths.reduce((sum, width) => sum + width, 0);

  // Draw table headers
  doc.fontSize(10).font("Helvetica-Bold");
  let currentX = tableStartX;

  // Draw vertical lines for headers (these will be the rectangle borders)
  doc.lineWidth(0.5);
  doc.moveTo(tableStartX, updatedTableStartY);
  doc.lineTo(tableStartX, updatedTableStartY + 20);
  doc.stroke();

  tableHeaders.forEach((header, index) => {
    doc.text(header, currentX + 5, updatedTableStartY + 5, {
      width: columnWidths[index] - 10,
    });
    currentX += columnWidths[index];

    // Draw vertical line after each column
    doc.moveTo(currentX, updatedTableStartY);
    doc.lineTo(currentX, updatedTableStartY + 20);
    doc.stroke();
  });

  // Draw horizontal line after headers
  doc
    .lineWidth(1)
    .moveTo(tableStartX, updatedTableStartY + 20)
    .lineTo(tableStartX + totalTableWidth, updatedTableStartY + 20)
    .stroke();

  // Add items data
  let currentY = updatedTableStartY + 25;
  let serialNumber = 1;
  doc.fontSize(9).font("Helvetica");

  // Add Sales Parts
  if (SalesPart && SalesPart.length > 0) {
    SalesPart.forEach((part) => {
      currentX = tableStartX;

      // S No.
      doc.text(serialNumber.toString(), currentX + 5, currentY, {
        width: columnWidths[0] - 10,
      });
      currentX += columnWidths[0];

      // Item Name
      doc.text(part.part_name || "N/A", currentX + 5, currentY, {
        width: columnWidths[1] - 10,
      });
      currentX += columnWidths[1];

      // HSN
      doc.text(part.part_hsn_code || "N/A", currentX + 5, currentY, {
        width: columnWidths[2] - 10,
      });
      currentX += columnWidths[2];

      // Qty
      doc.text(part.part_quantity?.toString() || "0", currentX + 5, currentY, {
        width: columnWidths[3] - 10,
      });
      currentX += columnWidths[3];

      // Rate
      doc.text(
        `₹${part.part_selling_price?.toFixed(2) || "0.00"}`,
        currentX + 5,
        currentY,
        { width: columnWidths[4] - 10 }
      );
      currentX += columnWidths[4];

      // Discount
      doc.text(
        `₹${part.part_discount_amount?.toFixed(2) || "0.00"}`,
        currentX + 5,
        currentY,
        { width: columnWidths[5] - 10 }
      );
      currentX += columnWidths[5];

      // GST
      doc.text(
        `₹${part.part_gst_amount?.toFixed(2) || "0.00"}`,
        currentX + 5,
        currentY,
        { width: columnWidths[6] - 10 }
      );
      currentX += columnWidths[6];

      // Amount
      doc.text(
        `₹${part.part_total_price?.toFixed(2) || "0.00"}`,
        currentX + 5,
        currentY,
        { width: columnWidths[7] - 10 }
      );

      currentY += 20;
      serialNumber++;
    });
  }

  // Add Sales Services
  if (SalesService && SalesService.length > 0) {
    SalesService.forEach((service) => {
      currentX = tableStartX;

      // S No.
      doc.text(serialNumber.toString(), currentX + 5, currentY, {
        width: columnWidths[0] - 10,
      });
      currentX += columnWidths[0];

      // Item Name
      doc.text(service.service_name || "N/A", currentX + 5, currentY, {
        width: columnWidths[1] - 10,
      });
      currentX += columnWidths[1];

      // HSN
      doc.text(
        service.franchise_service?.service_sac_code || "N/A",
        currentX + 5,
        currentY,
        { width: columnWidths[2] - 10 }
      );
      currentX += columnWidths[2];

      // Qty
      doc.text("1", currentX + 5, currentY, { width: columnWidths[3] - 10 });
      currentX += columnWidths[3];

      // Rate
      doc.text(
        `₹${service.service_price?.toFixed(2) || "0.00"}`,
        currentX + 5,
        currentY,
        { width: columnWidths[4] - 10 }
      );
      currentX += columnWidths[4];

      // Discount
      doc.text(
        `₹${service.service_discount_amount?.toFixed(2) || "0.00"}`,
        currentX + 5,
        currentY,
        { width: columnWidths[5] - 10 }
      );
      currentX += columnWidths[5];

      // GST
      doc.text(
        `₹${service.service_gst_amount?.toFixed(2) || "0.00"}`,
        currentX + 5,
        currentY,
        { width: columnWidths[6] - 10 }
      );
      currentX += columnWidths[6];

      // Amount
      doc.text(
        `₹${service.service_total_price?.toFixed(2) || "0.00"}`,
        currentX + 5,
        currentY,
        { width: columnWidths[7] - 10 }
      );

      currentY += 20;
      serialNumber++;
    });
  }

  // Draw final horizontal line after all data
  doc
    .lineWidth(1)
    .moveTo(tableStartX, currentY)
    .lineTo(tableStartX + totalTableWidth, currentY)
    .stroke();

  // Now draw the complete rectangle with table borders extending to page edges
  const rectangleLeftX = margin;
  const rectangleRightX = pageWidth - margin;
  const rectangleTopY = updatedTableStartY;

  doc.lineWidth(1);

  // Left border (from table start to page edge)
  doc.moveTo(rectangleLeftX, rectangleTopY);
  doc.lineTo(rectangleLeftX, currentY);
  doc.stroke();

  // Right border (from table end to page edge)
  doc.moveTo(rectangleRightX, rectangleTopY);
  doc.lineTo(rectangleRightX, currentY);
  doc.stroke();

  // Top border (from left edge to right edge)
  doc.moveTo(rectangleLeftX, rectangleTopY);
  doc.lineTo(rectangleRightX, rectangleTopY);
  doc.stroke();

  // Bottom border (from left edge to right edge)
  doc.moveTo(rectangleLeftX, currentY);
  doc.lineTo(rectangleRightX, currentY);
  doc.stroke();

  // Draw vertical lines extending from headers to bottom of table
  doc.lineWidth(0.5);
  let tableVerticalLineX = tableStartX;

  // Draw first vertical line (leftmost)
  doc.moveTo(tableVerticalLineX, updatedTableStartY);
  doc.lineTo(tableVerticalLineX, currentY);
  doc.stroke();

  // Draw vertical lines after each column
  tableHeaders.forEach((header, index) => {
    tableVerticalLineX += columnWidths[index];
    doc.moveTo(tableVerticalLineX, updatedTableStartY);
    doc.lineTo(tableVerticalLineX, currentY);
    doc.stroke();
  });

  // Add totals section
  const totalsY = pageHeight - margin - 200; // Position totals near bottom
  const totalsX = pageWidth - margin - 200;

  doc.fontSize(12).font("Helvetica-Bold");

  if (invoice_total_parts_services_amount) {
    doc.text(
      `Subtotal: ₹${invoice_total_parts_services_amount.toFixed(2)}`,
      totalsX,
      totalsY
    );
  }

  if (invoice_gst_amount) {
    doc.text(`GST: ₹${invoice_gst_amount.toFixed(2)}`, totalsX, totalsY + 20);
  }

  if (invoice_discount_amount) {
    doc.text(
      `Discount: ₹${invoice_discount_amount.toFixed(2)}`,
      totalsX,
      totalsY + 40
    );
  }

  if (invoice_shipping_charges) {
    doc.text(
      `Shipping: ₹${invoice_shipping_charges.toFixed(2)}`,
      totalsX,
      totalsY + 60
    );
  }

  if (invoice_total_amount) {
    doc.text(
      `Total: ₹${invoice_total_amount.toFixed(2)}`,
      totalsX,
      totalsY + 80
    );
  }

  // Add footer
  const footerY = pageHeight - margin - 50;
  doc.fontSize(8).font("Helvetica");
  doc.text("Thank you for your business!", { align: "center" }, footerY);

  // Return the document as a buffer
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => {
      const buffer = Buffer.concat(chunks);
      const base64 = buffer.toString("base64");
      resolve(base64);
    });
    doc.on("error", reject);
    doc.end();
  });
};

export default classicInvoiceTemplate;
