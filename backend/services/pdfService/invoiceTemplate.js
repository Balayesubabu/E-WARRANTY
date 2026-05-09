import { convertNumberToWords, numberFormatter, dateFormatter } from "../../utils/numberToWords.js";

const renderStandardSalesInvoiceHTML = (data, invoiceSettings) => {
  console.log("Rendering Sales Invoice HTML with data:", data);
  const { selectedColor = "#000000", invoiceDetails = [], customFields = [] } = invoiceSettings || {};

  let billTitle;
  let shipTitle;
  if (data.invoice_type === "Sales" || data.invoice_type === "Quotation" || data.invoice_type === "Delivery_Challan" || data.invoice_type === "Proforma_Invoice") {
    billTitle = "Bill To";
    shipTitle = "Ship To";
  }
  if (data.invoice_type === "Sales_Return" || data.invoice_type === "Credit_Note") {
    billTitle = "Party Name";
    shipTitle = "Ship From";
  }

  const billTo = data?.SalesInvoiceParty?.find((p) => p.type === 'Bill_To') || {};
  const shipTo = data?.SalesInvoiceParty?.find((p) => p.type === 'Ship_To') || {};

  console.log("Bill To:", billTo);
  console.log("Ship To:", shipTo);


  const combinedItems = [
    ...(data?.SalesPart ?? []),
    ...(data?.SalesPackage ?? []),
    ...(data?.SalesService ?? []),
  ];

  const subtotal = combinedItems.reduce(
    (acc, item) => acc + (item.part_selling_price ?? item.service_price ?? 0) * (item.part_quantity ?? 1),
    0
  );
  const totalDiscount = combinedItems.reduce(
    (acc, item) => acc + (item.part_discount_amount ?? item.service_discount_amount ?? 0),
    0
  );
  const totalGst = combinedItems.reduce(
    (acc, item) => acc + (item.part_gst_amount ?? item.service_gst_amount ?? 0),
    0
  );
  const totalAmount = combinedItems.reduce(
    (acc, item) => acc + (item.part_total_price ?? item.service_total_price ?? 0),
    0
  );
  // let linked_invoice_balance = 0;
  // if(data.linked_invoice_number){
  //   linked_invoice_balance = data.invoice_pending_amount.toFixed(2) - data.linked_invoice_total_amount.toFixed(2);
  //   if(linked_invoice_balance < 0){
  //     linked_invoice_balance = 0;
  //   }

  // }
  //   let linked_from_pending_amount = 0;
  //   if (data.linked_from_paid_amount) {
  //     if(data.marked_as_full_paid){
  //   linked_from_pending_amount = 0;
  // }
  // else{
  //   linked_from_pending_amount =
  //     Number(data.invoice_pending_amount.toFixed(2)) -
  //     Number(data.linked_from_paid_amount.toFixed(2));

  //   if (linked_from_pending_amount < 0) {
  //     linked_from_pending_amount = Math.abs(linked_from_pending_amount).toFixed(2);
  //   }
  // }
  // }


  let formattedTitle =
    typeof data?.invoice_type === "string" && data.invoice_type.trim()
      ? data.invoice_type
        .split("_")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
      : "Invoice";


  if (formattedTitle === "Sales") {
    formattedTitle = "Sales Invoice";
  }

  // Item rows
  const itemRows = combinedItems
    .map(
      (item) => `
      <tr>
        <td class="invoice-value">${item.part_name || item.service_name || "-"}</td>
        <td class="invoice-value">${item.part_hsn_code || item.service_sac_number || "-"}</td>
        <td class="invoice-value">${item.part_quantity ?? "-"}</td>
        <td class="invoice-value">₹ ${numberFormatter(item.part_selling_price ?? item.service_price ?? 0)}</td>
        <td class="invoice-value">₹ ${numberFormatter(item.part_discount_amount ?? item.service_discount_amount ?? 0)}</td>
        <td class="invoice-value">₹ ${numberFormatter(item.part_gst_amount ?? item.service_gst_amount ?? 0)}</td>
        <td class="invoice-value">₹ ${numberFormatter(item.part_total_price ?? item.service_total_price ?? 0)}</td>
      </tr>`
    )
    .join("");

  // Additional charges
  const additionalChargesHTML =
    data?.SalesAdditionalCharges?.map(
      (ch) => `
      <div class="row-space">
        <p class="invoice-normal">${ch.name}</p>
        <p class="invoice-normal">₹ ${numberFormatter(ch.total_amount)}</p>
      </div>
    `
    ).join("") || "";

  // Notes
  const notesHTML =
    data?.additional_notes?.map((n) => `<p class="invoice-label">${n}</p>`).join("") || "";

  // Terms
  const termsHTML =
    data?.terms_and_conditions?.map((t) => `<p class="invoice-label">${t}</p>`).join("") || "";

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>${formattedTitle}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background: #fff;
          color: #111827;
          padding: 20px;
        }
        .card {
          width: 950px;
          margin: 0 auto;
          padding: 20px;
          background:#fff;
        }
        .invoice-label {
          margin: 2px 0;
          font-weight: 500;
          font-size: 12px;
          color: #4B5563;
        }
        .invoice-value {
          margin: 2px 0;
          font-weight: 600;
          font-size: 12px;
          color: #111827;
        }
        .invoice-normal {
          margin: 2px 0;
          font-weight: 500;
          font-size: 12px;
          color: #111827;
        }
        .row-space {
          display: flex;
          justify-content: space-between;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 24px;
          margin-bottom: 8px;
        }
        th {
          font-weight: 500;
          font-size: 12px;
          color: #4B5563;
          border-top: 1px solid ${selectedColor};
          border-bottom: 1px solid ${selectedColor};
          text-align: left;
          padding: 8px 4px;
        }
        td {
          padding: 6px 4px;
        }
      </style>
    </head>
    <body>
      <div>
        <div style="text-align:center;">
          <h2 style="font-size:18px;">${formattedTitle}</h2>
        </div>

        <div style="display:flex; justify-content:space-between;">
          <div>
            <h2 style="font-size:20px; color:${selectedColor};">${data?.provider?.company_name || "-"}</h2>
            <p class="invoice-label">${data?.provider?.company_address || ""}</p>
            <p class="invoice-label">Email: ${data?.provider?.user?.email || "-"}</p>
            <p class="invoice-label">Phone: ${data?.provider?.user?.phone_number || "-"}</p>
            ${data?.provider?.gst_number ? `<p class="invoice-label">GSTIN: ${data.provider.gst_number}</p>` : ""}
            ${data?.provider?.company_website ? `<p class="invoice-label">Website: ${data.provider.company_website}</p>` : ""}
          </div>
          ${data?.provider?.company_logo ? `<img src="${data.provider.company_logo}" style="width:120px;height:60px;">` : ""}
        </div>

        <div style="display:flex; justify-content:space-between; margin-top:16px;">
          <div>
            <p class="invoice-label">${formattedTitle} Number</p>
            <p class="invoice-value">${data?.invoice_number || "-"}</p>
          </div>
          <div style="display:flex; gap:40px;">
            <div>
              <p class="invoice-label">Date</p>
              <p class="invoice-value">${dateFormatter(data?.invoice_date)}</p>
            </div>
            <div>
              <p class="invoice-label">Due Date</p>
              <p class="invoice-value">${dateFormatter(data?.due_date)}</p>
            </div>
          </div>
        </div>

        <!-- Bill/Ship -->
        <div style="border:1px solid #ddd; border-radius:12px; padding:16px; margin-top:16px;">
        <div style="display:flex; justify-content:space-between;">
          <div>
            <h4 class="invoice-label">${billTitle},</h4>
            <p class="invoice-value">${billTo?.party_name || "-"}</p>
            ${billTo?.party_address ? `<p class="invoice-label">${billTo.party_address}</p>` : ""}
            <p class="invoice-label">${billTo?.party_city || ""} ${billTo?.party_state || ""} ${billTo?.party_pincode || ""}</p>
            <p class="invoice-label">Mobile: ${billTo?.party_phone || "-"}</p>
            ${billTo?.party_email ? `<p class="invoice-label">Email: ${billTo.party_email}</p>` : ""}
            ${billTo?.party_gstin_number ? `<p class="invoice-label">GSTIN: ${billTo.party_gstin_number}</p>` : ""}
          </div>

          <div>
            <h4 class="invoice-label">${shipTitle},</h4>
            <p class="invoice-value">${shipTo?.party_name || "-"}</p>
            ${shipTo?.party_address ? `<p class="invoice-label">${shipTo.party_address}</p>` : ""}
            <p class="invoice-label">${shipTo?.party_city || ""} ${shipTo?.party_state || ""} ${shipTo?.party_pincode || ""}</p>
            <p class="invoice-label">Mobile: ${shipTo?.party_phone || "-"}</p>
            ${shipTo?.party_email ? `<p class="invoice-label">Email: ${shipTo.party_email}</p>` : ""}
            ${shipTo?.party_gstin_number ? `<p class="invoice-label">GSTIN: ${shipTo.party_gstin_number}</p>` : ""}
          </div>
        </div>

        <!-- Items -->
        <table>
          <thead>
            <tr>
              <th>ITEM DETAIL</th>
              <th>HSN/SAC</th>
              <th>QTY</th>
              <th>RATE</th>
              <th>DISCOUNT</th>
              <th>GST</th>
              <th>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
            <tr>
              <th>Subtotal</th>
              <th></th><th></th>
              <th>₹${numberFormatter(subtotal)}</th>
              <th>₹${numberFormatter(totalDiscount)}</th>
              <th>₹${numberFormatter(totalGst)}</th>
              <th>₹${numberFormatter(totalAmount)}</th>
            </tr>
          </tbody>
        </table>

        <!-- Summary -->
        <div style="display:flex; justify-content:space-between; align-items:ceter; margin-top:16px;">
          <div style="width:45%;">
            <div class="row-space">
              <p>Bank Name</p><p>${data?.ProviderBank?.bank_name || "-"}</p>
            </div>
            <div class="row-space">
              <p class="invoice-value">IFSC code</p><p class="invoice-label">${data?.ProviderBank?.bank_ifsc_code || "-"}</p>
            </div>
            <div class="row-space">
              <p class="invoice-value">Name</p><p class="invoice-label">${data?.ProviderBank?.bank_account_holder_name || "-"}</p>
            </div>
            <div class="row-space">
              <p class="invoice-value">Account #</p><p class="invoice-label">${data?.ProviderBank?.bank_account_number || "-"}</p>
            </div>
            ${data?.provider?.qr_code_image ? `<img src="${data.provider.qr_code_image}" style="width:72px;height:72px;margin-top:10px;">` : ""}
          </div>

          <div style="width:45%;">
            ${additionalChargesHTML}
            <div class="row-space"><p class="invoice-normal">Taxable Amount</p><p class="invoice-normal">₹${numberFormatter(subtotal)}</p></div>
            <div class="row-space"><p class="invoice-normal">Discount</p><p class="invoice-normal">₹${numberFormatter(totalDiscount)}</p></div>
            <div class="row-space"><p class="invoice-normal">SGST</p><p class="invoice-normal">₹${(totalGst / 2).toFixed(2)}</p></div>
            <div class="row-space"><p class="invoice-normal">CGST</p><p class="invoice-normal">₹${(totalGst / 2).toFixed(2)}</p></div>

            ${data?.invoice_tcs_percentage > 0
      ? `<div class="row-space"><p class="invoice-normal">TCS @${data.invoice_tcs_percentage}%</p><p class="invoice-normal">₹${data?.invoice_tcs_amount?.toFixed(2)}</p></div>`
      : ""
    }

    ${data?.invoice_tds_percentage > 0
      ? `<div class="row-space"><p class="invoice-normal">TDS @${data.invoice_tds_percentage}%</p><p class="invoice-normal">₹${data?.invoice_tds_amount?.toFixed(2)}</p></div>`
      : ""
    }
            ${data?.invoice_additional_discount_amount > 0
      ? `<div class="row-space"><p class="invoice-normal">Additional Discount</p><p class="invoice-normal">₹${data?.invoice_additional_discount_amount}</p></div>`
      : ""
    }
            ${data?.auto_round_off_amount
      ? `<div class="row-space"><p class="invoice-normal">Round off</p><p class="invoice-normal">₹${data?.auto_round_off_amount?.toFixed(2)}</p></div>`
      : ""
    }

            <hr style="border:none; border-top:1px solid ${selectedColor};" />
            <div class="row-space"><p class="invoice-normal">Total Amount</p><p class="invoice-normal">₹${data?.invoice_total_amount?.toFixed(2)}</p></div>

            ${!["Quotation", "Delivery_Challan", "Proforma_Invoice", "Purchase_Order"].includes(data?.invoice_type)
      ? data.linked_invoice_number
        ? `<div class="row-space"><p class="invoice-value">Received Amount</p><p class="invoice-value">₹${data?.invoice_paid_amount?.toFixed(2)}</p></div>
              <div class="row-space"><p class="invoice-normal">Credit Note Settled</p><p class="invoice-normal">₹${data?.linked_invoice_total_amount?.toFixed(2)}</p></div>
                   <div class="row-space"><p class="invoice-normal">Balance Due</p><p class="invoice-normal">₹${data?.linked_invoice_balance?.toFixed(2)}</p></div>`
        : data.linked_from_paid_amount
          ? `<div class="row-space"><p class="invoice-value">Paid Amount</p><p class="invoice-value">₹${data?.linked_from_paid_amount?.toFixed(2)}</p></div>
         <div class="row-space"><p class="invoice-normal">Balance Due</p><p class="invoice-normal">₹${data?.linked_from_pending_amount?.toFixed(2)}</p></div>`
          : `<div class="row-space"><p class="invoice-value">Paid Amount</p><p class="invoice-value">₹${data?.invoice_paid_amount?.toFixed(2)}</p></div>
                   <div class="row-space"><p class="invoice-normal">Balance Due</p><p class="invoice-normal">₹${data?.invoice_pending_amount?.toFixed(2)}</p></div>`
      : ""
    }
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; margin-top:16px;">
          <div style="width:48%;">
            <p class="invoice-value">Notes</p>${notesHTML}
            <div style="margin-top:12px;">
              <p class="invoice-value">Terms & Conditions</p>${termsHTML}
            </div>
          </div>
          <div style="width:48%; text-align:right;">
            <p class="invoice-value">Total Amount in words</p>
            <p class="invoice-label">${convertNumberToWords(data?.invoice_total_amount)}</p>
           ${data?.provider?.signature_image
      ? `<img src="${data.provider.signature_image}" style="width:160px;height:48px; display:block; margin-left:auto;">`
      : `<div style="width:160px;height:48px;border:1.5px solid gray; display:block; margin-left:auto;"></div>`}

            <p class="invoice-value">Authorised signature</p>
            <p class="invoice-label">${data?.provider?.company_name || "N/A"}</p>
          </div>
        </div>
      </div>
        <div style="text-align:center;margin-top:10px;">
          <p class="invoice-normal">Thanks for the business.</p>
        </div>
      </div>
    </body>
  </html>
  `;
};

const renderStandardPurchaseInvoiceHTML = (data, invoiceSettings) => {
  const { selectedColor = "#000000", invoiceDetails = [], customFields = [] } = invoiceSettings || {};
  let billTitle;
  let shipTitle;
  if (data.invoice_type === "Purchase" || data.invoice_type === "Purchase_Order") {
    billTitle = "Bill from,";
    shipTitle = "Shipp from,";
  }
  if (data.invoice_type === "Purchase_Return" || data.invoice_type === "Debit_Note") {
    billTitle = "Party Name";
    shipTitle = "Ship To";
  }

  const billTo = data?.PurchaseInvoiceParty?.find((p) => p.type === 'Bill_To') || {};
  const shipTo = data?.PurchaseInvoiceParty?.find((p) => p.type === 'Ship_To') || {};

  const combinedItems = [
    ...(data?.PurchasePart ?? []),
    ...(data?.PurchasePackage ?? []),
    ...(data?.PurchaseService ?? []),
  ];

  const subtotal = combinedItems.reduce(
    (acc, item) => acc + (item.part_purchase_price ?? item.service_price ?? 0) * (item.part_quantity ?? 1),
    0
  );
  const totalDiscount = combinedItems.reduce(
    (acc, item) => acc + (item.part_discount_amount ?? item.service_discount_amount ?? 0),
    0
  );
  const totalGst = combinedItems.reduce(
    (acc, item) => acc + (item.part_gst_amount ?? item.service_gst_amount ?? 0),
    0
  );
  const totalAmount = combinedItems.reduce(
    (acc, item) => acc + (item.part_total_price ?? item.service_total_price ?? 0),
    0
  );

  // let linked_invoice_balance = 0;
  // if(data.linked_invoice_number){
  //   linked_invoice_balance = data.invoice_pending_amount.toFixed(2) - data.linked_invoice_total_amount.toFixed(2);
  //   if(linked_invoice_balance < 0){
  //     linked_invoice_balance = 0;
  //   }

  // }

  let formattedTitle = data?.invoice_type
    ? data.invoice_type
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
    : "Invoice";

  if (formattedTitle === "Purchase") {
    formattedTitle = "Purchase Invoice";
  }

  // Item rows
  const itemRows = combinedItems
    .map(
      (item) => `
      <tr>
        <td class="invoice-value">${item.part_name || item.service_name || "-"}</td>
        <td class="invoice-value">${item.part_hsn_code || item.service_sac_number || "-"}</td>
        <td class="invoice-value">${item.part_quantity ?? "-"}</td>
        <td class="invoice-value">₹ ${numberFormatter(item.part_purchase_price ?? item.service_price ?? 0)}</td>
        <td class="invoice-value">₹ ${numberFormatter(item.part_discount_amount ?? item.service_discount_amount ?? 0)}</td>
        <td class="invoice-value">₹ ${numberFormatter(item.part_gst_amount ?? item.service_gst_amount ?? 0)}</td>
        <td class="invoice-value">₹ ${numberFormatter(item.part_total_price ?? item.service_total_price ?? 0)}</td>
      </tr>`
    )
    .join("");

  // Additional charges
  const additionalChargesHTML =
    data?.PurchaseAdditionalCharges?.map(
      (ch) => `
      <div class="row-space">
        <p class="invoice-normal">${ch.name}</p>
        <p class="invoice-normal">₹ ${numberFormatter(ch.total_amount)}</p>
      </div>
    `
    ).join("") || "";

  // Notes
  const notesHTML =
    data?.additional_notes?.map((n) => `<p class="invoice-label">${n}</p>`).join("") || "";

  // Terms
  const termsHTML =
    data?.terms_and_conditions?.map((t) => `<p class="invoice-label">${t}</p>`).join("") || "";

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>${formattedTitle}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background: #fff;
          color: #111827;
          padding: 20px;
        }
        .card {
          width: 950px;
          margin: 0 auto;
          padding: 20px;
          background:#fff;
        }
        .invoice-label {
          margin: 2px 0;
          font-weight: 500;
          font-size: 12px;
          color: #4B5563;
        }
        .invoice-value {
          margin: 2px 0;
          font-weight: 600;
          font-size: 12px;
          color: #111827;
        }
        .invoice-normal {
          margin: 2px 0;
          font-weight: 500;
          font-size: 12px;
          color: #111827;
        }
        .row-space {
          display: flex;
          justify-content: space-between;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 24px;
          margin-bottom: 8px;
        }
        th {
          font-weight: 500;
          font-size: 12px;
          color: #4B5563;
          border-top: 1px solid ${selectedColor};
          border-bottom: 1px solid ${selectedColor};
          text-align: left;
          padding: 8px 4px;
        }
        td {
          padding: 6px 4px;
        }
      </style>
    </head>
    <body>
      <div>
        <div style="text-align:center;">
          <h2 style="font-size:18px;">${formattedTitle}</h2>
        </div>

        <div style="display:flex; justify-content:space-between;">
          <div>
            <h2 style="font-size:20px; color:${selectedColor};">${data?.provider?.company_name || "-"}</h2>
            <p class="invoice-label">${data?.provider?.company_address || ""}</p>
            <p class="invoice-label">Email: ${data?.provider?.user?.email || "-"}</p>
            <p class="invoice-label">Phone: ${data?.provider?.user?.phone_number || "-"}</p>
            ${data?.provider?.gst_number ? `<p class="invoice-label">GSTIN: ${data.provider.gst_number}</p>` : ""}
            ${data?.provider?.company_website ? `<p class="invoice-label">Website: ${data.provider.company_website}</p>` : ""}
          </div>
          ${data?.provider?.company_logo ? `<img src="${data.provider.company_logo}" style="width:120px;height:60px;">` : ""}
        </div>

        <div style="display:flex; justify-content:space-between; margin-top:16px;">
          <div>
            <p class="invoice-label">${formattedTitle} Number</p>
            <p class="invoice-value">${data?.invoice_number || "-"}</p>
          </div>
          <div style="display:flex; gap:40px;">
            <div>
              <p class="invoice-label">Date</p>
              <p class="invoice-value">${dateFormatter(data?.invoice_date)}</p>
            </div>
            <div>
              <p class="invoice-label">Due Date</p>
              <p class="invoice-value">${dateFormatter(data?.due_date)}</p>
            </div>
          </div>
        </div>

        <!-- Bill/Ship -->
        <div style="border:1px solid #ddd; border-radius:12px; padding:16px; margin-top:16px;">
        <div style="display:flex; justify-content:space-between;">
          <div>
            <h4 class="invoice-label">${billTitle},</h4>
            <p class="invoice-value">${billTo?.party_name || "-"}</p>
            ${billTo?.party_address ? `<p class="invoice-label">${billTo.party_address}</p>` : ""}
            <p class="invoice-label">${billTo?.party_city || ""} ${billTo?.party_state || ""} ${billTo?.party_pincode || ""}</p>
            <p class="invoice-label">Mobile: ${billTo?.party_phone || "-"}</p>
            ${billTo?.party_email ? `<p class="invoice-label">Email: ${billTo.party_email}</p>` : ""}
            ${billTo?.party_gstin_number ? `<p class="invoice-label">GSTIN: ${billTo.party_gstin_number}</p>` : ""}
          </div>

          <div>
            <h4 class="invoice-label">${shipTitle},</h4>
            <p class="invoice-value">${shipTo?.party_name || "-"}</p>
            ${shipTo?.party_address ? `<p class="invoice-label">${shipTo.party_address}</p>` : ""}
            <p class="invoice-label">${shipTo?.party_city || ""} ${shipTo?.party_state || ""} ${shipTo?.party_pincode || ""}</p>
            <p class="invoice-label">Mobile: ${shipTo?.party_phone || "-"}</p>
            ${shipTo?.party_email ? `<p class="invoice-label">Email: ${shipTo.party_email}</p>` : ""}
            ${shipTo?.party_gstin_number ? `<p class="invoice-label">GSTIN: ${shipTo.party_gstin_number}</p>` : ""}
          </div>
        </div>

        <!-- Items -->
        <table>
          <thead>
            <tr>
              <th>ITEM DETAIL</th>
              <th>HSN/SAC</th>
              <th>QTY</th>
              <th>RATE</th>
              <th>DISCOUNT</th>
              <th>GST</th>
              <th>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
            <tr>
              <th>Subtotal</th>
              <th></th><th></th>
              <th>₹${numberFormatter(subtotal)}</th>
              <th>₹${numberFormatter(totalDiscount)}</th>
              <th>₹${numberFormatter(totalGst)}</th>
              <th>₹${numberFormatter(totalAmount)}</th>
            </tr>
          </tbody>
        </table>

        <!-- Summary -->
        <div style="display:flex; justify-content:space-between; margin-top:16px;">
          <div style="width:45%;">
            <div class="row-space">
              <p class="invoice-value">Bank Name</p><p class="invoice-label">${data?.ProviderBank?.bank_name || "-"}</p>
            </div>
            <div class="row-space">
              <p class="invoice-value">IFSC code</p><p class="invoice-label">${data?.ProviderBank?.bank_ifsc_code || "-"}</p>
            </div>
            <div class="row-space">
              <p class="invoice-value">Name</p><p class="invoice-label">${data?.ProviderBank?.bank_account_holder_name || "-"}</p>
            </div>
            <div class="row-space">
              <p class="invoice-value">Account #</p><p class="invoice-label">${data?.ProviderBank?.bank_account_number || "-"}</p>
            </div>
            ${data?.provider?.qr_code_image ? `<img src="${data.provider.qr_code_image}" style="width:72px;height:72px;margin-top:10px;">` : ""}
          </div>

          <div style="width:45%;">
            ${additionalChargesHTML}
            <div class="row-space"><p class="invoice-normal">Taxable Amount</p><p class="invoice-normal">₹${numberFormatter(subtotal)}</p></div>
            <div class="row-space"><p class="invoice-normal">Discount</p><p class="invoice-normal">₹${numberFormatter(totalDiscount)}</p></div>
            <div class="row-space"><p class="invoice-normal">SGST</p><p class="invoice-normal">₹${(totalGst / 2).toFixed(2)}</p></div>
            <div class="row-space"><p class="invoice-normal">CGST</p><p class="invoice-normal">₹${(totalGst / 2).toFixed(2)}</p></div>

            ${data?.invoice_tcs_percentage > 0
      ? `<div class="row-space"><p class="invoice-normal">TCS @${data.invoice_tcs_percentage}%</p><p class="invoice-normal">₹${data?.invoice_tcs_amount?.toFixed(2)}</p></div>`
      : ""
    }
    
    ${data?.invoice_tds_percentage > 0
      ? `<div class="row-space"><p class="invoice-normal">TDS @${data.invoice_tds_percentage}%</p><p class="invoice-normal">₹${data?.invoice_tds_amount?.toFixed(2)}</p></div>`
      : ""
    }

            ${data?.invoice_additional_discount_amount > 0
      ? `<div class="row-space"><p class="invoice-normal">Additional Discount</p><p class="invoice-normal">₹${data?.invoice_additional_discount_amount}</p></div>`
      : ""
    }
            ${data?.auto_round_off_amount
      ? `<div class="row-space"><p class="invoice-normal">Round off</p><p class="invoice-normal">₹${data?.auto_round_off_amount?.toFixed(2)}</p></div>`
      : ""
    }

            <hr style="border:none; border-top:1px solid ${selectedColor};" />
            <div class="row-space"><p class="invoice-normal">Total Amount</p><p class="invoice-normal">₹${data?.invoice_total_amount?.toFixed(2)}</p></div>

              ${!["Quotation", "Delivery_Challan", "Proforma_Invoice", "Purchase_Order"].includes(data?.invoice_type)
      ? data.linked_invoice_number
        ? `<div class="row-space"><p class="invoice-value">Received Amount</p><p class="invoice-value">₹${data?.invoice_paid_amount?.toFixed(2)}</p></div>
              <div class="row-space"><p class="invoice-normal">Debit Note Settled</p><p class="invoice-normal">₹${data?.linked_invoice_total_amount?.toFixed(2)}</p></div>
                   <div class="row-space"><p class="invoice-normal">Balance Due</p><p class="invoice-normal">₹${data?.linked_invoice_balance?.toFixed(2)}</p></div>`
        : data.linked_from_paid_amount
          ? `<div class="row-space"><p class="invoice-value">Paid Amount</p><p class="invoice-value">₹${data?.linked_from_paid_amount?.toFixed(2)}</p></div>
         <div class="row-space"><p class="invoice-normal">Balance Due</p><p class="invoice-normal">₹${data?.linked_from_pending_amount?.toFixed(2)}</p></div>`
          : `<div class="row-space"><p class="invoice-value">Paid Amount</p><p class="invoice-value">₹${data?.invoice_paid_amount?.toFixed(2)}</p></div>
                   <div class="row-space"><p class="invoice-normal">Balance Due</p><p class="invoice-normal">₹${data?.invoice_pending_amount?.toFixed(2)}</p></div>`
      : ""
    }
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; margin-top:16px;">
          <div style="width:48%;">
            <p class="invoice-value">Notes</p>${notesHTML}
            <div style="margin-top:12px;">
              <p class="invoice-value">Terms & Conditions</p>${termsHTML}
            </div>
          </div>
          <div style="width:48%; text-align:right;">
            <p class="invoice-value">Total Amount in words</p>
            <p class="invoice-label">${convertNumberToWords(data?.invoice_total_amount)}</p>
           ${data?.provider?.signature_image
      ? `<img src="${data.provider.signature_image}" style="width:160px;height:48px; display:block; margin-left:auto;">`
      : `<div style="width:160px;height:48px;border:1.5px solid gray; display:block; margin-left:auto;"></div>`}

            <p class="invoice-value">Authorised signature</p>
            <p class="invoice-label">${data?.provider?.company_name || "N/A"}</p>
          </div>
        </div>
      </div>
        <div style="text-align:center;margin-top:10px;">
          <p class="invoice-normal">Thanks for the business.</p>
        </div>
      </div>
    </body>
  </html>
  `;
};

