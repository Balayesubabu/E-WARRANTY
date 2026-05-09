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

const getFranchiseInventoryById = async (franchise_inventory_id) => {
  const franchiseInventory = await FranchiseInventory.findFirst({
    where: {
      id: franchise_inventory_id,
      product_is_deleted: false,
    },
    include: {
      franchise: true,
      //category: true,
    },
  });
  return franchiseInventory;
};

// const checkInvoiceNumberExists = async (provider_id, franchise_id, invoice_number, invoice_type, tx) => {

//   console.log("invoice_number", invoice_number);
  
//   const existingInvoice = await tx.purchaseInvoice.findFirst({
//         where: {
//           provider_id: provider_id,
//           franchise_id: franchise_id,
//           invoice_number: invoice_number,
//           invoice_type: invoice_type,
//         },
//       });
//       console.log("existingInvoice", existingInvoice);

//      if(existingInvoice){
//         return true;
//      }
//      else{
//         return false;
//      }
     
// }


const createPurchaseInvoice = async (provider_id, franchise_id, staff_id, data, tx) => {
  const purchaseInvoice = await tx.purchaseInvoice.create({
    data: {
      provider_id: provider_id,
      provider_customer_id: data.provider_customer_id,
      franchise_id: franchise_id,
      staff_id: staff_id,
      invoice_number: data.invoice_number,
      // original_invoice_number: data.original_invoice_number,
      invoice_type: data.invoice_type,
      invoice_status: data.invoice_status,
      invoice_date: data.invoice_date,
      invoice_total_amount: data.invoice_total_amount,
      is_invoice_fully_paid: false,
      invoice_discount_amount: 0,
      invoice_additional_discount_percentage: 0,
      invoice_additional_discount_amount: 0,
      invoice_gst_amount: data.invoice_gst_amount,
      invoice_tds_percentage: 0,
      invoice_tds_amount: 0,
      invoice_tcs_percentage: 0,
      invoice_tcs_amount: 0,
      invoice_shipping_charges: 0,
      is_auto_round_off: false,
      auto_round_off_amount: 0,
      invoice_pending_amount: data.invoice_total_amount,
      invoice_paid_amount: 0,
      invoice_total_tax_amount: data.invoice_total_tax_amount,
      invoice_total_parts_amount: data.invoice_total_parts_amount,
      invoice_total_parts_tax_amount: data.invoice_total_parts_tax_amount,
      invoice_total_services_amount: data.invoice_total_services_amount,
      invoice_total_services_tax_amount: data.invoice_total_services_tax_amount,
      invoice_total_parts_services_amount:
        data.invoice_total_parts_services_amount,
      invoice_total_parts_services_tax_amount:
        data.invoice_total_parts_services_tax_amount,
      advance_payment_type: null,
      invoice_advance_amount: 0,
      advance_amount_online_transaction_id: null,
      advance_payment_date: null,
      invoice_payment_status: "Pending",
      terms_and_conditions: data.terms_and_conditions,
      additional_notes: data.additional_notes,
      invoice_pdf_url: null,
      due_date_terms: data.due_date_terms,
      due_date: data.due_date,
      is_deleted: false,
      deleted_at: null,
      deleted_by_id: null,
      created_by : staff_id ? staff_id : provider_id,
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
      part_discount_percentage: 0,
      part_discount_amount: 0,
      part_mesuring_unit: data.part_mesuring_unit,
      part_gst_percentage: data.part_gst_percentage,
      part_gst_amount: data.part_gst_amount,
      part_total_price: data.part_total_price,
      part_purchase_price: data.part_purchase_price,
      part_discount_amount: data.part_discount_amount,
      part_discount_percentage: data.part_discount_percentage,
    },
  });
  return purchasePart;
};

const updateFranchiseInventory = async (
  franchise_inventory_id,
  quantity,
  tx
) => {
  const franchiseInventory = await tx.franchiseInventory.update({
    where: { id: franchise_inventory_id },
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
      service_discount_percentage: 0,
      service_discount_amount: 0,
      service_price: data.service_price,
      service_gst_percentage: data.service_gst_percentage,
      service_gst_amount: data.service_gst_amount,
      service_total_price: data.service_total_price,
      service_discount_amount: data.service_discount_amount,
      service_discount_percentage: data.service_discount_percentage,
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

const createTransactions = async (data, tx) => {
  const transaction = await tx.transaction.create({
    data: {
      provider_id: data.provider_id,
      purchase_invoice_id: data.purchase_invoice_id,
      transaction_type: data.transaction_type,
      transaction_amount: data.transaction_amount,
      transaction_status: data.transaction_status,
      transaction_id: data.transaction_id,
      transaction_date: data.transaction_date,
      transaction_description: data.transaction_description,
    },
  });
  return transaction;
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
  getAllDataPurchaseInvoiceById,
  updateUrl
};
