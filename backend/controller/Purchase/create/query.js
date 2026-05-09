
import {
  Provider,
  ProviderCustomers,
  FranchiseInventory,
  Franchise,
  PurchasePackage,
  PurchaseInvoice,
} from "../../../prisma/db-models.js";


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

const getProviderCustomerById = async (
  provider_customer_id,
  provider_id,
  franchise_id
) => {
  const providerCustomer = await ProviderCustomers.findFirst({
    where: {
      id: provider_customer_id,
      provider_id: provider_id,
    //   franchise_id: franchise_id,
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
    console.log("franchise_inventory_id", franchise_inventory_id);
    
  const franchiseInventory = await FranchiseInventory.findFirst({
    where: {
      id: franchise_inventory_id,
    //   product_is_deleted: false,
    },
    include: {
      franchise: true,
      //category: true,
    },
  });
  return franchiseInventory;
};

const createPurchaseInvoice = async (provider_id, franchise_id, staff_id, data, tx) => { 

  const purchaseInvoice = await tx.purchaseInvoice.create({
    data: {
      provider_id: provider_id,
      franchise_id: franchise_id,
      provider_customer_id: data.provider_customer_id,
      invoice_number: data.invoice_number,
      prefix: data.prefix,
      sequence_number: data.sequence_number,
      invoice_type: data.invoice_type,
      invoice_status: data.invoice_status,
          invoice_payment_status : data.invoice_payment_status,
      invoice_date: new Date(data.invoice_date),
      is_invoice_fully_paid: data.is_invoice_fully_paid || false,
      invoice_additional_discount_percentage:
        data.invoice_additional_discount_percentage || 0,
      invoice_additional_discount_amount:
        data.invoice_additional_discount_amount || 0,
      invoice_tds_percentage: data.invoice_tds_percentage || 0,
      invoice_tcs_percentage: data.invoice_tcs_percentage || 0,
      invoice_shipping_charges: data.invoice_shipping_charges || 0,
      is_auto_round_off: data.is_auto_round_off || false,
      auto_round_off_amount: data.auto_round_off_amount || 0,
      invoice_advance_amount: data.invoice_advance_amount || 0,
      advance_payment_type: data.advance_payment_type || null,
      advance_amount_online_transaction_id:
        data.advance_amount_online_transaction_id || null,
      advance_payment_date: data.advance_payment_date
        ? new Date(data.advance_payment_date)
        : null,
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
      apply_tcs: data.apply_tcs,
      apply_tds: data.apply_tds,
      is_taxable_amount: data.is_taxable_amount,
      is_total_amount: data.is_total_amount,
      invoice_pending_amount: data.invoice_pending_amount || 0,
      invoice_paid_amount: data.invoice_paid_amount || 0,
      invoice_total_tax_amount: data.invoice_total_tax_amount || 0,
      invoice_total_parts_amount: data.invoice_total_parts_amount || 0,
      invoice_total_parts_tax_amount: data.invoice_total_parts_tax_amount || 0,
      invoice_total_services_amount: data.invoice_total_services_amount || 0,
      invoice_total_services_tax_amount:
        data.invoice_total_services_tax_amount || 0,
      invoice_total_parts_services_amount:
        data.invoice_total_parts_services_amount || 0,
      invoice_total_parts_services_tax_amount:
        data.invoice_total_parts_services_tax_amount || 0,
        invoice_total_payable_after_tds : data.total_after_tds,
      bank_id: data.bank_id || null,
      created_by: staff_id ? staff_id : provider_id,
      link_to: data.link_to
    },
  });
  return purchaseInvoice;
};

const updateProviderCustomerFinalBalance = async (
  provider_customer_id,
  balance_difference,
  tx
) => {
  const providerCustomer = await tx.providerCustomers.update({
    where: { id: provider_customer_id },
    data: { customer_final_balance: { decrement: balance_difference } },
  });
  return providerCustomer;
};

const createPurchaseParts = async (purchase_invoice_id, data, tx) => {
  const purchasePart = await tx.purchasePart.create({
    data: {
      purchase_invoice_id: purchase_invoice_id,
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
  return purchasePart;
};

const updateFranchiseInventory = async (
  franchise_inventory_id,provider_id,franchise_id,
  quantity,
  tx
) => {
  const franchiseInventory = await tx.franchiseInventory.update({
    where: { id: franchise_inventory_id, provider_id: provider_id, franchise_id: franchise_id },
    data: { product_quantity: { increment: quantity } },
  });
  return franchiseInventory;
};

const createPurchaseServices = async (purchase_invoice_id, data, tx) => {
  const purchaseService = await tx.purchaseService.create({
    data: {
      purchase_invoice_id: purchase_invoice_id,
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
  return purchaseService;
};

const createPurchaseInvoiceTransactions = async (
  purchase_invoice_id,
  data,
  tx
) => {
  const purchaseInvoiceTransaction =
    await tx.purchaseInvoiceTransactions.create({
      data: {
        purchase_invoice_id: purchase_invoice_id,
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
  return purchaseInvoiceTransaction;
};

const createTransactions = async (purchase_invoice_id, data, tx) => {
  const transactions = await tx.transaction.create({
    data: {
      purchase_invoice_id,
      provider_id: data.provider_id,
      provider_customer_id: data.provider_customer_id,
      invoice_type: data.invoice_type,
      amount: data.amount,
      money_out: data.money_out,
      transaction_type: data.transaction_type,
      transaction_status: data.transaction_status,
      transaction_id: data.transaction_id,
    },
  });
  return transactions;
};

const createPurchaseInvoiceParty = async (purchase_invoice_id, data, tx) => {
  console.log("data is", data);

  const purchaseInvoiceParty = await tx.purchaseInvoiceParty.create({
    data: {
      purchase_invoice_id: purchase_invoice_id,
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

const createFranchiseInventoryTransaction = (provider_id, purchase_invoice_id, data, tx) => {
  const inventoryTransaction = tx.franchiseInventoryTransaction.create({
    data: {
      purchase_invoice_id: purchase_invoice_id,
      provider_id: provider_id,
      franchise_id: data.franchise_id,
      franchise_inventory_id: data.franchise_inventory_id,
      action: data.action,      
      quantity: data.quantity,
      stock_changed_by: data.stock_changed_by,
      closing_stock: data.closing_stock,
    },
  });
  return inventoryTransaction;
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
  if(purchaseInvoice.link_to){
    const linkedInvoice =  await PurchaseInvoice.findFirst({
      where: {
        id: purchaseInvoice.link_to,
      },
    });
    purchaseInvoice.linked_from_paid_amount = linkedInvoice.invoice_paid_amount;
     purchaseInvoice.linked_from_invoice_paid_amount = linkedInvoice.invoice_paid_amount;
  purchaseInvoice.linked_from_invoice_pending_amount = linkedInvoice.invoice_pending_amount;
  }
  return purchaseInvoice;
};

const getAllDataPurchaseInvoiceById1 = async (purchase_invoice_id, purchaseId) => {
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
  const linkedPurchaseInvoice = await PurchaseInvoice.findFirst({
    where: {
      id: purchaseId
    },
  });
  purchaseInvoice.linked_invoice_number = linkedPurchaseInvoice.invoice_number;
  purchaseInvoice.linked_invoice_total_amount = linkedPurchaseInvoice.invoice_total_amount;
  purchaseInvoice.linked_invoice_type = linkedPurchaseInvoice.invoice_type;
  purchaseInvoice.linked_invoice_paid_amount = linkedPurchaseInvoice.invoice_paid_amount;
  purchaseInvoice.linked_invoice_pending_amount = linkedPurchaseInvoice.invoice_pending_amount;
  return purchaseInvoice;
};

const updateUrl = async (purchase_invoice_id, url) => {
  const updatedInvoice = await PurchaseInvoice.update({
    where: {
      id: purchase_invoice_id,
    },
    data: {
      invoice_pdf_url: url
    },
  });
  return updatedInvoice;
};


const updateUrlWithStatus = async (purchase_invoice_id, url,updated_payment_status) => {
  const updatedInvoice = await PurchaseInvoice.update({
    where: {
      id: purchase_invoice_id,
    },
    data: {
      invoice_pdf_url: url,
      invoice_payment_status: updated_payment_status
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
  createPurchaseParts,
  updateFranchiseInventory,
  createPurchaseServices,
  createPurchaseInvoiceTransactions,
  createTransactions,
  createPurchaseInvoiceParty,
  createPurchaseAdditionalCharges,
  // checkInvoiceNumberExists
  createFranchiseInventoryTransaction,
  getAllDataPurchaseInvoiceById,
  getAllDataPurchaseInvoiceById1,
  updateUrl,
  updateUrlWithStatus
};
