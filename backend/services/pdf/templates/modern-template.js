import PDFDocument from "pdfkit";

const modernInvoiceTemplate = async (data) => {
  const {
    invoice_number,
    provider,
    provider_customer,
    franchise,
    staff,
    invoice_date,
    invoice_total_amount,
    SalesPart,
    SalesService,
    SalesInvoiceParty,
    SalesAdditionalCharges,
  } = data;

  const doc = new PDFDocument({ margin: 40, size: "A4" });

  // Get page dimensions
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const margin = 20;

  // Draw border around the page with 20px margin
  doc
    .lineWidth(1)
    .rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2)
    .stroke();

  // Set content area with additional margin for text
  const contentMargin = 40;
  doc.moveTo(contentMargin, contentMargin);

  // --- Header ---
  doc
    .fontSize(24)
    .text("INVOICE", { align: "center", underline: true })
    .moveDown(1);

  // --- Company Info ---
  doc
    .fontSize(14)
    .text(`${provider.company_name || provider.name}`, { align: "center" })
    .fontSize(10)
    .text(`${provider.company_address || provider.address}`, {
      align: "center",
    })
    .text(`GST: ${provider.gst_number || ""}`, { align: "center" })
    .moveDown();

  // --- Invoice Details ---
  doc
    .fontSize(12)
    .text(`Invoice #: ${invoice_number}`)
    .text(
      `Date: ${invoice_date ? new Date(invoice_date).toLocaleDateString() : ""}`
    )
    .moveDown();

  // --- Customer Info ---
  const billTo = SalesInvoiceParty.find((p) => p.type === "Bill_To") || {};
  doc
    .text("Bill To:")
    .text(`${billTo.party_name || ""}`)
    .text(`${billTo.party_address || ""}`)
    .moveDown();

  // --- Items ---
  doc.fontSize(12).text("Items:", { underline: true }).moveDown(0.5);

  let total = 0;

  // Parts
  SalesPart.forEach((part) => {
    doc.text(
      `${part.part_name} - Qty: ${part.part_quantity} - Rs. ${
        part.part_total_price?.toFixed(2) || "0.00"
      }`
    );
    total += part.part_total_price || 0;
  });

  // Services
  SalesService.forEach((service) => {
    doc.text(
      `${service.service_name} - Rs. ${
        service.service_total_price?.toFixed(2) || "0.00"
      }`
    );
    total += service.service_total_price || 0;
  });

  // Additional Charges
  SalesAdditionalCharges.forEach((charge) => {
    doc.text(
      `${charge.name} - Rs. ${charge.total_amount?.toFixed(2) || "0.00"}`
    );
    total += charge.total_amount || 0;
  });

  doc.moveDown();
  doc.text(`Total: Rs. ${total.toFixed(2)}`, { underline: true });

  doc.end();

  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => {
      const buffer = Buffer.concat(chunks);
      const base64 = buffer.toString("base64");
      resolve(base64);
    });
    doc.on("error", reject);
  });
};

export default modernInvoiceTemplate;
