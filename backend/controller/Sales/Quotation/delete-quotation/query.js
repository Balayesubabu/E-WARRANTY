import { Provider, SalesInvoice } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
  return Provider.findFirst({ where: { user_id } });
};

const getProviderQuotationById = async (provider_id, quotation_id) => {
  return SalesInvoice.findFirst({
    where: {
      id: quotation_id,
      provider_id: provider_id,
      invoice_type: "Quotation",
    },
  });
};

const clearQuotationRecords = async (quotation_id, tx) => {
  await tx.salesPart.deleteMany({ where: { sales_invoice_id: quotation_id } });
  await tx.salesService.deleteMany({
    where: { sales_invoice_id: quotation_id },
  });
  await tx.salesInvoiceParty.deleteMany({
    where: { sales_invoice_id: quotation_id },
  });
  await tx.salesInvoiceTransactions.deleteMany({
    where: { sales_invoice_id: quotation_id },
  });
  await tx.salesAdditionalCharges.deleteMany({
    where: { sales_invoice_id: quotation_id },
  });
  // If Transaction is linked directly to the quotation, delete here too
};

const deleteQuotation = async (quotation_id, tx) => {
  await tx.salesInvoice.delete({ where: { id: quotation_id } });
};

export {
  getProviderByUserId,
  getProviderQuotationById,
  clearQuotationRecords,
  deleteQuotation,
};
