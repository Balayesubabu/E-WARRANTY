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
  prisma,
} from "../../../../prisma/db-models.js";
const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: {
      user_id: user_id,
    },
    include: {
      user: true,
    },
  });
  return provider;
};

const getFranchiseInventoryById = async (franchise_inventory_id) => {
  const franchiseInventory = await FranchiseInventory.findFirst({
    where: {
      id: franchise_inventory_id,
    },
  });
  return franchiseInventory;
};

const checkInvoiceNumber = async (provider_id, invoice_number) => {
  const invoice_num = await SalesInvoice.findFirst({
    where: {
      provider_id: provider_id,
      invoice_number: invoice_number,
      invoice_type: "Delivery_Challan",
    },
  })
  return invoice_num
}

const createSalesInvoice = async (provider_id,staff_id, data, tx) => {
  const salesInvoice = await tx.salesInvoice.create({
    data: {
      provider_id,
      provider_customer_id: data.provider_customer_id,
      franchise_id: data.franchise_id,
      invoice_number: data.invoice_number,
      prefix: data.prefix,
      sequence_number: data.sequence_number,
      // original_invoice_number: data.original_invoice_number,
      invoice_type: data.invoice_type,
      invoice_status: data.invoice_status,
      invoice_date: data.invoice_date,
      is_invoice_fully_paid: data.is_invoice_fully_paid,
      invoice_additional_discount_percentage:
        data.invoice_additional_discount_percentage,
      invoice_additional_discount_amount:
        data.invoice_additional_discount_amount,
      invoice_tds_percentage: data.invoice_tds_percentage,
      invoice_tcs_percentage: data.invoice_tcs_percentage,
      invoice_shipping_charges: data.invoice_shipping_charges,
      is_auto_round_off: data.is_auto_round_off,
      auto_round_off_amount: data.auto_round_off_amount,
      invoice_advance_amount: data.invoice_advance_amount,
      advance_payment_type: data.advance_payment_type,
      advance_amount_online_transaction_id:
        data.advance_amount_online_transaction_id,
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
      invoice_total_parts_services_amount:
        data.invoice_total_parts_services_amount,
      invoice_total_parts_services_tax_amount:
        data.invoice_total_parts_services_tax_amount,
         invoice_additional_discount_percentage : data.invoice_additional_discount_percentage,
      invoice_additional_discount_amount : data.invoice_additional_discount_amount,
       is_auto_round_off : data.is_auto_round_off,
      auto_round_off_amount : data.auto_round_off_amount,
      invoice_discount_amount : data.invoice_discount_amount,
      bank_id : data.bank_id,
        created_by:staff_id || provider_id
    },
  });
  return salesInvoice;
};

const updateProviderCustomerFinalBalance = async (
  provider_customer_id,
  customer_final_balance,
  tx
) => {
  const providerCustomer = await tx.providerCustomers.update({
    where: {
      id: provider_customer_id,
    },
    data: {
      customer_final_balance: customer_final_balance,
    },
  });
  return providerCustomer;
};

const createSalesInvoiceParty = async (sales_invoice_id, data, tx) => {
  const salesInvoiceParty = await tx.salesInvoiceParty.create({
    data: {
      sales_invoice_id,
      type: data.type,
      party_name: data.party_name,
      party_country_code: data.party_country_code,
      party_phone: data.party_phone,
      party_email: data.party_email,
      party_address: data.party_address,
      party_city: data.party_city,
      party_state: data.party_state,
      party_pincode: data.party_pincode,
      party_gstin_number: data.party_gstin_number,
      party_vehicle_number: data.party_vehicle_number,
    },
  });
  return salesInvoiceParty;
};

const createSalesParts = async (sales_invoice_id, data, tx) => {
  const salesParts = await tx.salesPart.create({
    data: {
      sales_invoice_id,
      franchise_inventory_id: data.franchise_inventory_id,
      part_name: data.part_name,
      part_hsn_code: data.part_hsn_code,
      part_description: data.part_description,
      part_selling_price: data.part_selling_price,
      part_quantity: data.part_quantity,
      part_discount_percentage: data.part_discount_percentage,
      part_discount_amount: data.part_discount_amount,
      part_mesuring_unit: data.part_mesuring_unit,
      part_gst_percentage: data.part_gst_percentage,
      part_gst_amount: data.part_gst_amount,
      part_total_price: data.part_total_price,
    },
  });
  return salesParts;
};

const updateFranchiseInventory = async (
  franchise_inventory_id,
  quantity,
  tx
) => {
  const franchiseInventory = await tx.franchiseInventory.update({
    where: {
      id: franchise_inventory_id,
    },
    data: {
      product_quantity: {
        decrement: quantity,
      },
    },
  });
  return franchiseInventory;
};

const createSalesServices = async (sales_invoice_id, data, tx) => {
  const salesServices = await tx.salesService.create({
    data: {
      sales_invoice_id,
      franchise_service_id: data.franchise_service_id,
      service_name: data.service_name,
      service_sac_number: data.service_sac_number,
      service_description: data.service_description,
      service_discount_percentage: data.service_discount_percentage,
      service_discount_amount: data.service_discount_amount,
      service_price: data.service_price,
      service_gst_percentage: data.service_gst_percentage,
      service_gst_amount: data.service_gst_amount,
      service_total_price: data.service_total_price,
    },
  });
  return salesServices;
};

const createSalesInvoiceTransactions = async (sales_invoice_id, data, tx) => {
  const salesInvoiceTransactions = await tx.salesInvoiceTransactions.create({
    data: {
      sales_invoice_id,
      invoice_type: data.invoice_type,
      amount: data.amount,
      total_amount: data.total_amount,
      pending_amount: data.pending_amount,
      paid_amount: data.paid_amount,
      transaction_type: data.transaction_type,
      transaction_status: data.transaction_status,
      transaction_id: data.transaction_id,
    },
  });
  return salesInvoiceTransactions;
};

const createTransactions = async (created_delivery_challan_id, data, tx) => {
  const transactions = await tx.transaction.create({
    data: {
      sales_invoice_id: created_delivery_challan_id,
      provider_id: data.provider_id,
      provider_customer_id: data.provider_customer_id,
      invoice_type: data.invoice_type,
      amount: data.amount,
      money_in : data.money_in,
      money_out : data.money_out,
      transaction_type: data.transaction_type,
      transaction_status: data.transaction_status,
      transaction_id: data.transaction_id,
    },
  });
  return transactions;
};


const createSalesAdditionalCharges = async (sales_invoice_id, data, tx) => {
  const salesAdditionalCharges = await tx.salesAdditionalCharges.create({
    data: {
      sales_invoice_id,
      name: data.name,
      amount: data.amount,
      gst_percentage: data.gst_percentage,
      gst_amount: data.gst_amount,
      total_amount: data.total_amount,
    },
  });
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

  return salesInvoice;
};

const updateUrl = async (sales_invoice_id, url) => {
  const updatedInvoice = await SalesInvoice.update({
    where: {
      id: sales_invoice_id,
    },
    data: {
      invoice_pdf_url: url,
    },
  });
  return updatedInvoice;
};

export {
  getProviderByUserId,
  getFranchiseInventoryById,
  createSalesInvoice,
  updateProviderCustomerFinalBalance,
  createSalesInvoiceParty,
  createSalesParts,
  updateFranchiseInventory,
  createSalesServices,
  createSalesInvoiceTransactions,
  createTransactions,
  createSalesAdditionalCharges,
  checkInvoiceNumber,
  getAllDataSalesInvoiceById,
  updateUrl
};
