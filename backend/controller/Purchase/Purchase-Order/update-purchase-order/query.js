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
    PurchaseAdditionalCharges
} from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id,
            is_deleted: false
        },
        include: {
            user: true
        }
    });
    return provider;
};

const getPurchaseInvoiceById = async (purchase_invoice_id) => {
    const purchaseInvoice = await PurchaseInvoice.findFirst({
        where: {
            id: purchase_invoice_id,
            is_deleted: false
        },
        include: {
            PurchasePart: {
                include: {
                    franchise_inventory: {
                        include: {
                            franchise: true,
                            //category: true
                        }
                    }
                }
            },
            PurchaseService: {
                include: {
                    franchise_service: {
                        include: {
                            franchise: true
                        }
                    }
                }
            },
            PurchaseInvoiceParty: true,
            PurchaseInvoiceTransactions: true,
            provider_customer: {
                include: {
                    CustomerCategory: true
                }
            },
            franchise: true,
            staff: true,
            PurchaseAdditionalCharges: true
        }
    });
    return purchaseInvoice;
};

const getFranchiseInventoryById = async (franchise_inventory_id) => {
    const franchiseInventory = await FranchiseInventory.findFirst({
        where: {
            id: franchise_inventory_id,
            product_is_deleted: false
        },
        include: {
            franchise: true,
            //category: true
        }
    });
    return franchiseInventory;
};

const updatePurchaseInvoice = async (purchase_invoice_id, staff_id, provider_id, franchise_id, data, tx) => {
    const purchaseInvoice = await tx.purchaseInvoice.update({
        where: {
             id: purchase_invoice_id,
             provider_id: provider_id,
             franchise_id: franchise_id,
             invoice_type: "Purchase_Order",
             ...(staff_id ? { staff_id: staff_id } : {}),

             },
        data: {
            provider_customer_id: data.provider_customer_id,
            franchise_id: franchise_id,
            invoice_number: data.invoice_number,
            invoice_date: data.invoice_date,
            terms_and_conditions: data.terms_and_conditions,
            additional_notes: data.additional_notes,
            due_date_terms: data.due_date_terms,
            due_date: data.due_date,
            invoice_total_amount: data.invoice_total_amount,
            invoice_gst_amount: data.invoice_gst_amount,
            invoice_total_parts_amount: data.invoice_total_parts_amount,
            invoice_total_parts_tax_amount: data.invoice_total_parts_tax_amount,
            invoice_total_services_amount: data.invoice_total_services_amount,
            invoice_total_services_tax_amount: data.invoice_total_services_tax_amount,
            invoice_total_parts_services_amount: data.invoice_total_parts_services_amount,
            invoice_total_parts_services_tax_amount: data.invoice_total_parts_services_tax_amount,
            invoice_total_tax_amount: data.invoice_total_tax_amount,
            invoice_pending_amount: data.invoice_total_amount,
            updated_by: staff_id ? staff_id : provider_id
        }
    });
    return purchaseInvoice;
};

const updatePurchaseInvoiceParty = async (purchase_invoice_id, type, data, tx) => {
    const purchaseInvoiceParty = await tx.purchaseInvoiceParty.updateMany({
        where: {
            purchase_invoice_id: purchase_invoice_id,
            type: type
        },
        data: {
            party_name: data.party_name,
            party_country_code: data.party_country_code,
            party_phone: data.party_phone,
            party_email: data.party_email,
            party_address: data.party_address,
            party_city: data.party_city,
            party_state: data.party_state,
            party_pincode: data.party_pincode,
            party_gstin_number: data.party_gstin_number,
            party_vehicle_number: data.party_vehicle_number
        }
    });
    return purchaseInvoiceParty;
};

const deletePurchaseParts = async (purchase_invoice_id, tx) => {
    const deletedParts = await tx.purchasePart.deleteMany({
        where: {
            purchase_invoice_id: purchase_invoice_id
        }
    });
    return deletedParts;
};

const deletePurchaseServices = async (purchase_invoice_id, tx) => {
    const deletedServices = await tx.purchaseService.deleteMany({
        where: {
            purchase_invoice_id: purchase_invoice_id
        }
    });
    return deletedServices;
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
            part_discount_amount: data.part_discount_amount,
            part_discount_percentage: data.part_discount_percentage
        }
    });
    return purchasePart;
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
            service_discount_percentage: data.service_discount_percentage
        }
    });
    return purchaseService;
};

const createPurchaseAdditionalCharges = async (purchase_invoice_id, data, tx) => {
    const purchaseAdditionalCharges = await tx.purchaseAdditionalCharges.create({
        data: {
            purchase_invoice_id,
            name: data.name,
            amount: data.amount,
            gst_percentage: data.gst_percentage,
            gst_amount: data.gst_amount,
            total_amount: data.total_amount
        }
    })
    return purchaseAdditionalCharges;
}

const deletePurchaseAdditionalCharges = async (purchase_invoice_id, tx) => {
    const purchaseAdditionalCharges = await tx.purchaseAdditionalCharges.deleteMany({
        where: {
            purchase_invoice_id: purchase_invoice_id
        }
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
    getPurchaseInvoiceById,
    getFranchiseInventoryById,
    updatePurchaseInvoice,
    updatePurchaseInvoiceParty,
    deletePurchaseParts,
    deletePurchaseServices,
    createPurchaseParts,
    createPurchaseServices,
    createPurchaseAdditionalCharges,
    deletePurchaseAdditionalCharges,
    getAllDataPurchaseInvoiceById,
    updateUrl
};