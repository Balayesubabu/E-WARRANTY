import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const getProviderByUserId = async (user_id, tx = prisma) => {
  return tx.provider.findFirst({
    where: { user_id },
  });
};

const getDeliveryChallanById = async (
  delivery_challan_id,
  provider_id,
  tx = prisma
) => {
  return tx.salesInvoice.findFirst({
    where: {
      id: delivery_challan_id,
      provider_id: provider_id,
      invoice_type: "Delivery_Challan",
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

const clearDeliveryChallanRecords = async (
  delivery_challan_id,
  tx = prisma
) => {
  await tx.salesInvoiceParty.deleteMany({
    where: { sales_invoice_id: delivery_challan_id },
  });

  await tx.salesPart.deleteMany({
    where: { sales_invoice_id: delivery_challan_id },
  });

  await tx.salesService.deleteMany({
    where: { sales_invoice_id: delivery_challan_id },
  });

  await tx.salesInvoiceTransactions.deleteMany({
    where: { sales_invoice_id: delivery_challan_id },
  });

  await tx.salesAdditionalCharges.deleteMany({
    where: { sales_invoice_id: delivery_challan_id },
  });

  return true;
};

const deleteDeliveryChallan = async (delivery_challan_id, tx = prisma) => {
  return tx.salesInvoice.delete({
    where: { id: delivery_challan_id },
  });
};

export {
  getProviderByUserId,
  getDeliveryChallanById,
  clearDeliveryChallanRecords,
  deleteDeliveryChallan,
};
