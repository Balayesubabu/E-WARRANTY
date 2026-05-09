import puppeteer from "puppeteer";
import { renderStandardSalesInvoiceHTML, renderStandardPurchaseInvoiceHTML, renderStandardBookingInvoiceHTML } from "./invoiceTemplate.js";

export const generatePDFBuffer = async (invoiceData, invoiceSettings, invoice_type) => {
  const { selectedTheme } = invoiceSettings;
  console.log(invoiceData, " invoiceData");

  let html;

  switch (selectedTheme) {
    case 1:
      if (invoice_type === "Sales") {
      html = renderStandardSalesInvoiceHTML(invoiceData, invoiceSettings);
      }
      if (invoice_type === "Purchase") {
      html = renderStandardPurchaseInvoiceHTML(invoiceData, invoiceSettings);
      } 
      if (invoice_type === "Booking") {
      html = renderStandardBookingInvoiceHTML(invoiceData?.booking, invoiceData?.salesInvoice, invoiceSettings);
      }
      break;
    default:
      // fallback template
      html = renderStandardSalesInvoiceHTML(invoiceData, invoiceSettings);
      break;
  }

  const browser = await puppeteer.launch({ headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
   });
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
  });

  await browser.close();
  return pdfBuffer;
};
