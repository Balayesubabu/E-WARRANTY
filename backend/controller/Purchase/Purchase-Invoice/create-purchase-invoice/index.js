import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import {
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
  getAllDataPurchaseInvoiceById,
  updateUrl
} from "./query.js";
import generateInvoiceNo from "../../../../services/generate-invoice-no.js";
import { PrismaClient } from "@prisma/client";
import updateInvoiceNumber from "../../../../services/updateInvoiceNumber.js";
import { checkInvoiceNumberExists } from "../../CheckInvoiceNumber.js";
import { pdfGenerator } from "../../../InvoiceSettings/pdfGenerator.js";
import { uploadPdfToS3 } from "../../../../services/upload.js";

const prisma = new PrismaClient();

// Input validation function
const validatePurchaseInvoiceInput = (data, franchise_id) => {
  const errors = [];

  // Required fields validation
  if (!data.provider_customer_id) {
    errors.push("provider_customer_id is required");
  }
  if (!franchise_id) {
    errors.push("franchise_id is required");
  }
  if (!data.bill_to || typeof data.bill_to !== "object") {
    errors.push("bill_from is required and must be an object");
  }
  if (!data.ship_to || typeof data.ship_to !== "object") {
    errors.push("ship_from is required and must be an object");
  }
  if (!data.invoice_date) {
    errors.push("invoice_date is required");
  }

  // --- Modified Validation for PurchaseParts / PurchaseServices ---
  const hasParts =
    Array.isArray(data.PurchaseParts) && data.PurchaseParts.length > 0;
  const hasServices =
    Array.isArray(data.PurchaseServices) && data.PurchaseServices.length > 0;

  if (!hasParts && !hasServices) {
    errors.push(
      "Either PurchaseParts or PurchaseServices must be a non-empty array"
    );
  }

  // Validate PurchaseAdditionalCharges
  if (
    data.PurchaseAdditionalCharges &&
    !Array.isArray(data.PurchaseAdditionalCharges)
  ) {
    errors.push("PurchaseAdditionalCharges must be an array");
  }

  // Validate bill_to and ship_to required fields
  if (data.bill_to) {
    if (!data.bill_to.party_name) errors.push("bill_to.party_name is required");
    if (!data.bill_to.party_phone)
      errors.push("bill_to.party_phone is required");
  }
  if (data.ship_to) {
    if (!data.ship_to.party_name) errors.push("ship_to.party_name is required");
    if (!data.ship_to.party_phone)
      errors.push("ship_to.party_phone is required");
  }

  // Validate percentage values
  if (
    data.invoice_additional_discount_percentage &&
    (data.invoice_additional_discount_percentage < 0 ||
      data.invoice_additional_discount_percentage > 100)
  ) {
    errors.push(
      "invoice_additional_discount_percentage must be between 0 and 100"
    );
  }
  if (
    data.invoice_tds_percentage &&
    (data.invoice_tds_percentage < 0 || data.invoice_tds_percentage > 100)
  ) {
    errors.push("invoice_tds_percentage must be between 0 and 100");
  }
  if (
    data.invoice_tcs_percentage &&
    (data.invoice_tcs_percentage < 0 || data.invoice_tcs_percentage > 100)
  ) {
    errors.push("invoice_tcs_percentage must be between 0 and 100");
  }

  // Validate amounts
  if (data.invoice_advance_amount && data.invoice_advance_amount < 0) {
    errors.push("invoice_advance_amount cannot be negative");
  }
  if (data.invoice_shipping_charges && data.invoice_shipping_charges < 0) {
    errors.push("invoice_shipping_charges cannot be negative");
  }

  return errors;
};

