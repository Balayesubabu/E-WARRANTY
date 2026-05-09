import {
    Provider,
    ProviderCustomers,
    SalesInvoice,
    SalesPart,
    SalesService,
    SalesInvoiceTransactions,
    Transaction,
    FranchiseInventory,
    SalesInvoiceParty,
    SalesAdditionalCharges,
    prisma
} from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        },
        include: {
            user: true
        }
    })
    return provider;
}

const getSalesInvoiceById = async (sales_invoice_id) => {
    const salesInvoice = await SalesInvoice.findFirst({
        where: {
            id: sales_invoice_id,
            is_invoice_fully_paid: false,
        },
        include: {
            SalesInvoiceTransactions: true,
            SalesPart: true,
            SalesService: true,
            SalesInvoiceParty: true,
            SalesAdditionalCharges: true,
            Transaction: true
        }
    })
    return salesInvoice;
}

const clearSalesInvoice = async (sales_invoice_id) => {
    await prisma.$transaction([
        prisma.salesInvoiceParty.deleteMany({ where: { sales_invoice_id: sales_invoice_id } }),
        prisma.salesPart.deleteMany({ where: { sales_invoice_id: sales_invoice_id } }),
        prisma.salesService.deleteMany({ where: { sales_invoice_id: sales_invoice_id } }),
        prisma.salesAdditionalCharges.deleteMany({ where: { sales_invoice_id: sales_invoice_id } })
    ])
}

const getProviderCustomerById = async (provider_customer_id) => {
    const providerCustomer = await ProviderCustomers.findFirst({
        where: {
            id: provider_customer_id
        }
    })
    return providerCustomer;
}

const getFranchiseInventoryById = async (franchise_inventory_id) => {
    const franchiseInventory = await FranchiseInventory.findFirst({
        where: {
            id: franchise_inventory_id,
            // product_is_active: true,
            // product_is_deleted: false
        }
    })
    return franchiseInventory;
}

const updateSalesInvoice = async (provider_id, staff_id,sales_invoice_id, data) => {
    const updatedSalesInvoice = await SalesInvoice.update({
        where: {
            id: sales_invoice_id
        },
        data: {
            provider_customer_id: data.provider_customer_id,
            franchise_id: data.franchise_id,
            // original_invoice_number: data.original_invoice_number,
            invoice_number : data.invoice_number,
            prefix: data.prefix,
            sequence_number: data.sequence_number,
            invoice_type: data.invoice_type,
            invoice_status: data.invoice_status,
            invoice_date: data.invoice_date,
            is_invoice_fully_paid: data.is_invoice_fully_paid,
            invoice_additional_discount_percentage: data.invoice_additional_discount_percentage,
            invoice_additional_discount_amount: data.invoice_additional_discount_amount,
            invoice_tds_percentage: data.invoice_tds_percentage,
            invoice_tcs_percentage: data.invoice_tcs_percentage,
            invoice_shipping_charges: data.invoice_shipping_charges,
            is_auto_round_off: data.is_auto_round_off,
            auto_round_off_amount: data.auto_round_off_amount,
            invoice_advance_amount: data.invoice_advance_amount,
            advance_payment_type: data.advance_payment_type,
            advance_amount_online_transaction_id: data.advance_amount_online_transaction_id,
            advance_payment_date: data.advance_payment_date,
            invoice_payment_status: data.invoice_payment_status,
            terms_and_conditions: data.terms_and_conditions,
            additional_notes: data.additional_notes,
            due_date_terms: data.due_date_terms,
            due_date: data.due_date,
            invoice_total_amount: data.invoice_total_amount,
            invoice_discount_amount: data.invoice_discount_amount,
            invoice_gst_amount: data.invoice_gst_amount,
            invoice_tds_amount: data.invoice_tds_amount,
            invoice_tcs_amount: data.invoice_tcs_amount,
            invoice_pending_amount: data.invoice_pending_amount,
            invoice_paid_amount: data.invoice_paid_amount,
            invoice_total_tax_amount: data.invoice_total_tax_amount,
            invoice_total_parts_amount: data.invoice_total_parts_amount,
            invoice_total_parts_tax_amount: data.invoice_total_parts_tax_amount,
            invoice_total_services_amount: data.invoice_total_services_amount,
            invoice_total_services_tax_amount: data.invoice_total_services_tax_amount,
            invoice_total_parts_services_amount: data.invoice_total_parts_services_amount,
            invoice_total_parts_services_tax_amount: data.invoice_total_parts_services_tax_amount,
            apply_tcs : data.apply_tcs,
            apply_tds : data.apply_tds,
      is_total_amount: data.is_total_amount,
      is_taxable_amount: data.is_taxable_amount,
      bank_id: data.bank_id,
            updated_at: new Date(),
            updated_by: staff_id || provider_id,
        link_to : data.link_to
        }
    });
    return updatedSalesInvoice;
}

