import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const getProviderByUserId = async (user_id, tx = prisma) => {
  try {
    const provider = await tx.provider.findFirst({
      where: {
        user_id: user_id,
      },
      include: {
        user: true,
      },
    });
    return provider;
  } catch (error) {
    console.error("Error in getProviderByUserId:", error);
    throw error;
  }
};

const getSalesInvoiceById = async (sales_invoice_id, tx = prisma) => {
  try {
    const salesInvoice = await tx.salesInvoice.findFirst({
      where: {
        id: sales_invoice_id,
      },
      include: {
        SalesPart: true,
        SalesService: true,
        SalesInvoiceTransactions: true,
        SalesInvoiceParty: true,
      },
    });
    return salesInvoice;
  } catch (error) {
    console.error("Error in getSalesInvoiceById:", error);
    throw error;
  }
};

const updateProviderCustomerFinalBalance = async (
  provider_customer_id,
  balance_difference,
  tx = prisma
) => {
  try {
    const providerCustomer = await tx.providerCustomers.update({
      where: {
        id: provider_customer_id,
      },
      data: {
        customer_final_balance: {
          increment: balance_difference,
        },
      },
    });
    return providerCustomer;
  } catch (error) {
    console.error("Error in updateProviderCustomerFinalBalance:", error);
    throw error;
  }
};

const restoreFranchiseInventory = async (
  franchise_inventory_id,
  quantity,
  tx = prisma
) => {
  try {
    const franchiseInventory = await tx.franchiseInventory.update({
      where: {
        id: franchise_inventory_id,
      },
      data: {
        product_quantity: {
          increment: quantity,
        },
      },
    });
    return franchiseInventory;
  } catch (error) {
    console.error("Error in restoreFranchiseInventory:", error);
    throw error;
  }
};

const clearSalesInvoice = async (sales_invoice_id, tx = prisma) => {
  try {
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

    await tx.salesAdditionalCharges.deleteMany({
      where: { sales_invoice_id },
    });

    await tx.salesInvoiceTransactions.deleteMany({
      where: { sales_invoice_id: sales_invoice_id },
    });

    return true;
  } catch (error) {
    console.error("Error in clearSalesInvoice:", error);
    throw error;
  }
};

const deleteSalesInvoice = async (sales_invoice_id, tx = prisma) => {
  try {
    const deletedSalesInvoice = await tx.salesInvoice.delete({
      where: {
        id: sales_invoice_id,
      },
    });
    return deletedSalesInvoice;
  } catch (error) {
    console.error("Error in deleteSalesInvoice:", error);
    throw error;
  }
};

const revertProviderSalesInvoiceNumber = async (provider_id, tx = prisma) => {
  try {
    const provider = await tx.provider.update({
      where: { id: provider_id },
      data: { sales_invoice_number: { decrement: 1 } },
    });
    return provider;
  } catch (error) {
    console.error("Error in revertProviderSalesInvoiceNumber:", error);
    throw error;
  }
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
