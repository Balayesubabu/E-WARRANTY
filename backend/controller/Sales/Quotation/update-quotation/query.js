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
    prisma,
    SalesAdditionalCharges
} from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        },
        include: {
            user: true
        }
    });
    return provider;
}

const getSalesInvoiceById = async (sales_invoice_id) => {
    const salesInvoice = await SalesInvoice.findFirst({
        where: {
            id: sales_invoice_id
        }
    });
    return salesInvoice;
}

const getFranchiseInventoryById = async (franchise_inventory_id) => {
    const franchiseInventory = await FranchiseInventory.findFirst({
        where: {
            id: franchise_inventory_id
        }
    });
    return franchiseInventory;
}

const updateSalesInvoice = async (sales_invoice_id,staff_id,provider_id ,data, tx) => {
    const salesInvoice = await tx.salesInvoice.update({
        where: {
            id: sales_invoice_id
        },
        data: {
            provider_customer_id: data.provider_customer_id,
            invoice_number: data.invoice_number,
            prefix: data.prefix,
            sequence_number: data.sequence_number,
            franchise_id: data.franchise_id,
            invoice_date: data.invoice_date,
            terms_and_conditions: data.terms_and_conditions,
            additional_notes: data.additional_notes,
            due_date_terms: data.due_date_terms,
            due_date: data.due_date,
            invoice_total_amount: data.invoice_total_amount,
            invoice_gst_amount: data.invoice_gst_amount,
            invoice_total_tax_amount: data.invoice_total_tax_amount,
            invoice_total_parts_amount: data.invoice_total_parts_amount,
            invoice_total_parts_tax_amount: data.invoice_total_parts_tax_amount,
            invoice_total_services_amount: data.invoice_total_services_amount,
            invoice_total_services_tax_amount: data.invoice_total_services_tax_amount,
            invoice_total_parts_services_amount: data.invoice_total_parts_services_amount,
            invoice_total_parts_services_tax_amount: data.invoice_total_parts_services_tax_amount,
            is_auto_round_off : data.is_auto_round_off,
            auto_round_off_amount : data.auto_round_off_amount,
            invoice_additional_discount_percentage : data.invoice_additional_discount_percentage,
      invoice_additional_discount_amount : data.invoice_additional_discount_amount,
      invoice_discount_amount : data.invoice_discount_amount,
      bank_id : data.bank_id,
            updated_at : new Date(),
            updated_by: staff_id || provider_id
        }
    });
    return salesInvoice;
}

const updateSalesInvoiceParty = async (sales_invoice_id, type, data, tx) => {
    const salesInvoiceParty = await tx.salesInvoiceParty.updateMany({
        where: {
            sales_invoice_id: sales_invoice_id,
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
    return salesInvoiceParty;
}

const deleteSalesParts = async (sales_invoice_id, tx) => {
    const salesParts = await tx.salesPart.deleteMany({
        where: {
            sales_invoice_id: sales_invoice_id
        }
    });
    return salesParts;
}

const deleteSalesServices = async (sales_invoice_id, tx) => {
    const salesServices = await tx.salesService.deleteMany({
        where: {
            sales_invoice_id: sales_invoice_id
        }
    });
    return salesServices;
}

const deleteSalesAdditionalCharges = async (sales_invoice_id, tx) => {
    const salesAdditionalCharges = await tx.salesAdditionalCharges.deleteMany({
        where: {
            sales_invoice_id: sales_invoice_id
        }
    });
    return salesAdditionalCharges;
}

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
            part_mesuring_unit: data.part_mesuring_unit,
            part_gst_percentage: data.part_gst_percentage,
            part_gst_amount: data.part_gst_amount,
            part_total_price: data.part_total_price,
            part_discount_amount: data.part_discount_amount,
            part_discount_percentage: data.part_discount_percentage
        }
    });
    return salesParts;
}

const createSalesServices = async (sales_invoice_id, data, tx) => {
    const salesServices = await tx.salesService.create({
        data: {
            sales_invoice_id,
            franchise_service_id: data.franchise_service_id,
            service_name: data.service_name,
            service_sac_number: data.service_sac_number,
            service_description: data.service_description,
            service_price: data.service_price,
            service_gst_percentage: data.service_gst_percentage,
            service_gst_amount: data.service_gst_amount,
            service_total_price: data.service_total_price,
            service_discount_amount: data.service_discount_amount,
            service_discount_percentage: data.service_discount_percentage
        }
    });
    return salesServices;
}

const createSalesAdditionalCharges = async (sales_invoice_id, data, tx) => {
    const salesAdditionalCharges = await tx.salesAdditionalCharges.create({
        data: {
            sales_invoice_id,
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
    getSalesInvoiceById,
    getFranchiseInventoryById,
    updateSalesInvoice,
    updateSalesInvoiceParty,
    deleteSalesParts,
    deleteSalesServices,
    deleteSalesAdditionalCharges,
    createSalesParts,
    createSalesServices,
    createSalesAdditionalCharges,
    getAllDataSalesInvoiceById,
    updateUrl
};