const createSalesParts = async (sales_invoice_id, data) => {
    const salesParts = await SalesPart.create({
        data: {
            ...data,
            sales_invoice_id: sales_invoice_id,
        }
    })
    return salesParts;
}

// const updateFranchiseInventory = async (franchise_inventory_id, product_quantity) => {
//     const updatedFranchiseInventory = await FranchiseInventory.update({
//         where: {
//             id: franchise_inventory_id,
//             product_is_active: true,
//             product_is_deleted: false
//         },
//         data: {
//             product_quantity: product_quantity
//         }
//     })
//     return updatedFranchiseInventory;
// }

// const restoreFranchiseInventory = async (franchise_inventory_id, quantity_to_restore) => {
//     const franchiseInventory = await FranchiseInventory.findFirst({
//         where: {
//             id: franchise_inventory_id,
//             product_is_active: true,
//             product_is_deleted: false
//         }
//     });

//     if (franchiseInventory) {
//         const updatedFranchiseInventory = await FranchiseInventory.update({
//             where: {
//                 id: franchise_inventory_id,
//                 product_is_active: true,
//                 product_is_deleted: false
//             },
//             data: {
//                 product_quantity: {
//                     increment: quantity_to_restore
//                 }
//             }
//         });
//         return updatedFranchiseInventory;
//     }
//     return null;
// }

const createSalesServices = async (sales_invoice_id, data) => {
    const salesServices = await SalesService.create({
        data: {
            ...data,
            sales_invoice_id: sales_invoice_id,
        }
    })
    return salesServices;
}

const createSalesInvoiceTransactions = async (sales_invoice_id, data) => {
    const salesInvoiceTransactions = await SalesInvoiceTransactions.create({
        data: {
            sales_invoice_id: sales_invoice_id,
            invoice_type: data.invoice_type,
            amount: data.amount,
            total_amount: data.total_amount,
            pending_amount: data.pending_amount,
            paid_amount: data.paid_amount,
            transaction_type: data.transaction_type,
            transaction_status: data.transaction_status,
            transaction_id: data.transaction_id
        }
    })
    return salesInvoiceTransactions;
}

const createTransactions = async (sales_invoice_id, transaction_id, data, tx) => {
    const transactions = await Transaction.update({
        where: {
            id: transaction_id
        },
        data: {
      provider_id: data.provider_id,
      provider_customer_id: data.provider_customer_id,
      sales_invoice_id: sales_invoice_id,
      invoice_type: data.invoice_type,
      amount: data.amount,
      money_in: data.money_in,
      money_out: data.money_out,
      transaction_type: data.advance_payment_type,
      transaction_id: data.advance_amount_online_transaction_id,
    },
    })
    return transactions;
}

const updateProviderCustomerFinalBalance = async (provider_customer_id, customer_final_balance) => {
    const providerCustomerFinalBalance = await ProviderCustomers.update({
        where: {
            id: provider_customer_id
        },
        data: {
            customer_final_balance: customer_final_balance
        }
    })
    return providerCustomerFinalBalance;
}

const createSalesInvoiceParty = async (sales_invoice_id, data) => {
    const salesInvoiceParty = await SalesInvoiceParty.create({
        data: {
            ...data,
            sales_invoice_id: sales_invoice_id
        }
    });
    return salesInvoiceParty;
}

