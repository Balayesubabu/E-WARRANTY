import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import {
  getProviderByUserId,
  getSalesInvoiceById,
  getFranchiseInventoryById,
  updateSalesInvoice,
  updateProviderCustomerFinalBalance,
  createSalesParts,
  updateFranchiseInventory,
  createSalesServices,
  createSalesInvoiceParty,
  clearSalesInvoice,
  getSalesInvoiceTransactions,
  restoreFranchiseInventory,
  createSalesAdditionalCharges,
  updateFranchiseOpenInventoryTransaction,
  createTransactions,
  updateBookingTransaction,
  createFranchiseInventoryTransaction,
  getAllDataSalesInvoiceById,
  updateUrl
} from "./query.js";
import { PrismaClient } from "@prisma/client";
import { pdfGenerator } from "../../../InvoiceSettings/pdfGenerator.js";
import { uploadPdfToS3 } from "../../../../services/upload.js";

const prisma = new PrismaClient();

const updateSalesInvoiceEndpoint = async (req, res) => {
  try {
    logger.info(`updateSalesInvoiceEndpoint`);

    let user_id;
    let staff_id;
    if (req.type == 'staff') {
      user_id = req.user_id;
      staff_id = req.staff_id;
    }
    if (req.type == 'provider') {
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
    const sales_invoice_id = req.params.sales_invoice_id;

    logger.info(
      `--- Fetching sales invoice details for sales_invoice_id: ${sales_invoice_id} ---`
    );
    const existing_sales_invoice = await getSalesInvoiceById(sales_invoice_id);
    if (!existing_sales_invoice) {
      logger.error(
        `--- Sales invoice not found for sales_invoice_id: ${sales_invoice_id} ---`
      );
      return returnError(res, StatusCodes.NOT_FOUND, `Sales invoice not found`);
    }
    logger.info(
      `--- Sales invoice found for sales_invoice_id: ${sales_invoice_id} ---`
    );

    logger.info(
      `--- Fetching sales invoice transactions for sales_invoice_id: ${sales_invoice_id} ---`
    );
    const existing_transactions = await getSalesInvoiceTransactions(
      sales_invoice_id
    );
    if (!existing_transactions) {
      logger.error(
        `--- Sales invoice transactions not found for sales_invoice_id: ${sales_invoice_id} ---`
      );
      return returnError(
        res,
        StatusCodes.NOT_FOUND,
        `Sales invoice transactions not found`
      );
    }
    logger.info(
      `--- Sales invoice transactions found for sales_invoice_id: ${sales_invoice_id} ---`
    );

    const existing_paid_amount = existing_transactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );
    logger.info(`--- Existing paid amount: ${existing_paid_amount} ---`);

    const old_parts = existing_sales_invoice.SalesPart || [];
    logger.info(`--- Old parts: ${JSON.stringify(old_parts)} ---`);

    logger.info(`--- Restoring franchise inventory for old parts ---`);
    for (const old_part of old_parts) {
      await restoreFranchiseInventory(
        old_part.franchise_inventory_id,
        old_part.part_quantity
      );
    }

    logger.info(
      `--- Clearing sales invoice for sales_invoice_id: ${sales_invoice_id} ---`
    );
    await clearSalesInvoice(sales_invoice_id);
    logger.info(
      `--- Sales invoice cleared for sales_invoice_id: ${sales_invoice_id} ---`
    );


    const transaction_id = existing_sales_invoice?.Transaction?.[0]?.id || null;

    console.log("Transaction ID:", transaction_id);
    logger.info(`--- Fetching data from request body ---`);
    let {
      provider_customer_id,
      prefix,
      sequence_number,
      // franchise_id,
      bill_to,
      ship_to,
      original_invoice_number,
      invoice_type = "Sales",
      invoice_status = "New",
      invoice_date,
      is_invoice_fully_paid,
      invoice_additional_discount_percentage,
      invoice_additional_discount_amount,
      invoice_tds_percentage,
      invoice_tcs_percentage,
      invoice_tcs_amount = 0,
      invoice_tds_amount = 0,
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
      SalesParts = [],
      SalesServices = [],
      SalesAdditionalCharges = [],
      apply_tcs,
      apply_tds,
      is_total_amount,
      is_taxable_amount,
      bank_id,
      booking_id
    } = data;

    // Initialize totals
    let invoice_total_amount = 0;
    let total_amount_payable = 0;
    let invoice_discount_amount = 0;
    let invoice_gst_amount = 0;
    let invoice_pending_amount = 0;
    let invoice_paid_amount = 0;
    let invoice_total_tax_amount = 0;
    let customer_final_balance = 0;
    let taxable_amount = 0;


    let subtotal_parts_services = 0;


    let invoice_total_parts_amount = 0
    let invoice_total_parts_tax_amount = 0
    let invoice_total_services_amount = 0
    let invoice_total_services_tax_amount = 0
    let invoice_total_parts_services_amount = 0
    let invoice_total_parts_services_tax_amount = 0


    let franchise_inventory_product_quantity = 0;
    let processed_parts = [];
    for (const part of SalesParts) {
      let {
        franchise_inventory_id,
        part_name,
        part_hsn_code,
        part_description,
        part_selling_price,
        part_quantity = 1,
        part_discount_amount = 0,
        part_discount_percentage = 0,
        part_mesuring_unit,
        part_gst_percentage = 0,
        part_gst_amount,
        part_total_price,
        rateType,
        originalRate,
        originalGst
      } = part;

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

      console.log(`invoice total abcd: ${invoice_total_amount}`)
      console.log(`part_selling_price: ${part_selling_price}`);

      const part_amount = part_selling_price * part_quantity;
      console.log(`part_amount: ${part_amount}`);

      const part_after_discount = part_amount - part_discount_amount;
      console.log(`part_after_discount: ${part_after_discount}`);

      // const part_gst_amount = part_after_discount * (part_gst_percentage / 100);
      // console.log(`part_gst_amount: ${part_gst_amount}`);

      // const part_total_price = part_after_discount + part_gst_amount;
      // console.log(`part_total_price: ${part_total_price}`);

      invoice_total_parts_amount += part_total_price;
      console.log(`invoice_total_parts_amount: ${invoice_total_parts_amount}`);

      invoice_total_parts_tax_amount += part_gst_amount;
      console.log(`invoice_total_parts_tax_amount: ${invoice_total_parts_tax_amount}`);

      invoice_total_parts_services_amount += part_total_price;
      console.log(`invoice_total_parts_services_amount: ${invoice_total_parts_services_amount}`);

      invoice_total_parts_services_tax_amount += part_gst_amount;
      console.log(`invoice_total_parts_services_tax_amount: ${invoice_total_parts_services_tax_amount}`);

      invoice_discount_amount += part_discount_amount;
      console.log(`invoice_discount_amount: ${invoice_discount_amount}`)





      processed_parts.push({
        franchise_inventory_id,
        part_name,
        part_hsn_code,
        part_description,
        part_selling_price,
        part_quantity,
        part_discount_amount,
        part_discount_percentage,
        part_mesuring_unit,
        part_gst_percentage,
        part_gst_amount,
        part_total_price,
        rateType,
        originalRate,
        originalGst
      });
    }

    invoice_total_amount += invoice_total_parts_amount;
    invoice_total_tax_amount += invoice_total_parts_tax_amount;
    console.log(`invoice_total_tax_amount after parts: ${invoice_total_tax_amount}`)

    console.log(`invoice_total_amount after parts: ${invoice_total_amount}`)

    let processed_services = [];
    for (const service of SalesServices) {
      let {
        franchise_service_id,
        service_name,
        service_sac_number,
        service_description,
        service_price,
        service_discount_amount = 0,
        service_discount_percentage = 0,
        service_gst_percentage = 0,
        rateType,
        service_gst_amount,
        service_total_price,
        originalRate,
        originalGst,
        products_list = []
      } = service;


      console.log(`service_price: ${service_price}`);

      const service_amount = service_price; // No quantity multiplication needed since it's always 1
      console.log(`service_amount: ${service_amount}`);

      const service_after_discount = service_amount - service_discount_amount;
      console.log(`service_after_discount: ${service_after_discount}`);

      // const service_gst_amount = service_after_discount * (service_gst_percentage / 100);
      // console.log(`service_gst_amount: ${service_gst_amount}`);

      // const service_total_price = service_after_discount + service_gst_amount;
      // console.log(`service_total_price: ${service_total_price}`);

      invoice_total_services_amount += service_total_price;
      console.log(`invoice_total_services_amount: ${invoice_total_services_amount}`);

      invoice_total_services_tax_amount += service_gst_amount;
      console.log(`invoice_total_services_tax_amount: ${invoice_total_services_tax_amount}`);

      invoice_total_parts_services_amount += service_total_price;
      console.log(`invoice_total_parts_services_amount: ${invoice_total_parts_services_amount}`);

      invoice_total_parts_services_tax_amount += service_gst_amount;
      console.log(`invoice_total_parts_services_tax_amount: ${invoice_total_parts_services_tax_amount}`);

      invoice_discount_amount += service_discount_amount;
      console.log(`invoice_discount_amount: ${invoice_discount_amount}`)

      processed_services.push({
        franchise_service_id,
        service_name,
        service_sac_number,
        service_description,
        service_price,
        service_discount_amount,
        service_discount_percentage,
        service_gst_percentage,
        service_gst_amount,
        service_total_price,
        rateType,
        originalRate,
        originalGst,
        products_list: Array.isArray(products_list) ? products_list : []
      });
    }

    invoice_total_amount += invoice_total_services_amount;
    invoice_total_tax_amount += invoice_total_services_tax_amount;
    console.log(`invoice_total_tax_amount after services: ${invoice_total_tax_amount}`)

    console.log(`invoice_total_amount after services: ${invoice_total_amount}`)

    let additional_charges_amount = 0
    let processed_additional_charges = [];

    for (const charge of SalesAdditionalCharges) {
      let { name, amount, gst_percentage = 0 } = charge;

      const gst_amount = amount * (gst_percentage / 100);
      console.log(`gst_amount: ${gst_amount}`);

      const total_amount = amount + gst_amount;
      console.log(`total_amount: ${total_amount}`);

      invoice_gst_amount += gst_amount;
      console.log(`invoice_gst_amount: ${invoice_gst_amount}`);

      // ✅ push inside loop
      processed_additional_charges.push({
        name,
        amount,
        gst_percentage,
        gst_amount,
        total_amount,
      });

      additional_charges_amount += total_amount;
      // ✅ update totals inside loop
      invoice_total_amount += total_amount;
      console.log(`invoice_total_amount after additional charges: ${invoice_total_amount}`);

      invoice_total_tax_amount += gst_amount;
      console.log(`invoice_total_tax_amount after additional charges: ${invoice_total_tax_amount}`);
    }


    // if (
    //   invoice_additional_discount_percentage &&
    //   !invoice_additional_discount_amount
    // ) {
    //   invoice_additional_discount_amount =
    //     invoice_total_amount *
    //     (invoice_additional_discount_percentage / 100);
    // } else if (
    //   !invoice_additional_discount_percentage &&
    //   invoice_additional_discount_amount
    // ) {
    //   invoice_additional_discount_percentage =
    //     (invoice_additional_discount_amount / invoice_total_amount) * 100

    // } else {
    //   invoice_additional_discount_amount = 0;
    //   invoice_additional_discount_percentage = 0;
    // }



    // invoice_additional_discount_percentage = Number(invoice_additional_discount_percentage.toFixed(2));
    // console.log(`invoice_additional_discount_amount: ${invoice_additional_discount_amount}`)
    invoice_total_amount -= invoice_additional_discount_amount;
    invoice_discount_amount += invoice_additional_discount_amount;


    console.log(`invoice_total_amount after additional discount: ${invoice_total_amount}`)

    // --- Apply TCS ---
    logger.info(`Invoice total amount before: ${invoice_total_amount}`);
    logger.info(`tcs percentage: ${invoice_tcs_percentage}`);
    logger.info(`invoice discount amount: ${invoice_discount_amount}`);
    // TCS
    // if (invoice_tcs_percentage) {
    //   if (is_total_amount) {
    //     invoice_tcs_amount =
    //       (invoice_total_amount) *
    //       (invoice_tcs_percentage / 100);
    //     invoice_total_amount += invoice_tcs_amount;
    //     // invoice_total_tax_amount += invoice_tcs_amount;
    //   }
    //   if (is_taxable_amount) {
    //     // invoice_tcs_amount = invoice_total_parts_services_amount * (invoice_tcs_percentage / 100);
    //     // invoice_total_tax_amount += invoice_tcs_amount;
    //     invoice_tcs_amount = (invoice_total_parts_services_amount - invoice_total_parts_services_tax_amount - invoice_discount_amount) * (invoice_tcs_percentage / 100);
    //     console.log("invoice_tcs_amount", invoice_tcs_amount)
    //     logger.info(`Calculated invoice_tcs_amount: ${invoice_tcs_amount}`);
    //     invoice_total_amount = invoice_total_parts_services_amount + additional_charges_amount + invoice_tcs_amount
    //       - invoice_additional_discount_amount
    //   }

    // }

    if (apply_tcs === true) {
      if (is_total_amount && invoice_tcs_percentage) {
        invoice_total_amount += invoice_tcs_amount;
        invoice_total_tax_amount += invoice_tcs_amount;
      } else if (is_taxable_amount && invoice_tcs_percentage) {
        invoice_total_amount += invoice_tcs_amount;
        invoice_total_tax_amount += invoice_tcs_amount;
      }
    }

    if (apply_tds === true) {
      invoice_total_tax_amount += invoice_tds_amount;
      invoice_total_amount -= invoice_tds_amount;
    }

    logger.info(`Invoice total amount after: ${invoice_total_amount}`);
    console.log("Calculated invoice_tcs_amount:", invoice_tcs_amount, {
      invoice_total_amount,
      invoice_discount_amount,
      invoice_tcs_percentage,
    });
    // Auto round off
    if (is_auto_round_off) {
      auto_round_off_amount =
        invoice_total_amount - Math.round(invoice_total_amount);
      invoice_total_amount = Math.round(invoice_total_amount);
    } else if (auto_round_off_amount) {
      invoice_total_amount += auto_round_off_amount;
    }


    // --- Invoice Payment Status ---
    logger.info(`--- Processing invoice fully paid ---`);
    // let customer_final_balance = 0;
    if (is_invoice_fully_paid) {
      invoice_payment_status = "Paid";
      invoice_paid_amount = invoice_total_amount;
      invoice_pending_amount = 0;
      customer_final_balance = 0;
    } else if (invoice_advance_amount && invoice_advance_amount > 0) {
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

    total_amount_payable = invoice_pending_amount

    logger.info(`--- Wrapping all database operations in a transaction ---`);
    const result = await prisma.$transaction(async (tx) => {
      logger.info(`--- Starting transaction for sales invoice update ---`);

      logger.info(`--- Updating sales invoice ---`);
      const updated_sales_invoice = await updateSalesInvoice(
        sales_invoice_id, staff_id, provider.id,
        {
          provider_customer_id,
          franchise_id,
          bill_to,
          ship_to,
          original_invoice_number,
          prefix,
          sequence_number,
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
          invoice_total_amount: Number(invoice_total_amount.toFixed(2)),
          total_amount_payable,
          invoice_discount_amount,
          invoice_gst_amount: invoice_total_tax_amount,
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
          apply_tcs,
          apply_tds,
          is_total_amount,
          is_taxable_amount,
          bank_id: bank_id ? bank_id : existing_sales_invoice.bank_id,
        },
        tx
      );

      if (!updated_sales_invoice) {
        throw new Error("Failed to update sales invoice");
      }
      logger.info(`--- Sales invoice updated ---`);

      logger.info(`--- Updating customer final balance ---`);
      const balance_difference =
        customer_final_balance - existing_sales_invoice.invoice_pending_amount;
      const update_customer_final_balance =
        await updateProviderCustomerFinalBalance(
          provider_customer_id,
          balance_difference,
          tx
        );
      if (!update_customer_final_balance) {
        throw new Error("Failed to update customer final balance");
      }
      logger.info(`--- Customer final balance updated ---`);

      logger.info(`--- Creating sales invoice party ---`);
      const invoice_provider_data = await createSalesInvoiceParty(
        sales_invoice_id,
        {
          sales_invoice_id: sales_invoice_id,
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
        throw new Error("Failed to create sales invoice party");
      }
      logger.info(`--- Sales invoice party created ---`);

      logger.info(`--- Creating bill to ---`);
      const bill_to_created = await createSalesInvoiceParty(
        sales_invoice_id,
        {
          sales_invoice_id: sales_invoice_id,
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

      logger.info(`--- Creating ship to ---`);
      const ship_to_created = await createSalesInvoiceParty(
        sales_invoice_id,
        {
          sales_invoice_id: sales_invoice_id,
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

      await createTransactions(
        existing_sales_invoice.id, transaction_id,
        {
          provider_id: provider.id,
          provider_customer_id,
          invoice_type: "Sales",
          amount: invoice_total_amount,
          money_in: invoice_paid_amount,
          transaction_type: advance_payment_type,
          transaction_status: "Paid",
          transaction_id: advance_amount_online_transaction_id || "",
        },
        tx
      );

      if (!ship_to_created) {
        throw new Error("Failed to create ship to");
      }
      logger.info(`--- Ship to created ---`);

      logger.info(`--- Creating parts ---`);
      for (const part of processed_parts) {
        logger.info(`--- Creating part ---`);
        await createSalesParts(
          sales_invoice_id,
          {
            ...part,
            sales_invoice_id: sales_invoice_id,
          },
          tx
        );

        logger.info(`--- Updating franchise inventory ---`);
        console.log(`quantity before update `)

        const franchiseInventory = await updateFranchiseInventory(
          part.franchise_inventory_id,
          provider.id,
          franchise_id,
          part.part_quantity,
          tx
        );
        console.log(`quantity after update ${franchiseInventory.product_quantity}`);
        await createFranchiseInventoryTransaction(
          provider.id, sales_invoice_id, {
          franchise_inventory_id: part.franchise_inventory_id,
          franchise_id: franchise_id,
          provider_id: provider.id,
          quantity: part.part_quantity,
          action: "reduce",
          stock_changed_by: "invoice",
          closing_stock: franchise_inventory_product_quantity - part.part_quantity
        },
          tx
        );
      }

      logger.info(`inventory updated`);

      logger.info(`--- Creating services ---`);
      for (const service of processed_services) {
        logger.info(`--- Creating service ---`);
        await createSalesServices(
          sales_invoice_id,
          {
            ...service,
            sales_invoice_id: sales_invoice_id,
          },
          tx
        );
      }
      console.log
      for (const service of SalesServices) {
        console.log(service)
        if (!Array.isArray(service?.products_list) || service.products_list.length === 0) {
          continue; // skip if products_list missing or empty
        }
        for (const product of service.products_list) {

          await updateFranchiseOpenInventoryTransaction(provider.id, {
            franchise_id: franchise_id,
            franchise_open_inventory_id: product.franchise_open_inventory_id,
            action: "reduce",
            stock_changed_by: "invoice",
            measurement: product.measurement,
            measurement_unit: product.measurement_unit,
          }, tx);
        }
      }

      logger.info(`--- Creating additional charges ---`);
      for (const charge of processed_additional_charges) {
        logger.info(`--- Creating additional charge ---`);
        await createSalesAdditionalCharges(
          sales_invoice_id,
          {
            ...charge,
            sales_invoice_id: sales_invoice_id,
          },
          tx
        );
      }


      console.log("updating booking transaction table")
      if (updated_sales_invoice.invoice_type === "Booking" && booking_id) {
        await updateBookingTransaction(provider.id, franchise_id, booking_id, staff_id,
          {
            total_amount: Number(invoice_total_amount.toFixed(2)),
            amount: invoice_paid_amount,
            payment_type: advance_payment_type,
            transaction_id: advance_amount_online_transaction_id,
            due_amount: Number(invoice_pending_amount.toFixed(2)),

          }, tx);
      }
      logger.info(`--- Transaction completed successfully ---`);

      return updated_sales_invoice;
    });

    const salesInvoiceId = result.id;
    const salesInvoice = await getAllDataSalesInvoiceById(salesInvoiceId);
    if (!salesInvoice) {
      return returnError(res, StatusCodes.NOT_FOUND, "Sales invoice not found");
    }
    console.log("salesInvoice: ", salesInvoice);

    const plainInvoice = JSON.parse(JSON.stringify(salesInvoice));
    console.log("plainInvoice: ", plainInvoice);

    const pdfBuffer = await pdfGenerator(provider.id, plainInvoice, "Sales");

    const fileName = `invoice_${salesInvoiceId}_provider_${franchise_id}`;
    const s3Url = await uploadPdfToS3(pdfBuffer, fileName, 'invoices');
    logger.info(`Invoice uploaded to S3: ${s3Url}`);

    const updated_invoice = await updateUrl(salesInvoiceId, s3Url);

    return returnResponse(
      res,
      StatusCodes.OK,
      "Sales invoice updated successfully",
      result
    );
  } catch (error) {
    logger.error(`Error in updateSalesInvoiceEndpoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in updateSalesInvoiceEndpoint: ${error.message}`
    );
  } finally {
    await prisma.$disconnect();
  }
};

export { updateSalesInvoiceEndpoint };