const createPurchaseInvoiceEndpoint = async (req, res) => {
  try {
    logger.info(`createPurchaseInvoiceEndpoint`);

    let user_id;
    let staff_id;
    if (req.type === "staff") {
      user_id = req.user_id;
      staff_id = req.staff_id;
    } else {
      user_id = req.user_id;
      staff_id = null;
    }

    const franchise_id = req.franchise_id;

    logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found for user_id: ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
    }
    logger.info(`--- Provider found for user_id: ${user_id} ---`);

    const data = req.body;

    // Validate input
    const validationErrors = validatePurchaseInvoiceInput(data, franchise_id);
    if (validationErrors.length > 0) {
      logger.error(`--- Validation errors: ${validationErrors.join(", ")} ---`);
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        `Validation failed: ${validationErrors.join(", ")}`
      );
    }

    // Validate customer exists
    logger.info(`--- Validating customer exists ---`);
    const customer = await getProviderCustomerById(
      data.provider_customer_id,
      provider.id
    );
    if (!customer) {
      logger.error(
        `--- Customer not found with id: ${data.provider_customer_id} and provider id: ${provider.id} ---`
      );
      return returnError(res, StatusCodes.NOT_FOUND, `Customer not found`);
    }
    logger.info(`--- Customer found with id: ${data.provider_customer_id} ---`);

    // Validate franchise exists
    logger.info(`--- Validating franchise exists ---`);
    const franchise = await getFranchiseById(franchise_id, provider.id);
    if (!franchise) {
      logger.error(`--- Franchise not found with id: ${franchise_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, `Franchise not found`);
    }
    logger.info(`--- Franchise found with id: ${franchise_id} ---`);

    let {
      provider_customer_id,
      bill_to,
      ship_to,
      invoice_number,
      invoice_type = "Purchase",
      invoice_status = "New",
      invoice_date,
      is_invoice_fully_paid,
      invoice_additional_discount_percentage = 0,
      invoice_additional_discount_amount = 0,
      invoice_tds_percentage = 0,
      invoice_tcs_percentage = 0,
      is_taxable_amount,
      is_total_amount,
      invoice_shipping_charges = 0,
      is_auto_round_off,
      auto_round_off_amount = 0,
      invoice_advance_amount = 0,
      advance_payment_type,
      advance_amount_online_transaction_id,
      advance_payment_date,
      invoice_payment_status,
      terms_and_conditions = [],
      additional_notes = [],
      due_date_terms,
      due_date,
      PurchaseParts = [],
      PurchaseServices = [],
      PurchaseAdditionalCharges = [],
      apply_tcs
    } = data;

    // Initialize all numeric fields to prevent NaN
    let invoice_total_amount = 0;
    let invoice_discount_amount = 0;
    let invoice_gst_amount = 0;
    let invoice_cgst_amount = 0;
    let invoice_sgst_amount = 0;
    let invoice_tds_amount = 0;
    let invoice_tcs_amount = 0;
    let invoice_pending_amount = 0;
    let invoice_paid_amount = 0;
    let invoice_total_tax_amount = 0;
    let invoice_total_parts_amount = 0;
    let invoice_total_parts_tax_amount = 0;
    let invoice_total_services_amount = 0;
    let invoice_total_services_tax_amount = 0;
    let invoice_total_parts_services_amount = 0;
    let invoice_total_parts_services_tax_amount = 0;
    let customer_final_balance = 0;

    let processed_parts = [];
    logger.info(`--- Processing parts ---`);
    for (const part of PurchaseParts || []) {
      let {
        franchise_inventory_id,
        part_name,
        part_hsn_code,
        part_description,
        part_purchase_price,
        part_quantity = 1,
        part_discount_percentage = 0,
        part_discount_amount = 0,
        part_measuring_unit,
        part_gst_percentage = 0,
        part_gst_amount,
        part_total_price,
        rateType,
        originalRate,
        originalGst
      } = part;

      // Validate part data
      if (!franchise_inventory_id) {
        return returnError(
          res,
          StatusCodes.BAD_REQUEST,
          `franchise_inventory_id is required for each part`
        );
      }
      if (!part_name) {
        return returnError(
          res,
          StatusCodes.BAD_REQUEST,
          `part_name is required for each part`
        );
      }
      if (!part_purchase_price || part_purchase_price <= 0) {
        return returnError(
          res,
          StatusCodes.BAD_REQUEST,
          `part_purchase_price must be greater than 0`
        );
      }
      if (part_quantity <= 0) {
        return returnError(
          res,
          StatusCodes.BAD_REQUEST,
          `part_quantity must be greater than 0`
        );
      }
      if (part_gst_percentage < 0 || part_gst_percentage > 100) {
        return returnError(
          res,
          StatusCodes.BAD_REQUEST,
          `part_gst_percentage must be between 0 and 100`
        );
      }

      const franchiseInventory = await getFranchiseInventoryById(franchise_inventory_id);
      if (!franchiseInventory) {
        return returnError(
          res,
          StatusCodes.BAD_REQUEST,
          `Franchise inventory not found`
        );
      }

      if (part_discount_percentage && !part_discount_amount) {
        part_discount_amount = (part_purchase_price * part_discount_percentage) / 100;
      } else if (!part_discount_percentage && part_discount_amount) {
        part_discount_percentage = (part_discount_amount / part_purchase_price) * 100;
      }

      // let part_gst_amount =
      //   (part_purchase_price * part_quantity - part_discount_amount * part_quantity) *
      //   (part_gst_percentage / 100);
      // let part_total_price =
      //   part_purchase_price * part_quantity - part_discount_amount * part_quantity + part_gst_amount;

      invoice_total_amount += part_total_price;
      invoice_discount_amount += part_discount_amount * part_quantity;
      invoice_gst_amount += part_gst_amount;
      invoice_cgst_amount += part_gst_amount / 2;
      invoice_sgst_amount += part_gst_amount / 2;
      invoice_total_tax_amount += part_gst_amount;
      invoice_total_parts_amount += part_purchase_price * part_quantity;
      invoice_total_parts_tax_amount += part_gst_amount;
      invoice_total_parts_services_amount += part_purchase_price * part_quantity;
      invoice_total_parts_services_tax_amount += part_gst_amount;

      processed_parts.push({
        franchise_inventory_id,
        part_name,
        part_hsn_code,
        part_description,
        part_purchase_price,
        part_quantity,
        part_discount_percentage,
        part_discount_amount,
        part_measuring_unit,
        part_gst_percentage,
        part_gst_amount,
        part_total_price,
        rateType,
        originalRate,
        originalGst
      });
    }

    let processed_services = [];
    logger.info(`--- Processing services ---`);
    for (const service of PurchaseServices || []) {
      let {
        franchise_service_id,
        service_name,
        service_description,
        service_discount_percentage = 0,
        service_discount_amount = 0,
        service_price,
        service_gst_percentage = 0,
        service_gst_amount,
        service_total_price,
        rateType,
        originalRate,
        originalGst
      } = service;

      // Validate service data
      if (!service_name) {
        return returnError(
          res,
          StatusCodes.BAD_REQUEST,
          `service_name is required for each service`
        );
      }
      if (!service_price || service_price <= 0) {
        return returnError(
          res,
          StatusCodes.BAD_REQUEST,
          `service_price must be greater than 0`
        );
      }
      if (service_gst_percentage < 0 || service_gst_percentage > 100) {
        return returnError(
          res,
          StatusCodes.BAD_REQUEST,
          `service_gst_percentage must be between 0 and 100`
        );
      }

      if (service_discount_percentage && !service_discount_amount) {
        service_discount_amount = (service_price * service_discount_percentage) / 100;
      } else if (!service_discount_percentage && service_discount_amount) {
        service_discount_percentage = (service_discount_amount / service_price) * 100;
      }

      // let service_gst_amount =
      //   (service_price - service_discount_amount) * (service_gst_percentage / 100);
      // let service_total_price = service_price - service_discount_amount + service_gst_amount;

      invoice_total_amount += service_total_price;
      invoice_discount_amount += service_discount_amount;
      invoice_gst_amount += service_gst_amount;
      invoice_cgst_amount += service_gst_amount / 2;
      invoice_sgst_amount += service_gst_amount / 2;
      invoice_total_tax_amount += service_gst_amount;
      invoice_total_services_amount += service_price;
      invoice_total_services_tax_amount += service_gst_amount;
      invoice_total_parts_services_amount += service_price;
      invoice_total_parts_services_tax_amount += service_gst_amount;

      processed_services.push({
        franchise_service_id,
        service_name,
        service_description,
        service_discount_percentage,
        service_discount_amount,
        service_price,
        service_gst_percentage,
        service_gst_amount,
        service_total_price,
        rateType,
        originalRate,
        originalGst
      });
    }

    let processed_additional_charges = [];
    logger.info(`--- Processing additional charges ---`);
    for (const charge of PurchaseAdditionalCharges || []) {
      let { name, amount, gst_percentage = 0 } = charge;

      // Validation already handled in validatePurchaseInvoiceInput, but ensure defaults
      let gst_amount = (amount * gst_percentage) / 100;
      let total_amount = amount + gst_amount;
      invoice_total_amount += total_amount;
      invoice_gst_amount += gst_amount;
      invoice_cgst_amount += gst_amount / 2;
      invoice_sgst_amount += gst_amount / 2;
      invoice_total_tax_amount += gst_amount;

      processed_additional_charges.push({
        name,
        amount,
        gst_percentage,
        gst_amount,
        total_amount,
      });
    }

    logger.info(`--- Processing additional discount ---`);
    if (invoice_additional_discount_percentage && !invoice_additional_discount_amount) {
      invoice_additional_discount_amount =
        invoice_total_parts_services_amount * (invoice_additional_discount_percentage / 100);
    } else if (!invoice_additional_discount_percentage && invoice_additional_discount_amount) {
      invoice_additional_discount_percentage =
        invoice_total_parts_services_amount > 0
          ? (invoice_additional_discount_amount / invoice_total_parts_services_amount) * 100
          : 0;
    }

    invoice_total_amount =
      invoice_total_parts_services_amount +
      invoice_total_parts_services_tax_amount -
      (invoice_additional_discount_amount || 0);

    logger.info(`--- Processing shipping charges ---`);
    if (invoice_shipping_charges) {
      invoice_total_amount += invoice_shipping_charges;
    }

    logger.info(`--- Processing TDS percentage ---`);
    if (invoice_tds_percentage) {
      invoice_tds_amount =
        (invoice_total_amount - invoice_gst_amount) * (invoice_tds_percentage / 100);
      invoice_total_tax_amount += invoice_tds_amount;
      invoice_total_amount -= invoice_tds_amount;
    }

    logger.info(`--- Processing TCS percentage ---`);
    if (invoice_tcs_percentage && is_total_amount) {
      invoice_tcs_amount = invoice_total_amount * (invoice_tcs_percentage / 100);
      invoice_total_amount += invoice_tcs_amount;
      invoice_total_tax_amount += invoice_tcs_amount;
    } else if (invoice_tcs_percentage && is_taxable_amount) {
      invoice_tcs_amount =
        (invoice_total_amount - invoice_gst_amount) * (invoice_tcs_percentage / 100);
      invoice_total_amount += invoice_tcs_amount;
      invoice_total_tax_amount += invoice_tcs_amount;
    }

    logger.info(`--- Processing auto round off ---`);
    if (is_auto_round_off === true) {
      auto_round_off_amount = invoice_total_amount - Math.round(invoice_total_amount);
      invoice_total_amount = Math.round(invoice_total_amount);
    } else if (is_auto_round_off === false && auto_round_off_amount) {
      invoice_total_amount += auto_round_off_amount;
    }

    logger.info(`--- Processing invoice payment status ---`);
    if (is_invoice_fully_paid) {
      invoice_payment_status = "Paid";
      invoice_paid_amount = invoice_total_amount;
      invoice_pending_amount = 0;
      customer_final_balance = 0;
    } else if (!is_invoice_fully_paid && invoice_advance_amount) {
      invoice_payment_status = "Partially_Paid";
      invoice_paid_amount = invoice_advance_amount;
      invoice_pending_amount = invoice_total_amount - invoice_paid_amount;
      customer_final_balance = invoice_pending_amount;
    } else {
      invoice_payment_status = "Unpaid";
      invoice_paid_amount = 0;
      invoice_pending_amount = invoice_total_amount;
      customer_final_balance = invoice_pending_amount;
    }

    // Validate calculated fields to prevent NaN
    if (isNaN(invoice_total_amount) || isNaN(customer_final_balance)) {
      logger.error(`Invalid calculated values: invoice_total_amount=${invoice_total_amount}, customer_final_balance=${customer_final_balance}`);
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        `Invalid calculated values: invoice_total_amount and customer_final_balance must be valid numbers`
      );
    }

    // Convert terms_and_conditions and additional_notes to arrays if they are strings
    if (typeof terms_and_conditions === "string") {
      terms_and_conditions = [terms_and_conditions];
    } else if (!Array.isArray(terms_and_conditions)) {
      terms_and_conditions = [];
    }
    if (typeof additional_notes === "string") {
      additional_notes = [additional_notes];
    } else if (!Array.isArray(additional_notes)) {
      additional_notes = [];
    }

    // Wrap all database operations in a transaction
    const result = await prisma.$transaction(async (tx) => {
      logger.info(`--- Starting transaction for purchase invoice creation ---`);

      console.log("provider_id", provider.id);
      console.log("franchise_id", franchise_id);
      console.log("invoice_number", invoice_number);
      console.log("invoice_type", invoice_type);

      const checkInvoiceExists = await checkInvoiceNumberExists(
        provider.id,
        franchise_id,
        staff_id,
        invoice_number,
        invoice_type,
        tx
      );

      if (checkInvoiceExists) {
        throw new Error("Invoice number already exists");
      }

      // Create purchase invoice
      logger.info(`--- Creating purchase invoice ---`);
      const created_purchase_invoice = await createPurchaseInvoice(
        provider.id,
        franchise_id,
        staff_id,
        {
          provider_customer_id,
          bill_to,
          ship_to,
          invoice_number,
          invoice_type,
          invoice_status,
          invoice_date,
          is_invoice_fully_paid,
          invoice_additional_discount_percentage,
          invoice_additional_discount_amount,
          invoice_tds_percentage,
          invoice_tcs_percentage,
          invoice_shipping_charges,
          is_auto_round_off,
          auto_round_off_amount,
          invoice_advance_amount,
          advance_payment_type,
          advance_amount_online_transaction_id,
          advance_payment_date,
          invoice_payment_status,
          terms_and_conditions,
          additional_notes,
          due_date_terms,
          due_date,
          invoice_total_amount: invoice_total_amount.toFixed(2),
          invoice_discount_amount,
          invoice_gst_amount,
          invoice_tds_amount,
          invoice_tcs_amount,
          invoice_pending_amount: invoice_pending_amount.toFixed(2),
          invoice_paid_amount,
          invoice_total_tax_amount,
          invoice_total_parts_amount,
          invoice_total_parts_tax_amount,
          invoice_total_services_amount,
          invoice_total_services_tax_amount,
          invoice_total_parts_services_amount,
          invoice_total_parts_services_tax_amount,
          apply_tcs,
          is_taxable_amount,
          is_total_amount
        },
        tx
      );

      if (!created_purchase_invoice) {
        throw new Error("Failed to create purchase invoice");
      }
      logger.info(`--- Purchase invoice created ---`);

      // Update customer final balance
      logger.info(`--- Updating customer final balance ---`);
      console.log("customer_final_balance", customer_final_balance);
      const update_customer_final_balance = await updateProviderCustomerFinalBalance(
        provider_customer_id,
        customer_final_balance,
        tx
      );
      if (!update_customer_final_balance) {
        throw new Error("Failed to update customer final balance");
      }
      logger.info(`--- Customer final balance updated ---`);

      // Create purchase invoice party (provider)
      logger.info(`--- Creating purchase invoice party ---`);
      const invoice_provider_data = await createPurchaseInvoiceParty(
        created_purchase_invoice.id,
        {
          purchase_invoice_id: created_purchase_invoice.id,
          type: "Provider",
          party_name: provider.company_name,
          party_country_code: provider.user.country_code,
          party_phone: provider.user.phone_number,
          party_email: provider.user.email,
          party_address: provider.company_address,
          party_city: provider.user.city,
          party_state: provider.user.state,
          party_gstin_number: provider.gst_number,
        },
        tx
      );

      if (!invoice_provider_data) {
        throw new Error("Failed to create purchase invoice party");
      }
      logger.info(`--- Purchase invoice party created ---`);

      // Create bill to
      logger.info(`--- Creating bill to ---`);
      const bill_to_created = await createPurchaseInvoiceParty(
        created_purchase_invoice.id,
        {
          purchase_invoice_id: created_purchase_invoice.id,
          type: "Bill_To",
          party_name: bill_to.party_name,
          party_country_code: bill_to.party_country_code,
          party_phone: bill_to.party_phone,
          party_email: bill_to.party_email,
          party_address: bill_to.party_address,
          party_city: bill_to.party_city,
          party_state: bill_to.party_state,
          party_pincode: bill_to.party_pincode,
          party_gstin_number: bill_to.party_gstin_number,
          party_vehicle_number: bill_to.party_vehicle_number,
        },
        tx
      );

      if (!bill_to_created) {
        throw new Error("Failed to create bill to");
      }
      logger.info(`--- Bill to created ---`);

      // Create ship to
      logger.info(`--- Creating ship to ---`);
      const ship_to_created = await createPurchaseInvoiceParty(
        created_purchase_invoice.id,
        {
          purchase_invoice_id: created_purchase_invoice.id,
          type: "Ship_To",
          party_name: ship_to.party_name,
          party_country_code: ship_to.party_country_code,
          party_phone: ship_to.party_phone,
          party_email: ship_to.party_email,
          party_address: ship_to.party_address,
          party_city: ship_to.party_city,
          party_state: ship_to.party_state,
          party_pincode: ship_to.party_pincode,
          party_gstin_number: ship_to.party_gstin_number,
          party_vehicle_number: ship_to.party_vehicle_number,
        },
        tx
      );

      if (!ship_to_created) {
        throw new Error("Failed to create ship to");
      }
      logger.info(`--- Ship to created ---`);

      // Create parts
      logger.info(`--- Creating parts ---`);
      for (const part of processed_parts) {
        logger.info(`--- Creating part ---`);
        await createPurchaseParts(
          created_purchase_invoice.id,
          {
            ...part,
            purchase_invoice_id: created_purchase_invoice.id,
          },
          tx
        );

        await updateFranchiseInventory(
          part.franchise_inventory_id,
          part.part_quantity,
          tx
        );
      }

      // Create services
      for (const service of processed_services) {
        logger.info(`--- Creating service ---`);
        await createPurchaseServices(
          created_purchase_invoice.id,
          {
            ...service,
            purchase_invoice_id: created_purchase_invoice.id,
          },
          tx
        );
      }

      // Create additional charges
      logger.info(`--- Creating additional charges ---`);
      for (const charge of processed_additional_charges) {
        logger.info(`--- Creating additional charge ---`);
        await createPurchaseAdditionalCharges(
          created_purchase_invoice.id,
          {
            ...charge,
            purchase_invoice_id: created_purchase_invoice.id,
          },
          tx
        );
      }

      // Create transactions if needed
      if (is_invoice_fully_paid) {
        await createPurchaseInvoiceTransactions(
          created_purchase_invoice.id,
          {
            invoice_type: "Purchase",
            amount: invoice_total_amount,
            total_amount: invoice_total_amount.toFixed(2),
            pending_amount: invoice_pending_amount.toFixed(2),
            paid_amount: invoice_paid_amount,
            transaction_type: advance_payment_type,
            transaction_status: "Paid",
            transaction_id: advance_amount_online_transaction_id || "",
          },
          tx
        );

        await createTransactions(
          created_purchase_invoice.id,
          {
            provider_id: provider.id,
            provider_customer_id: provider_customer_id,
            invoice_type: "Purchase",
            amount: invoice_total_amount.toFixed(2),
            transaction_type: advance_payment_type,
            transaction_status: "Paid",
            transaction_id: advance_amount_online_transaction_id || "",
          },
          tx
        );
      } else if (invoice_advance_amount) {
        await createPurchaseInvoiceTransactions(
          created_purchase_invoice.id,
          {
            invoice_type: "Purchase",
            amount: invoice_advance_amount,
            total_amount: invoice_total_amount,
            pending_amount: invoice_pending_amount,
            paid_amount: invoice_paid_amount,
            transaction_type: advance_payment_type,
            transaction_status: "Paid",
            transaction_id: advance_amount_online_transaction_id || "",
          },
          tx
        );

        await createTransactions(
          created_purchase_invoice.id,
          {
            provider_id: provider.id,
            provider_customer_id: provider_customer_id,
            invoice_type: "Purchase",
            amount: invoice_advance_amount,
            transaction_type: advance_payment_type,
            transaction_status: "Paid",
            transaction_id: advance_amount_online_transaction_id || "",
          },
          tx
        );
      }

      const updatedInvoiceNumber = await updateInvoiceNumber(
        tx,
        provider.id,
        franchise_id,
        invoice_type
      );

      if (!updatedInvoiceNumber) {
        throw new Error("Failed to update invoice number");
      }
      logger.info(`--- Transaction completed successfully ---`);

      return created_purchase_invoice;
    });

    const purchaseInvoiceId = result.id;
    const purchaseInvoice = await getAllDataPurchaseInvoiceById(purchaseInvoiceId);
    if (!purchaseInvoice) {
        return returnError(res, StatusCodes.NOT_FOUND, "Purchase invoice not found");
    }

    
    console.log("purchaseInvoice: ", purchaseInvoice);

      const plainInvoice = JSON.parse(JSON.stringify(purchaseInvoice));
      console.log("plainInvoice: ", plainInvoice);

      const pdfBuffer = await pdfGenerator(provider.id, plainInvoice, "Purchase");

      const fileName = `invoice_${purchaseInvoiceId}_provider_${franchise_id}`;
      const s3Url = await uploadPdfToS3(pdfBuffer, fileName, 'invoices');
      logger.info(`Invoice uploaded to S3: ${s3Url}`);

      const updated_invoice = await updateUrl(purchaseInvoiceId, s3Url);

    
    return returnResponse(
      res,
      StatusCodes.CREATED,
      "Purchase invoice created successfully",
      result
    );
  } catch (error) {
    logger.error(`Error in createPurchaseInvoiceEndpoint: ${error.message}`);
    logger.error(error.stack); // Log full stack for debugging
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error: ${error.message}`
    );
  } finally {
    await prisma.$disconnect();
  }
};

export { createPurchaseInvoiceEndpoint };
