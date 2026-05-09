import {
  Provider,
  ProviderCustomers,
  PurchaseInvoice,
  PurchasePart,
  PurchaseService,
  PurchaseInvoiceTransactions,
  Transaction,
  FranchiseInventory,
  PurchaseInvoiceParty,
  Franchise,
  PurchaseAdditionalCharges,
} from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: {
      user_id: user_id,
      is_deleted: false,
    },
    include: {
      user: true,
    },
  });
  return provider;
};

const getProviderCustomerById = async (provider_customer_id, provider_id) => {
  const providerCustomer = await ProviderCustomers.findFirst({
    where: {
      id: provider_customer_id,
      provider_id: provider_id,
    },
  });
  console.log("providerCustomer", providerCustomer);
  return providerCustomer;
};

const getFranchiseById = async (franchise_id, provider_id) => {
  const franchise = await Franchise.findFirst({
    where: {
      id: franchise_id,
      provider_id: provider_id,
    },
  });
  return franchise;
};

const getFranchiseInventoryById = async (franchise_inventory_id) => {
  const franchiseInventory = await FranchiseInventory.findFirst({
    where: {
      id: franchise_inventory_id,
    },
  });
  return franchiseInventory;
};

const createPurchaseInvoice = async (provider_id, franchise_id, staff_id, data, tx) => {
  console.log("provider_id", provider_id);
  console.log("franchise_id", franchise_id);
  console.log("provider customer id", data.provider_customer_id);

  const purchaseInvoice = await tx.purchaseInvoice.create({
    data: {
      provider_id: provider_id,
      provider_customer_id: data.provider_customer_id,
      franchise_id: franchise_id,
      invoice_number: data.invoice_number,
      invoice_type: data.invoice_type,
      invoice_status: data.invoice_status,
      invoice_date: new Date(data.invoice_date),
      is_invoice_fully_paid: data.is_invoice_fully_paid,
      invoice_additional_discount_percentage: data.invoice_additional_discount_percentage || 0,
      invoice_additional_discount_amount: data.invoice_additional_discount_amount || 0,
      invoice_tds_percentage: data.invoice_tds_percentage || 0,
      invoice_tcs_percentage: data.invoice_tcs_percentage || 0,
      invoice_shipping_charges: data.invoice_shipping_charges || 0,
      is_auto_round_off: data.is_auto_round_off || false,
      auto_round_off_amount: data.auto_round_off_amount || 0,
      invoice_advance_amount: data.invoice_advance_amount || 0,
      advance_payment_type: data.advance_payment_type || null,
      advance_amount_online_transaction_id: data.advance_amount_online_transaction_id || null,
      advance_payment_date: data.advance_payment_date ? new Date(data.advance_payment_date) : null,
      invoice_payment_status: data.invoice_payment_status || "Unpaid",
      terms_and_conditions: data.terms_and_conditions || [],
      additional_notes: data.additional_notes || [],
      due_date_terms: data.due_date_terms || null,
      due_date: data.due_date ? new Date(data.due_date) : null,
      invoice_total_amount: data.invoice_total_amount || 0,
      invoice_discount_amount: data.invoice_discount_amount || 0,
      invoice_gst_amount: data.invoice_gst_amount || 0,
      invoice_tds_amount: data.invoice_tds_amount || 0,
      invoice_tcs_amount: data.invoice_tcs_amount || 0,
      invoice_pending_amount: data.invoice_pending_amount || 0,
      invoice_paid_amount: data.invoice_paid_amount || 0,
      invoice_total_tax_amount: data.invoice_total_tax_amount || 0,
      invoice_total_parts_amount: data.invoice_total_parts_amount || 0,
      invoice_total_parts_tax_amount: data.invoice_total_parts_tax_amount || 0,
      invoice_total_services_amount: data.invoice_total_services_amount || 0,
      invoice_total_services_tax_amount: data.invoice_total_services_tax_amount || 0,
      invoice_total_parts_services_amount: data.invoice_total_parts_services_amount || 0,
      invoice_total_parts_services_tax_amount: data.invoice_total_parts_services_tax_amount || 0,
      created_by: staff_id ? staff_id : provider_id,
    },
  });
  return purchaseInvoice;
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
      customer_final_balance: {
        decrement: customer_final_balance,
      },
    },
  });
  return providerCustomer;
};

