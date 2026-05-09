import PDFDocument from "pdfkit";

function drawHorizontalLine(doc, pageWidth, yOffset = 1, color = "#B22A20") {
  doc.moveDown(yOffset);

  const startX = 42; // left margin
  const endX = pageWidth - 42; // right margin
  const lineY = doc.y;

  doc
    .moveTo(startX, lineY)
    .lineTo(endX, lineY)
    .strokeColor(color)
    .lineWidth(1)
    .stroke();

  doc.moveDown(yOffset);
}

const templateOne = async (data) => {
  //console.log("Template Data : ", data);
  const {
    invoice_number,
    provider,
    provider_customer,
    terms_and_conditions,
    invoice_date,
    due_date,
    SalesPart,
    SalesService,
    SalesAdditionalCharges,
    SalesInvoiceParty,
    ProviderBank
  } = data;

  const doc = new PDFDocument({ margin: 40, size: "A4" });
  const pageWidth = doc.page.width;

  // Utility
  const currency = (val) =>
    `₹${(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  // --- Header ---
  // Extract Provider from SalesInvoiceParty
  const providerData =
    SalesInvoiceParty.find((p) => p.type === "Provider") || {};

  // Now render Provider details
  doc
    .fontSize(16)
    .fillColor("#c62828")
    .font("Helvetica-Bold")
    .text(providerData.party_name || "", { align: "left" });

  doc
    .moveDown(0.2)
    .fontSize(9)
    .fillColor("#5E6470")
    .font("Helvetica")
    .text(provider.company_website || "");
  doc
    .moveDown(0.2)
    .fontSize(9)
    .fillColor("#5E6470")
    .font("Helvetica")
    .text(providerData.party_email || "");
  doc
    .moveDown(0.2)
    .fontSize(9)
    .fillColor("#5E6470")
    .font("Helvetica")
    .text(providerData.party_phone || "");

  doc
    .fontSize(9)
    .fillColor("#5E6470")
    .text(`${providerData.party_address || ""}`, pageWidth / 2, 55, {
      align: "right",
    })
    .text(
      `${providerData.party_city || ""} ${providerData.party_state || ""} ${
        providerData.party_pincode || ""
      }`,
      { align: "right" }
    )
    .text(`GSTIN : ${providerData.party_gstin_number || ""}`, {
      align: "right",
    });

  doc.moveDown(6);

  // --- Invoice Details Row ---
  const billTo = SalesInvoiceParty.find((p) => p.type === "Bill_To") || {};
  const rowY = 150; // Y position for the row
  const colWidth = pageWidth / 4; // 4 equal columns

  // --- Billed To ---
  doc
    // Label
    .fontSize(9)
    .font("Helvetica")
    .fillColor("#5E6470")
    .text("Billed To", 42, rowY)

    // Party Name
    .fontSize(11)
    .font("Helvetica-Bold")
    .fillColor("#000000")
    .text(`${billTo.party_name || ""}`, 42, rowY + 15)

    // Address & Contact
    .fontSize(9)
    .font("Helvetica")
    .fillColor("#5E6470")
    .text(`${billTo.party_address || ""}`, 42, rowY + 30)
    .text(
      `${billTo.party_city || ""} ${billTo.party_state || ""} ${
        billTo.party_pincode || ""
      }`,
      42
    )
    .text(billTo.party_phone || "", 42);

  // --- Invoice Number ---
  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor("#5E6470")
    .text("Invoice Number", colWidth + 42, rowY)
    .fontSize(11)
    .font("Helvetica-Bold")
    .fillColor("#000000")
    .text(`#${invoice_number || ""}`, colWidth + 42, rowY + 15);

  // --- Invoice Date ---
  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor("#5E6470")
    .text("Date", colWidth * 2 + 42, rowY)
    .fontSize(11)
    .font("Helvetica-Bold")
    .fillColor("#000000")
    .text(
      invoice_date ? new Date(invoice_date).toLocaleDateString("en-GB") : "",
      colWidth * 2 + 42,
      rowY + 15
    );

  // --- Due Date ---
  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor("#5E6470")
    .text("Due Date", colWidth * 3 + 42, rowY)
    .fontSize(11)
    .font("Helvetica-Bold")
    .fillColor("#000000")
    .text(
      due_date ? new Date(due_date).toLocaleDateString("en-GB") : "",
      colWidth * 3 + 42,
      rowY + 15
    );

  doc.moveDown(3);

  // --- Bank Details ---
  doc
    .fontSize(11)
    .font("Helvetica-Bold")
    .fillColor("#000000")
    .text("Bank details", 42)
    .fontSize(9)
    .font("Helvetica")
    .fillColor("#5E6470")
    .text(`Bank : ${ProviderBank.bank_name || ""}`)
    .text(`IFS code : ${ProviderBank.bank_ifsc_code || ""}`)
    .text(`Name : ${ProviderBank.bank_account_holder_name || ""}`)
    .text(`Account No : ${ProviderBank.bank_account_number || ""}`);

  drawHorizontalLine(doc, pageWidth);

  // --- Table Header ---
  const tableTop = doc.y;

  // smaller left & right margins
  const leftMargin = 42;
  const rightMargin = 42;
  const tableWidth = pageWidth - leftMargin - rightMargin;

  // column widths (adjust proportionally if needed)
  const colWidths = [200, 60, 40, 80, 60, 80];

  const headers = ["ITEM DETAIL", "HSN", "QTY", "RATE", "GST", "AMOUNT"];

  let x = leftMargin;
  headers.forEach((h, i) => {
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#5E6470")
      .text(h, x, tableTop, {
        width: colWidths[i],
        align: i === 0 ? "left" : "center",
      });
    x += colWidths[i];
  });

  doc.moveDown(1);

  // --- Table Rows ---
  let y = tableTop + 20;
  let subtotal = 0;

  //const leftMargin = 30; // same as table header
  const drawRow = (item) => {
    let x = leftMargin; // start from smaller left margin

    // Item name and description
    doc.font("Helvetica-Bold").text(item.name, x, y, { width: colWidths[0] });
    doc
      .font("Helvetica")
      .fillColor("#5E6470")
      .fontSize(9)
      .text(item.description || "Item description", x, y + 12, {
        width: colWidths[0],
      });

    x += colWidths[0];
    doc
      .fontSize(10)
      .text(item.hsn || "", x, y, { width: colWidths[1], align: "center" });

    x += colWidths[1];
    doc.text(item.qty || 1, x, y, { width: colWidths[2], align: "center" });

    x += colWidths[2];
    doc.text(currency(item.rate), x, y, {
      width: colWidths[3],
      align: "center",
    });

    x += colWidths[3];
    doc.text(`${item.gst || 0}%`, x, y, {
      width: colWidths[4],
      align: "center",
    });

    x += colWidths[4];
    doc.text(currency(item.amount), x, y, {
      width: colWidths[5],
      align: "center",
    });

    subtotal += item.amount;
    y += 40; // next row
  };

  // Render Parts & Services as rows
  SalesPart.forEach((p) =>
    drawRow({
      name: p.part_name,
      description: p.part_description,
      hsn: p.part_hsn_code,
      qty: p.part_quantity,
      rate: p.part_selling_price,
      gst: p.part_gst_percentage,
      amount: p.part_total_price,
    })
  );

  SalesService.forEach((s) =>
    drawRow({
      name: s.service_name,
      description: s.service_description,
      hsn: "-",
      qty: "-",
      rate: s.service_price,
      gst: s.service_gst_percentage,
      amount: s.service_total_price,
    })
  );

  doc.moveDown(1);

  drawHorizontalLine(doc, pageWidth);

  // --- Totals ---
  doc.moveDown(0.3); // adds vertical space

  // start totals from current y
  let totalsY = doc.y;

  doc.font("Helvetica").fontSize(11);

  // --- Subtotal ---
  doc.text(`Subtotal`, 400, totalsY);
  doc.text(currency(subtotal), 500, totalsY, { align: "right" });
  totalsY = doc.y + 5; // small gap after row

  // --- Additional Charges & Taxes ---
  let totalTax = 0;
  SalesAdditionalCharges.forEach((charge) => {
    const { name, total_amount, gst_percentage, gst_amount } = charge;
    totalTax += gst_amount || 0;

    doc.text(`${name} (${gst_percentage || 0}%)`, 400, totalsY);
    doc.text(currency(total_amount), 500, totalsY, { align: "right" });
    totalsY = doc.y + 5;
  });

  // --- Grand Total ---
  const grandTotal =
    subtotal +
    SalesAdditionalCharges.reduce((acc, c) => acc + c.total_amount, 0);

  doc.font("Helvetica-Bold").text(`Total`, 400, totalsY);
  doc.text(currency(grandTotal), 500, totalsY, { align: "right" });

  // --- Footer ---
  doc.moveDown(16);
  //const leftMargin = 42; // left margin

  // Thanks message
  doc
    .font("Helvetica")
    .fillColor("#5E6470")
    .text("Thanks for the business.", leftMargin);

  // Add some vertical space
  doc.moveDown(2);

  // --- Terms & Conditions ---
  doc
    .fontSize(8)
    .fillColor("#5E6470")
    .text("Terms & Conditions", leftMargin, doc.y, { underline: true })
    .moveDown(0.5); // small gap after heading

  // Print each term from the array dynamically
  terms_and_conditions.forEach((term, index) => {
    doc.text(`${index + 1}. ${term}`, leftMargin, doc.y, {
      indent: 10,
      lineGap: 2,
    });
  });

  // Finalize
  doc.end();

  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => {
      const buffer = Buffer.concat(chunks);
      resolve(buffer.toString("base64"));
    });
    doc.on("error", reject);
  });
};

export default templateOne;
