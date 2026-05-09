import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import {
  getProviderByUserId,
  getPurchaseInvoiceById,
  getFranchiseInventoryById,
  updatePurchaseInvoice,
  updateProviderCustomerFinalBalance,
  createPurchaseParts,
  updateFranchiseInventory,
  createPurchaseServices,
  createPurchaseInvoiceParty,
  clearPurchaseInvoice,
  getPurchaseInvoiceTransactions,
  restoreFranchiseInventory,
  createPurchaseAdditionalCharges,
} from "./query.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const updatePurchaseEndpoint = async (req, res) => {
  try {
    logger.info(`updatePurchaseInvoiceEndpoint`);

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

    let {
      provider_customer_id,
      bill_to,
      ship_to,
      invoice_number,
      invoice_type,
      invoice_status,
      invoice_payment_status,
      invoice_date,
      is_invoice_fully_paid = false,
      invoice_advance_amount = 0,
      invoice_additional_discount_percentage = 0,
      invoice_additional_discount_amount = 0,
      invoice_tds_percentage = 0,
      invoice_tcs_percentage = 0,
      is_auto_round_off = false,
      auto_round_off_amount = 0,
      apply_tcs = false,
      apply_tds = false,
      is_taxable_amount = false,
      is_total_amount = false,
      advance_payment_type,
      advance_amount_online_transaction_id,
      advance_payment_date,
      terms_and_conditions = [],
      additional_notes = [],
      due_date_terms,
      due_date,
      PurchaseParts = [],
      PurchaseServices = [],
      PurchaseAdditionalCharges = [],
    } = data;

    const purchase_invoice_id = req.params.id;

    logger.info(
      `--- Fetching purchase invoice details for purchase_invoice_id: ${purchase_invoice_id} ---`
    );
    const existing_purchase_invoice = await getPurchaseInvoiceById(
      purchase_invoice_id,
      provider.id,
      franchise_id
    );
    if (!existing_purchase_invoice) {
      logger.error(
        `--- Purchase invoice not found for purchase_invoice_id: ${purchase_invoice_id} ---`
      );
      return returnError(
        res,
        StatusCodes.NOT_FOUND,
        `Purchase invoice not found`
      );
    }
    logger.info(
      `--- Purchase invoice found for purchase_invoice_id: ${purchase_invoice_id} ---`
    );

    logger.info(
      `--- Fetching purchase invoice transactions for purchase_invoice_id: ${purchase_invoice_id} ---`
    );
    const existing_transactions = await getPurchaseInvoiceTransactions(
      purchase_invoice_id,
      provider.id,
      franchise_id
    );
    if (!existing_transactions) {
      logger.error(
        `--- Purchase invoice transactions not found for purchase_invoice_id: ${purchase_invoice_id} ---`
      );
      return returnError(
        res,
        StatusCodes.NOT_FOUND,
        `Purchase invoice transactions not found`
      );
    }
    logger.info(
      `--- Purchase invoice transactions found for purchase_invoice_id: ${purchase_invoice_id} ---`
    );

    const existing_paid_amount = existing_transactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );
    logger.info(`--- Existing paid amount: ${existing_paid_amount} ---`);

    const old_parts = existing_purchase_invoice.PurchasePart || [];
    logger.info(`--- Old parts: ${JSON.stringify(old_parts)} ---`);

    logger.info(`--- Restoring franchise inventory for old parts ---`);
    if(invoice_type === "Purchase"){
          for (const old_part of old_parts) {
      // For purchase invoices, we need to DECREASE inventory (restore what was added)
      await restoreFranchiseInventory(
        old_part.franchise_inventory_id,
        provider.id,
        franchise_id,
        -old_part.part_quantity
      );
    }
    } else if(invoice_type === "Purchase_Return" || invoice_type === "Debit_Note"){
       for (const old_part of old_parts) {
      // For purchase invoices, we need to DECREASE inventory (restore what was added)
      await restoreFranchiseInventory(
        old_part.franchise_inventory_id,
        provider.id,
        franchise_id,
        old_part.part_quantity
      );
    }
    }


    logger.info(
      `--- Clearing purchase invoice for purchase_invoice_id: ${purchase_invoice_id} ---`
    );
    await clearPurchaseInvoice(purchase_invoice_id);
    logger.info(
      `--- Purchase invoice cleared for purchase_invoice_id: ${purchase_invoice_id} ---`
    );

    logger.info(`--- Fetching data from request body ---`);
    

    let invoice_total_amount = 0;
    let invoice_gst_amount = 0;
    let invoice_cgst_amount = 0;
    let invoice_sgst_amount = 0;
    let invoice_total_tax_amount = 0;
    let invoice_total_parts_amount = 0;
    let invoice_total_parts_tax_amount = 0;
    let invoice_total_services_amount = 0;
    let invoice_total_services_tax_amount = 0;
    let invoice_total_parts_services_amount = 0;
    let invoice_total_parts_services_tax_amount = 0;
    let invoice_total_parts_services_discount_amount = 0;
    // let invoice_discount_amount = 0;
    let invoice_tds_amount = 0;
    let invoice_tcs_amount = 0;
    let total_after_tds = 0;
    let invoice_pending_amount = 0;
    let invoice_paid_amount = 0;
    let customer_final_balance = 0;

    let processed_parts = [];
    logger.info(`--- Processing parts ---`);
    for (const part of PurchaseParts) {
      let {
        franchise_inventory_id,
        part_name,
        part_hsn_code,
        part_description,
        part_purchase_price,
        part_quantity = 1,
        part_measuring_unit,
        part_discount_percentage = 0,
        part_discount_amount = 0,
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

      logger.info(
        `--- Fetching franchise inventory for part: ${franchise_inventory_id} ---`
      );
      const franchiseInventory = await getFranchiseInventoryById(
        franchise_inventory_id
      );
      if (!franchiseInventory) {
        return returnError(
          res,
          StatusCodes.BAD_REQUEST,
          `Franchise inventory not found`
        );
      }

      logger.info(`--- Calculating part GST amount ---`);
      part_discount_amount =
        (part_purchase_price * part_quantity * part_discount_percentage) / 100;

      console.log("part_discount_amount", part_discount_amount);

      part_discount_percentage =
        (part_discount_amount / (part_purchase_price * part_quantity)) * 100;

      console.log("part_discount_percentage", part_discount_percentage);

      // let part_gst_amount =
      //   (part_purchase_price * part_quantity - part_discount_amount) *
      //   (part_gst_percentage / 100);

      console.log("part_gst_amount", part_gst_amount);

      // let part_total_price =
      //   part_purchase_price * part_quantity +
      //   part_gst_amount -
      //   part_discount_amount;

      console.log("part_total_price", part_total_price);

      logger.info(`--- Calculating part total price ---`);
      invoice_total_amount += part_total_price;
      invoice_gst_amount += part_gst_amount;
      invoice_cgst_amount += part_gst_amount / 2;
      invoice_sgst_amount += part_gst_amount / 2;
      invoice_total_tax_amount += part_gst_amount;
      invoice_total_parts_amount += part_total_price;
      invoice_total_parts_tax_amount += part_gst_amount;
      invoice_total_parts_services_amount +=
        part_purchase_price * part_quantity;
      invoice_total_parts_services_tax_amount += part_gst_amount;
      invoice_total_parts_services_discount_amount += part_discount_amount;

      console.log(
        "invoice_total_parts_services_discount_amount",
        invoice_total_parts_services_discount_amount
      );
      console.log(
        "invoice_total_parts_services_tax_amount",
        invoice_total_parts_services_tax_amount
      );
      console.log(
        "invoice_total_parts_services_discount_amount ",
        invoice_total_parts_services_discount_amount
      );
      console.log("invoice_total_amount", invoice_total_amount);

      logger.info(`--- Adding part to processed parts ---`);
      processed_parts.push({
        franchise_inventory_id,
        part_name,
        part_hsn_code,
        part_description,
        part_purchase_price,
        part_quantity,
        part_measuring_unit,
        part_gst_percentage,
        part_discount_percentage,
        part_discount_amount,
        part_gst_amount,
        part_total_price,
        rateType,
        originalRate,
        originalGst
      });
    }

    let processed_services = [];
    logger.info(`--- Processing services ---`);
    for (const service of PurchaseServices) {
      let {
        franchise_service_id,
        service_name,
        service_description,
        service_price,
        service_gst_percentage = 0,
        service_discount_percentage = 0,
        service_discount_amount = 0,
        service_gst_amount,
        service_total_price,
        rateType,
        originalRate,
        originalGst
      } = service;

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

      logger.info(`--- Calculating service GST amount ---`);
      service_discount_amount =
        (service_price * service_discount_percentage) / 100;

      service_discount_percentage =
        (service_discount_amount / service_price) * 100;

      (part_purchase_price * part_quantity - part_discount_amount) *
        (part_gst_percentage / 100);
      // let service_gst_amount =
      //   (service_price - service_discount_amount) *
      //   (service_gst_percentage / 100);
      // let service_total_price =
      //   service_price + service_gst_amount - service_discount_amount;

      logger.info(`--- Calculating service total price ---`);
      invoice_total_amount += service_total_price;
      invoice_gst_amount += service_gst_amount;
      invoice_cgst_amount += service_gst_amount / 2;
      invoice_sgst_amount += service_gst_amount / 2;
      invoice_total_tax_amount += service_gst_amount;
      invoice_total_services_amount += service_price;
      invoice_total_services_tax_amount += service_gst_amount;
      invoice_total_parts_services_amount += service_price;
      invoice_total_parts_services_tax_amount += service_gst_amount;
      invoice_total_parts_services_discount_amount += service_discount_amount;

      logger.info(`--- Adding service to processed services ---`);
      processed_services.push({
        franchise_service_id,
        service_name,
        service_description,
        service_price,
        service_gst_percentage,
        service_discount_percentage,
        service_discount_amount,
        service_gst_amount,
        service_total_price,
        rateType,
        originalRate,
        originalGst
      });
    }

    let processed_additional_charges = [];
    logger.info(`--- Processing additional charges ---`);
    for (const charge of PurchaseAdditionalCharges) {
      let { name, amount, gst_percentage } = charge;

      logger.info(`--- Calculating additional charge GST amount ---`);
      let gst_amount = (amount * gst_percentage) / 100;
      let total_amount = amount + amount * (gst_percentage / 100);
      invoice_total_amount += total_amount;
      invoice_gst_amount += gst_amount;
      invoice_cgst_amount += gst_amount / 2;
      invoice_sgst_amount += gst_amount / 2;
      invoice_total_tax_amount += gst_amount;

      console.log("invoice_total_amount", invoice_total_amount);
      console.log("invoice_gst_amount", invoice_gst_amount);
      console.log("invoice_total_tax_amount", invoice_total_tax_amount);

      processed_additional_charges.push({
        name,
        amount,
        gst_percentage,
        gst_amount,
        total_amount,
      });
    }

    if (
      invoice_additional_discount_percentage &&
      !invoice_additional_discount_amount
    ) {
      invoice_additional_discount_amount =
        invoice_total_amount * (invoice_additional_discount_percentage / 100);
    } else if (
      !invoice_additional_discount_percentage &&
      invoice_additional_discount_amount
    ) {
      invoice_additional_discount_percentage =
        invoice_total_amount > 0
          ? (invoice_additional_discount_amount / invoice_total_amount) * 100
          : 0;
    }

    console.log(
      "invoice_additional_discount_amount",
      invoice_additional_discount_amount
    );
    console.log(
      "invoice_additional_discount_percentage",
      invoice_additional_discount_percentage
    );

    invoice_total_amount =
      invoice_total_amount - invoice_additional_discount_amount;

    console.log("invoice_total_amount", invoice_total_amount);

    logger.info(`--- Processing TCS percentage ---`);
    if (apply_tcs === true) {
      if (is_total_amount && invoice_tcs_percentage) {
        invoice_tcs_amount = invoice_total_amount * (invoice_tcs_percentage / 100);
        invoice_total_amount += invoice_tcs_amount;
        invoice_total_tax_amount += invoice_tcs_amount;
      } else if (is_taxable_amount && invoice_tcs_percentage) {
       invoice_tcs_amount = invoice_total_parts_services_amount * (invoice_tcs_percentage / 100);
        invoice_total_amount += invoice_tcs_amount;
        invoice_total_tax_amount += invoice_tcs_amount;

        console.log("invoice_tcs_amount", invoice_tcs_amount);
        console.log("invoice_total_amount", invoice_total_amount);
      }
    }

    logger.info(`--- Processing TDS percentage ---`);
    if (apply_tds === true) {
      invoice_tds_amount =
        (invoice_total_amount - invoice_gst_amount) *
        (invoice_tds_percentage / 100);
      invoice_total_tax_amount += invoice_tds_amount;
      invoice_total_amount -= invoice_tds_amount;

       total_after_tds = invoice_total_amount - invoice_tds_amount;

      console.log("invoice_tds_amount", invoice_tds_amount);
      console.log("invoice_total_amount", invoice_total_amount);
      console.log("total_after_tds", total_after_tds);
      
    }

    logger.info(`--- Processing auto round off ---`);
    if (is_auto_round_off === true) {
      auto_round_off_amount =
        invoice_total_amount - Math.round(invoice_total_amount);
      invoice_total_amount = Math.round(invoice_total_amount);
    } else if (is_auto_round_off === false && auto_round_off_amount) {
      invoice_total_amount += auto_round_off_amount;
    }

    logger.info(`--- Processing invoice payment status ---`);

    if (invoice_type === "Purchase") {
      if (is_invoice_fully_paid === true) {
        invoice_payment_status = "Paid";
        invoice_paid_amount = invoice_total_amount;
        invoice_pending_amount = 0;
        customer_final_balance = 0;
      } else if (is_invoice_fully_paid === false && invoice_advance_amount) {
        invoice_payment_status = "Partially_Paid";
        invoice_paid_amount = invoice_advance_amount;
        invoice_pending_amount = invoice_total_amount - invoice_paid_amount;
        customer_final_balance = invoice_pending_amount;
      } else if (is_invoice_fully_paid === false && !invoice_advance_amount) {
        invoice_payment_status = "Unpaid";
        invoice_paid_amount = 0;
        invoice_pending_amount = invoice_total_amount;
        customer_final_balance = invoice_pending_amount;
      }
    } else if (
      invoice_type === "Purchase_Return" ||
      invoice_type === "Debit_Note"
    ) {
      if (is_invoice_fully_paid === true) {
        invoice_payment_status = "Paid";
        invoice_paid_amount = invoice_total_amount;
        invoice_pending_amount = 0;
        customer_final_balance = -invoice_total_amount;
      } else if (is_invoice_fully_paid === false && invoice_advance_amount) {
        invoice_payment_status = "Partially_Paid";
        invoice_paid_amount = invoice_advance_amount;
        invoice_pending_amount = invoice_total_amount - invoice_paid_amount;
        customer_final_balance = -invoice_pending_amount;
      } else if (is_invoice_fully_paid === false && !invoice_advance_amount) {
        invoice_payment_status = "Unpaid";
        invoice_paid_amount = 0;
        invoice_pending_amount = invoice_total_amount;
        customer_final_balance = -invoice_pending_amount;
      }
    }

    // Validate calculated fields to prevent NaN
    if (isNaN(invoice_total_amount) || isNaN(customer_final_balance)) {
      logger.error(
        `Invalid calculated values: invoice_total_amount=${invoice_total_amount}, customer_final_balance=${customer_final_balance}`
      );
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

    logger.info(`--- Wrapping all database operations in a transaction ---`);
    const result = await prisma.$transaction(async (tx) => {
      logger.info(`--- Starting transaction for purchase invoice update ---`);

      logger.info(`--- Updating purchase invoice ---`);
      const updated_purchase = await updatePurchaseInvoice(
        purchase_invoice_id,
        provider.id,
        franchise_id,
        staff_id,
        {
           provider_customer_id,
        //   bill_to,
        //   ship_to,
          invoice_number,
          invoice_type,
          invoice_status,
          invoice_date,
          is_invoice_fully_paid,
          invoice_additional_discount_percentage,
          invoice_additional_discount_amount,
          invoice_tds_percentage,
          invoice_tcs_percentage,
          apply_tcs,
          apply_tds,
          is_taxable_amount,
          is_total_amount,
          total_after_tds,
        //   invoice_shipping_charges,
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
          invoice_total_amount: Number(invoice_total_amount.toFixed(2)),
        //   invoice_discount_amount,
          invoice_gst_amount,
          invoice_tds_amount,
          invoice_tcs_amount,
          invoice_pending_amount: Number(invoice_pending_amount.toFixed(2)),
          invoice_paid_amount,
          invoice_total_tax_amount,
          invoice_total_parts_amount,
          invoice_total_parts_tax_amount,
          invoice_total_services_amount,
          invoice_total_services_tax_amount,
          invoice_total_parts_services_amount,
          invoice_total_parts_services_tax_amount,
        },
        tx
      );

      if (!updated_purchase) {
        throw new Error("Failed to update purchase");
      }
      logger.info(`--- Purchase invoice updated ---`);

      logger.info(`--- Updating customer final balance ---`);
      // For purchase invoices, DECREASE customer balance (we're paying the supplier)

      if (invoice_type !== "Purchase_Order") {
        const balance_difference =
          customer_final_balance -
          existing_purchase_invoice.invoice_pending_amount;
        const update_customer_final_balance =
          await updateProviderCustomerFinalBalance(
            provider_customer_id,
            provider.id,
            franchise_id,
            balance_difference,
            tx
          );
        if (!update_customer_final_balance) {
          throw new Error("Failed to update customer final balance");
        }
      }

      logger.info(`--- Customer final balance updated ---`);

      const invoice_provider_data = await createPurchaseInvoiceParty(
        updated_purchase.id,
        {
          purchase_invoice_id: updated_purchase.id,
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

     logger.info(`--- Creating bill to ---`);
      const bill_to_created = await createPurchaseInvoiceParty(
        updated_purchase.id,
        {
          purchase_invoice_id: updated_purchase.id,
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
        updated_purchase.id,
        {
          purchase_invoice_id: updated_purchase.id,
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

//done upto here

logger.info(`--- Creating parts ---`);
      for (const part of processed_parts) {
        logger.info(`--- Creating part ---`);
        await createPurchaseParts(
          updated_purchase.id,
          {
            ...part,
            purchase_invoice_id: updated_purchase.id,
          },
          tx
        );

        // if(invoice_type !== "Purchase_Order" && invoice_type === "Purchase"){
        //       await updateFranchiseInventory(

        //   part.franchise_inventory_id,
        //    provider.id,
        //    franchise_id,
        //   part.part_quantity,
        //   tx
        // );
        // }
        // if(invoice_type !== "Purchase_Order" && (invoice_type === "Purchase_Return" || invoice_type === "Debit_Note")){
        //       await updateFranchiseInventory(
        //   part.franchise_inventory_id,
        //   provider.id,
        //   franchise_id,
        //   -part.part_quantity,
        //   tx
        // );
        // }
        await updateFranchiseInventory(
          part.franchise_inventory_id,
          provider.id,
          franchise_id,
          part.part_quantity,
          tx
        );

        await createFranchiseInventoryTransaction(
          provider.id,updated_purchase.id,{
          franchise_inventory_id: part.franchise_inventory_id,
          franchise_id: franchise_id,
          provider_id: provider.id,
          quantity:  part.part_quantity,
          action: "add",
          stock_changed_by: "invoice",
          closing_stock : franchise_inventory_product_quantity + part.part_quantity
        },
        tx
        );
      
      }

      // Create services
      for (const service of processed_services) {
        logger.info(`--- Creating service ---`);
        await createPurchaseServices(
          updated_purchase.id,
          {
            ...service,
            purchase_invoice_id: updated_purchase.id,
          },
          tx
        );
      }

      // Create additional charges
      logger.info(`--- Creating additional charges ---`);
      for (const charge of processed_additional_charges) {
        logger.info(`--- Creating additional charge ---`);
        await createPurchaseAdditionalCharges(
          updated_purchase.id,
          {
            ...charge,
            purchase_invoice_id: updated_purchase.id,
          },
          tx
        );
      }

       // Create transactions if needed
      if (is_invoice_fully_paid === true) {
        await createPurchaseInvoiceTransactions(
          updated_purchase.id,
          {
            invoice_type: invoice_type,
            amount: invoice_total_amount,
            total_amount: invoice_total_amount,
            pending_amount: 0,
            paid_amount: invoice_paid_amount,
            transaction_type: advance_payment_type,
            transaction_status: "Paid",
            transaction_id: advance_amount_online_transaction_id || "",
          },
          tx
        );

        await createTransactions(
          updated_purchase.id,
          {
            provider_id: provider.id,
            provider_customer_id: provider_customer_id,
            invoice_type: invoice_type,
            amount: invoice_total_amount,
            transaction_type: advance_payment_type,
            transaction_status: "Paid",
            transaction_id: advance_amount_online_transaction_id || "",
          },
          tx
        );
      } else if (invoice_advance_amount > 0 && is_invoice_fully_paid === false) {
        await createPurchaseInvoiceTransactions(
          updated_purchase.id,
          {
            invoice_type: invoice_type,
            amount: invoice_advance_amount,
            total_amount: Number(invoice_total_amount.toFixed(2)),
            pending_amount: Number(invoice_pending_amount.toFixed(2)),
            paid_amount: invoice_paid_amount,
            transaction_type: advance_payment_type,
            transaction_status: "Partially_Paid",
            transaction_id: advance_amount_online_transaction_id || "",
          },
          tx
        );

        await createTransactions(
          updated_purchase.id,
          {
            provider_id: provider.id,
            provider_customer_id: provider_customer_id,
            invoice_type: invoice_type,
            amount: invoice_total_amount,
            money_out : invoice_advance_amount,
            transaction_type: advance_payment_type,
            transaction_status: "Partially_Paid",
            transaction_id: advance_amount_online_transaction_id || "",
          },
          tx
        );
      }

     
      logger.info(`--- Transaction completed successfully ---`);
      return updated_purchase;
    });

    return returnResponse(
      res,
      StatusCodes.OK,
      "Purchase updated successfully",
      result
    );
  } catch (error) {
    logger.error(`Error in updatePurchaseInvoiceEndpoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in updatePurchaseInvoiceEndpoint: ${error.message}`
    );
  } finally {
    await prisma.$disconnect();
  }
};

export { updatePurchaseEndpoint };