const createPurchaseInvoiceParty = async (purchase_invoice_id, data, tx) => {
  const purchaseInvoiceParty = await tx.purchaseInvoiceParty.create({
    data: {
      purchase_invoice_id,
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
  return purchaseInvoiceParty;
};

const createPurchaseParts = async (purchase_invoice_id, data, tx) => {
  const purchaseParts = await tx.purchasePart.create({
    data: {
      purchase_invoice_id,
      franchise_inventory_id: data.franchise_inventory_id,
      part_name: data.part_name,
      part_hsn_code: data.part_hsn_code,
      part_description: data.part_description,
      part_purchase_price: data.part_purchase_price,
      part_quantity: data.part_quantity,
      part_discount_percentage: data.part_discount_percentage,
      part_discount_amount: data.part_discount_amount,
      part_mesuring_unit: data.part_mesuring_unit,
      part_gst_percentage: data.part_gst_percentage,
      part_gst_amount: data.part_gst_amount,
      part_total_price: data.part_total_price,
    },
  });
  return purchaseParts;
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
        increment: quantity, // For purchase invoices, INCREASE inventory (we're buying items)
      },
    },
  });
  return franchiseInventory;
};

const createPurchaseServices = async (purchase_invoice_id, data, tx) => {
  const purchaseServices = await PurchaseService.create({
    data: {
      purchase_invoice_id,
      franchise_service_id: data.franchise_service_id,
      service_name: data.service_name,
      service_description: data.service_description,
      service_discount_percentage: data.service_discount_percentage,
      service_discount_amount: data.service_discount_amount,
      service_price: data.service_price,
      service_gst_percentage: data.service_gst_percentage,
      service_gst_amount: data.service_gst_amount,
      service_total_price: data.service_total_price,
    },
  });
  return purchaseServices;
};

const createPurchaseInvoiceTransactions = async (
  purchase_invoice_id,
  data,
  tx
) => {
  const purchaseInvoiceTransactions =
    await tx.purchaseInvoiceTransactions.create({
      data: {
        purchase_invoice_id,
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
  return purchaseInvoiceTransactions;
};

const createTransactions = async (purchase_invoice_id, data, tx) => {
  const transactions = await tx.transaction.create({
    data: {
      purchase_invoice_id,
      provider_id: data.provider_id,
      provider_customer_id: data.provider_customer_id,
      invoice_type: data.invoice_type,
      amount: data.amount,
      transaction_type: data.transaction_type,
      transaction_status: data.transaction_status,
      transaction_id: data.transaction_id,
    },
  });
  return transactions;
};

const createPurchaseAdditionalCharges = async (
  purchase_invoice_id,
  data,
  tx
) => {
  const purchaseAdditionalCharges = await tx.purchaseAdditionalCharges.create({
    data: {
      purchase_invoice_id,
      name: data.name,
      amount: data.amount,
      gst_percentage: data.gst_percentage,
      gst_amount: data.gst_amount,
      total_amount: data.total_amount,
    },
  });
  return purchaseAdditionalCharges;
};

const getAllDataPurchaseInvoiceById = async (purchase_invoice_id) => {
  const purchaseInvoice = await PurchaseInvoice.findFirst({
    where: {
      id: purchase_invoice_id
    },
    include: {
      provider: true,
      provider:{
        include:{user:true}
      },
      provider_customer: true,
      franchise: true,
      PurchasePart: true,
      PurchaseService: true,
      PurchaseInvoiceParty: true,
      PurchaseInvoiceTransactions: true,
      PurchasePackage: true,
      Transaction: true,
      PurchaseAdditionalCharges: true,
      ProviderBank: true,
    },
  });
  return purchaseInvoice;
};

const updateUrl = async (purchase_invoice_id, url) => {
  const updatedInvoice = await PurchaseInvoice.update({
    where: {
      id: purchase_invoice_id,
    },
    data: {
      invoice_pdf_url: url,
    },
  });
  return updatedInvoice;
};


export {
  getProviderByUserId,
  getProviderCustomerById,
  getFranchiseById,
  getFranchiseInventoryById,
  createPurchaseInvoice,
  updateProviderCustomerFinalBalance,
  createPurchaseInvoiceParty,
  createPurchaseParts,
  updateFranchiseInventory,
  createPurchaseServices,
  createPurchaseInvoiceTransactions,
  createTransactions,
  createPurchaseAdditionalCharges,
  getAllDataPurchaseInvoiceById,
  updateUrl
};
