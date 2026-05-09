import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const getProviderByUserId = async (user_id, tx = prisma) => {
  return tx.provider.findFirst({ where: { user_id } });
};

const getProformaInvoiceById = async (
  proforma_invoice_id,
  provider_id,
  tx = prisma
) => {
  return tx.salesInvoice.findFirst({
    where: {
      id: proforma_invoice_id,
      provider_id: provider_id,
      invoice_type: "Proforma_Invoice",
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

const clearProformaInvoiceRecords = async (
  proforma_invoice_id,
  tx = prisma
) => {
  await tx.salesInvoiceParty.deleteMany({
    where: { sales_invoice_id: proforma_invoice_id },
  });

  await tx.salesPart.deleteMany({
    where: { sales_invoice_id: proforma_invoice_id },
  });

  await tx.salesService.deleteMany({
    where: { sales_invoice_id: proforma_invoice_id },
  });

  await tx.salesInvoiceTransactions.deleteMany({
    where: { sales_invoice_id: proforma_invoice_id },
  });

  await tx.salesAdditionalCharges.deleteMany({
    where: { sales_invoice_id: proforma_invoice_id },
  });

  return true;
};

const deleteProformaInvoice = async (proforma_invoice_id, tx = prisma) => {
  return tx.salesInvoice.delete({
    where: { id: proforma_invoice_id },
  });
};

export {
  getProviderByUserId,
  getProformaInvoiceById,
  clearProformaInvoiceRecords,
  deleteProformaInvoice,
};
