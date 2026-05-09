import { getInvoiceSettings } from "./query.js";
import { generatePDFBuffer } from "../../services/pdfService/pdfService.js";

/**
 * Generate PDF for a provider's invoice.
 * @param {string} provider_id - ID of the provider
 * @param {object} invoiceData - Invoice data
 * @returns {Promise<Buffer>} - PDF buffer
 */
export const pdfGenerator = async (provider_id, invoiceData,invoice_type) => {
  try {
    // 1️⃣ Fetch the invoice settings for the provider
    let invoiceSettings = await getInvoiceSettings(provider_id);
    // console.log(invoiceSettings, " invoiceSettings");

    if (!invoiceSettings) {
      // throw new Error("Invoice settings not found for this provider");
      console.log("Invoice settings not found for this provider");
      invoiceSettings = {selectedTheme: 1,selectedColor: '#000000', invoiceDetails: [], customFields: []}
    }

    // 2️⃣ Generate the PDF buffer using the invoice data & settings
    const pdfBuffer = await generatePDFBuffer(invoiceData, invoiceSettings, invoice_type);

    // 3️⃣ Return the PDF buffer
    return pdfBuffer;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};