function renderStandardBookingInvoiceHTML(data, SalesInvoice, invoiceSettings) {
  console.log(data, SalesInvoice, "datawewr")
  console.log(JSON.stringify(data?.provider?.ProviderBankDetails), "ProviderDetails")
  // formattedTitle, billTo, shipTo, itemRows, subtotal, totalDiscount, totalGst, totalAmount, additionalChargesHTML, notesHTML, termsHTML, dateFormatter, numberFormatter, convertNumberToWords, selectedColor
  const { selectedColor = "#000000" } = invoiceSettings || {};
  const billTo = data?.customer || {};
  const shipTo = data?.customer || {};

  const formattedTitle = data?.invoice_type
    ? data.invoice_type
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
    : "Invoice";

  const combinedItems = [
    ...data.BookingParts.map(item => ({ ...item, itemType: "Part" })),
    ...data.BookingServices.map(item => ({ ...item, itemType: "Service" }))
  ];

  const combinedItems2 = [
    ...data.BookingParts,
    ...data.BookingServices
  ];

  console.log(combinedItems, "combinedItems", combinedItems2, "combinedItems2");

  const subtotal = combinedItems.reduce(
    (acc, item) => acc + (item.price ?? item.price ?? 0) * (item.unit ?? 1),
    0
  );
  const totalDiscount = 0;

  const totalGst = combinedItems.reduce(
    (acc, item) => acc + (item.gst ?? item.gst ?? 0),
    0
  );
  const totalAmount = combinedItems.reduce(
    (acc, item) => acc + (item.total_price ?? item.total_price ?? 0),
    0
  );

  // Item rows
  const itemRows = combinedItems
    .map(
      (item) => `
      <tr>
        <td class="invoice-value">${item.franchise_open_inventory_name || item.franchise_service_name || "-"}</td>
        <td class="invoice-value">${item?.part_hsn_code || item.sac_number || "-"}</td>
        <td class="invoice-value">${item.unit ?? "-"}</td>
        <td class="invoice-value">₹ ${numberFormatter(item.price ?? item.price ?? 0)}</td>
        <td class="invoice-value">₹ ${numberFormatter(0)}</td>
        <td class="invoice-value">₹ ${numberFormatter(item.gst ?? item.gst ?? 0)}</td>
        <td class="invoice-value">₹ ${numberFormatter(item.total_price ?? item.total_price ?? 0)}</td>
      </tr>`
    )
    .join("");


  // Notes
  const notesHTML =
    data?.additional_notes?.map((n) => `<p class="invoice-label">${n}</p>`).join("") || "";

  // Terms
  const termsHTML =
    data?.terms_and_conditions?.map((t) => `<p class="invoice-label">${t}</p>`).join("") || "";


  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>${formattedTitle}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background: #fff;
          color: #111827;
          padding: 20px;
        }
        .card {
          width: 950px;
          margin: 0 auto;
          padding: 20px;
          background:#fff;
        }
        .invoice-label {
          margin: 2px 0;
          font-weight: 500;
          font-size: 12px;
          color: #4B5563;
        }
        .invoice-value {
          margin: 2px 0;
          font-weight: 600;
          font-size: 12px;
          color: #111827;
        }
        .invoice-normal {
          margin: 2px 0;
          font-weight: 500;
          font-size: 12px;
          color: #111827;
        }
        .row-space {
          display: flex;
          justify-content: space-between;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 24px;
          margin-bottom: 8px;
        }
        th {
          font-weight: 500;
          font-size: 12px;
          color: #4B5563;
          border-top: 1px solid ${selectedColor};
          border-bottom: 1px solid ${selectedColor};
          text-align: left;
          padding: 8px 4px;
        }
        td {
          padding: 6px 4px;
        }
      </style>
    </head>
    <body>
      <div>
        <div style="text-align:center;">
          <h2 style="font-size:18px;">${formattedTitle}</h2>
        </div>

        <div style="display:flex; justify-content:space-between;">
          <div>
            <h2 style="font-size:20px; color:${selectedColor};">${data?.provider?.company_name || "-"}</h2>
            <p class="invoice-label">${data?.provider?.company_address || ""}</p>
            <p class="invoice-label">Email: ${data?.provider?.user?.email || "-"}</p>
            <p class="invoice-label">Phone: ${data?.provider?.user?.phone_number || "-"}</p>
            ${data?.provider?.gst_number ? `<p class="invoice-label">GSTIN: ${data.provider.gst_number}</p>` : ""}
            ${data?.provider?.company_website ? `<p class="invoice-label">Website: ${data.provider.company_website}</p>` : ""}
            
          </div>
          ${data?.provider?.company_logo ? `<img src="${data.provider.company_logo}" style="width:120px;height:60px;">` : ""}
        </div>

        <div style="display:flex; justify-content:space-between; margin-top:16px;">
          <div>
            <p class="invoice-label">${formattedTitle} Number</p>
            <p class="invoice-value">${SalesInvoice?.invoice_number || "-"}</p>
          </div>
          <div style="display:flex; gap:40px;">
            <div>
              <p class="invoice-label">Date</p>
              <p class="invoice-value">${dateFormatter(SalesInvoice?.invoice_date)}</p>
            </div>
            <div>
              <p class="invoice-label">Due Date</p>
              <p class="invoice-value">${dateFormatter(SalesInvoice?.due_date)}</p>
            </div>
          </div>
        </div>

        <!-- Bill/Ship -->
        <div style="border:1px solid #ddd; border-radius:12px; padding:16px; margin-top:16px;">
        <div style="display:flex; justify-content:space-between;">
          <div>
            <h4 class="invoice-label">Billed to,</h4>
            <p class="invoice-value">${billTo?.customer_name || "-"}</p>
            ${billTo?.customer_address ? `<p class="invoice-label">${billTo.customer_address}</p>` : ""}
            <p class="invoice-label">Mobile: ${billTo?.customer_phone || "-"}</p>
            ${billTo?.customer_email ? `<p class="invoice-label">Email: ${billTo.customer_email}</p>` : ""}
            ${billTo?.customer_gstin_number ? `<p class="invoice-label">GSTIN: ${billTo.customer_gstin_number}</p>` : ""}
            ${data?.vehicle?.vehicle_number ? `<p class="invoice-label">GSTIN: ${data?.vehicle?.vehicle_number}</p>` : ""}
          </div>

          <div>
            <h4 class="invoice-label">Ship to,</h4>
            <p class="invoice-value">${shipTo?.customer_name || "-"}</p>
            ${shipTo?.customer_address ? `<p class="invoice-label">${shipTo.customer_address}</p>` : ""}
            <p class="invoice-label">Mobile: ${shipTo?.customer_phone || "-"}</p>
            ${shipTo?.customer_email ? `<p class="invoice-label">Email: ${shipTo.customer_email}</p>` : ""}
            ${shipTo?.customer_gstin_number ? `<p class="invoice-label">GSTIN: ${shipTo.customer_gstin_number}</p>` : ""}
          </div>
        </div>

        <!-- Items -->
        <table>
          <thead>
            <tr>
              <th>ITEM DETAIL</th>
              <th>HSN/SAC</th>
              <th>QTY</th>
              <th>RATE</th>
              <th>DISCOUNT</th>
              <th>GST</th>
              <th>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
            <tr>
              <th>Subtotal</th>
              <th></th><th></th>
              <th>₹${numberFormatter(subtotal)}</th>
              <th>₹${numberFormatter(totalDiscount)}</th>
              <th>₹${numberFormatter(totalGst)}</th>
              <th>₹${numberFormatter(totalAmount)}</th>
            </tr>
          </tbody>
        </table>

        <!-- Summary -->
        <div style="display:flex; justify-content:space-between; margin-top:16px;">
          <div style="width:45%;">
            <div class="row-space">
              <p class="invoice-value">Bank Name</p><p class="invoice-label">${data?.provider?.ProviderBankDetails[0]?.bank_name || "-"}</p>
            </div>
            <div class="row-space">
              <p class="invoice-value">IFSC code</p><p class="invoice-label">${data?.provider?.ProviderBankDetails[0]?.bank_ifsc_code || "-"}</p>
            </div>
            <div class="row-space">
              <p class="invoice-value">Name</p><p class="invoice-label">${data?.provider?.ProviderBankDetails[0]?.bank_account_holder_name || "-"}</p>
            </div>
            <div class="row-space">
              <p class="invoice-value">Account #</p><p class="invoice-label">${data?.provider?.ProviderBankDetails[0]?.bank_account_number || "-"}</p>
            </div>
            ${data?.provider?.qr_code_image ? `<img src="${data?.provider?.qr_code_image}" style="width:72px;height:72px;margin-top:10px;">` : ""}
          </div>

          <div style="width:45%;">
            <div class="row-space"><p class="invoice-normal">Taxable Amount</p><p class="invoice-normal">₹${numberFormatter(subtotal)}</p></div>
            <div class="row-space"><p class="invoice-normal">Discount</p><p class="invoice-normal">₹${numberFormatter(totalDiscount)}</p></div>
            <div class="row-space"><p class="invoice-normal">SGST</p><p class="invoice-normal">₹${(totalGst / 2).toFixed(2)}</p></div>
            <div class="row-space"><p class="invoice-normal">CGST</p><p class="invoice-normal">₹${(totalGst / 2).toFixed(2)}</p></div>

            ${data?.invoice_tcs_percentage > 0
      ? `<div class="row-space"><p class="invoice-normal">TCS @${data.invoice_tcs_percentage}%</p><p class="invoice-normal">₹${data?.invoice_tcs_amount?.toFixed(2)}</p></div>`
      : ""
    }
            ${data?.invoice_additional_discount_amount > 0
      ? `<div class="row-space"><p class="invoice-normal">Additional Discount</p><p class="invoice-normal">₹${data.invoice_additional_discount_amount}</p></div>`
      : ""
    }
            ${data?.auto_round_off_amount
      ? `<div class="row-space"><p class="invoice-normal">Round off</p><p class="invoice-normal">₹${data?.auto_round_off_amount?.toFixed(2)}</p></div>`
      : ""
    }

            <hr style="border:none; border-top:1px solid ${selectedColor};" />
            <div class="row-space"><p class="invoice-normal">Total Amount</p><p class="invoice-normal">₹${Number(SalesInvoice?.invoice_total_amount).toFixed(2)}</p></div>

            ${!["quotation", "delivery-challan", "proforma-invoice"].includes(data?.invoice_type)
      ? `<div class="row-space"><p class="invoice-value">Received Amount</p><p class="invoice-value">₹${SalesInvoice?.invoice_paid_amount}</p></div>
                   <div class="row-space"><p class="invoice-normal">Balance Due</p><p class="invoice-normal">₹${Number(SalesInvoice?.invoice_pending_amount).toFixed(2)}</p></div>`
      : ""
    }
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; margin-top:16px;">
          <div style="width:48%;">
            <p class="invoice-value">Notes</p>${notesHTML}
            <div style="margin-top:12px;">
              <p class="invoice-value">Terms & Conditions</p>${termsHTML}
            </div>
          </div>
          <div style="width:48%; text-align:right;">
            <p class="invoice-value">Total Amount in words</p>
            <p class="invoice-label">${convertNumberToWords(data?.invoice_total_amount)}</p>
           ${data?.provider?.signature_image
      ? `<img src="${data.provider.signature_image}" style="width:160px;height:48px; display:block; margin-left:auto;">`
      : `<div style="width:160px;height:48px;border:1.5px solid gray; display:block; margin-left:auto;"></div>`}

            <p class="invoice-value">Authorised signature</p>
            <p class="invoice-label">${data?.provider?.company_name || "N/A"}</p>
          </div>
        </div>
      </div>
        <div style="text-align:center;margin-top:10px;">
          <p class="invoice-normal">Thanks for the business.</p>
        </div>
      </div>
    </body>
  </html>
  `;
}

export { renderStandardSalesInvoiceHTML, renderStandardPurchaseInvoiceHTML, renderStandardBookingInvoiceHTML };