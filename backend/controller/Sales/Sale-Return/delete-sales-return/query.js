import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const getProviderByUserId = async (user_id, tx = prisma) => {
  const provider = await tx.provider.findFirst({
    where: {
      user_id: user_id,
    },
    include: {
      user: true,
    },
  });
  return provider;
};

const getSalesInvoiceById = async (sales_invoice_id, tx = prisma) => {
  const salesInvoice = await tx.salesInvoice.findFirst({
    where: {
      id: sales_invoice_id,
      invoice_type: "Sales_Return",
    },
    include: {
      SalesPart: true,
      SalesService: true,
      SalesInvoiceTransactions: true,
      SalesInvoiceParty: true,
    },
  });
  return salesInvoice;
};

const updateProviderCustomerFinalBalance = async (
  provider_customer_id,
  balance_difference,
  tx = prisma
) => {
  const providerCustomer = await tx.providerCustomers.update({
    where: {
      id: provider_customer_id,
    },
    data: {
      customer_final_balance: {
        increment: balance_difference, // Increment for sales return deletion (reversing the decrement)
      },
    },
  });
  return providerCustomer;
};

const restoreFranchiseInventory = async (
  franchise_inventory_id,
  quantity,
  tx = prisma
) => {
  const franchiseInventory = await tx.franchiseInventory.update({
    where: {
      id: franchise_inventory_id,
    },
    data: {
      product_quantity: {
        decrement: quantity, // Decrement for sales return deletion (reversing the increment)
      },
    },
  });
  return franchiseInventory;
};

const clearSalesInvoice = async (sales_invoice_id, tx = prisma) => {
  // Delete all related records sequentially
  await tx.salesInvoiceParty.deleteMany({
    where: { sales_invoice_id: sales_invoice_id },
  });

  await tx.salesPart.deleteMany({
    where: { sales_invoice_id: sales_invoice_id },
  });

  await tx.salesService.deleteMany({
    where: { sales_invoice_id: sales_invoice_id },
  });

  await tx.salesInvoiceTransactions.deleteMany({
    where: { sales_invoice_id: sales_invoice_id },
  });

  await tx.salesAdditionalCharges.deleteMany({
    where: { sales_invoice_id: sales_invoice_id },
  });

  return true;
};

const deleteSalesInvoice = async (sales_invoice_id, tx = prisma) => {
  const deletedSalesInvoice = await tx.salesInvoice.delete({
    where: {
      id: sales_invoice_id,
    },
  });
  return deletedSalesInvoice;
};

const revertProviderSalesInvoiceNumber = async (provider_id, tx = prisma) => {
  const provider = await tx.provider.update({
    where: { id: provider_id },
    data: { sales_invoice_number: { decrement: 1 } },
  });
  return provider;
};

export {
  getProviderByUserId,
  getSalesInvoiceById,
  updateProviderCustomerFinalBalance,
  restoreFranchiseInventory,
  clearSalesInvoice,
  deleteSalesInvoice,
  revertProviderSalesInvoiceNumber,
};