const getSalesInvoiceTransactions = async (sales_invoice_id) => {
    const transactions = await SalesInvoiceTransactions.findMany({
        where: {
            sales_invoice_id: sales_invoice_id
        }
    });
    return transactions;
}

const createSalesAdditionalCharges = async (sales_invoice_id, data) => {
    const salesAdditionalCharges = await SalesAdditionalCharges.create({
        data: {
            sales_invoice_id: sales_invoice_id,
            name: data.name,
            amount: data.amount,
            gst_percentage: data.gst_percentage,
            gst_amount: data.gst_amount,
            total_amount: data.total_amount
        }
    })
    return salesAdditionalCharges;
};

const getAllDataSalesInvoiceById = async (sales_invoice_id) => {
  const salesInvoice = await SalesInvoice.findFirst({
    where: {
      id: sales_invoice_id,
    },
    include: {
      provider: true,
      provider:{
        include:{user:true}
      },
            
      provider_customer: true,
      franchise: true,
      SalesPart: true,
      SalesService: true,
      SalesInvoiceTransactions: true,
      SalesPackage: true,
      SalesInvoiceParty: true,
      Transaction: true,
      SalesAdditionalCharges: true,      
      // ProviderBankDetails: true,
      ProviderBank: true,
    },
  });
  if(salesInvoice.link_to){
    const linkedInvoice =  await SalesInvoice.findFirst({
      where: {
        id: salesInvoice.link_to,
      },
    });
    salesInvoice.linked_from_paid_amount = linkedInvoice.invoice_paid_amount;
     salesInvoice.linked_from_invoice_paid_amount = linkedInvoice.invoice_paid_amount;
  salesInvoice.linked_from_invoice_pending_amount = linkedInvoice.invoice_pending_amount;
  salesInvoice.linked_invoice_paid_amount = salesInvoiceReturn.invoice_paid_amount;
  salesInvoice.linked_invoice_pending_amount = salesInvoiceReturn.invoice_pending_amount;
  }

  return salesInvoice;
};

const getAllDataSalesInvoiceById1 = async (sales_invoice_id,salesId) => {
  const salesInvoice = await SalesInvoice.findFirst({
    where: {
      id: sales_invoice_id,
    },
    include: {
      provider: true,
      provider:{
        include:{user:true}
      },
            
      provider_customer: true,
      franchise: true,
      SalesPart: true,
      SalesService: true,
      SalesInvoiceTransactions: true,
      SalesPackage: true,
      SalesInvoiceParty: true,
      Transaction: true,
      SalesAdditionalCharges: true,      
      // ProviderBankDetails: true,
      ProviderBank: true,
    },
  });
  const salesInvoiceReturn = await SalesInvoice.findFirst({
    where: {
      id: salesId,
    },
  });
  salesInvoice.linked_invoice_number = salesInvoiceReturn.invoice_number;
  salesInvoice.linked_invoice_type = salesInvoiceReturn.invoice_type;
  salesInvoice.linked_invoice_total_amount = salesInvoiceReturn.invoice_total_amount;
  salesInvoice.linked_invoice_paid_amount = salesInvoiceReturn.invoice_paid_amount;
  salesInvoice.linked_invoice_pending_amount = salesInvoiceReturn.invoice_pending_amount;
  return salesInvoice;
};

const updateUrl = async (sales_invoice_id, url, updated_payment_status) => {
  const updatedInvoice = await SalesInvoice.update({
    where: {
      id: sales_invoice_id,
    },
    data: {
      invoice_pdf_url: url,
        invoice_payment_status: updated_payment_status,
    },
  });
  return updatedInvoice;
};

export {
    getProviderByUserId,
    getSalesInvoiceById,
    clearSalesInvoice,
    getProviderCustomerById,
    getFranchiseInventoryById,
    updateSalesInvoice,
    createSalesParts,
    createSalesServices,
    // updateFranchiseInventory,
    // restoreFranchiseInventory,
    createSalesInvoiceTransactions,
    createTransactions,
    updateProviderCustomerFinalBalance,
    createSalesInvoiceParty,
    getSalesInvoiceTransactions,
    createSalesAdditionalCharges,
    getAllDataSalesInvoiceById,
    getAllDataSalesInvoiceById1,
    updateUrl
}