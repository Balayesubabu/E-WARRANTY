import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const getProviderByUserId = async (user_id, tx = prisma) => {
  return tx.provider.findFirst({ where: { user_id } });
};

const getCreditNoteById = async (credit_note_id, provider_id, tx = prisma) => {
  return tx.salesInvoice.findFirst({
    where: {
      id: credit_note_id,
      provider_id: provider_id,
      invoice_type: "Credit_Note",
    },
    include: {
      SalesPart: true,
      SalesService: true,
      SalesInvoiceParty: true,
      SalesInvoiceTransactions: true,
      SalesAdditionalCharges: true,
    },
  });
};

const clearCreditNoteRecords = async (credit_note_id, tx = prisma) => {
  await tx.salesInvoiceParty.deleteMany({
    where: { sales_invoice_id: credit_note_id },
  });

  await tx.salesPart.deleteMany({
    where: { sales_invoice_id: credit_note_id },
  });

  await tx.salesService.deleteMany({
    where: { sales_invoice_id: credit_note_id },
  });

  await tx.salesInvoiceTransactions.deleteMany({
    where: { sales_invoice_id: credit_note_id },
  });

  await tx.salesAdditionalCharges.deleteMany({
    where: { sales_invoice_id: credit_note_id },
  });

  return true;
};

const deleteCreditNote = async (credit_note_id, tx = prisma) => {
  return tx.salesInvoice.delete({
    where: { id: credit_note_id },
  });
};

export {
  getProviderByUserId,
  getCreditNoteById,
  clearCreditNoteRecords,
  deleteCreditNote,
};
