import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import {
  getProviderByUserId,
  getPurchaseReturnById,
  getFranchiseInventoryById,
  updatePurchaseReturn,
  updateProviderCustomerFinalBalance,
  createPurchaseParts,
  updateFranchiseInventory,
  createPurchaseServices,
  createPurchaseInvoiceParty,
  clearPurchaseReturn,
  getPurchaseReturnTransactions,
  restoreFranchiseInventory,
  createPurchaseAdditionalCharges,
  getAllDataPurchaseInvoiceById,
  getAllDataPurchaseInvoiceById1,
  updateUrl
} from "./query.js";
import { PrismaClient } from "@prisma/client";
import { pdfGenerator } from "../../../InvoiceSettings/pdfGenerator.js";
import { uploadPdfToS3 } from "../../../../services/upload.js";

const prisma = new PrismaClient();

const updatePurchaseReturnEndpoint = async (req, res) => {
  try {
    logger.info(`updatePurchaseReturnEndpoint`);

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
    const purchase_invoice_id = req.params.purchase_invoice_id;

    logger.info(
      `--- Fetching purchase return details for purchase_invoice_id: ${purchase_invoice_id} ---`
    );
    const existing_purchase_return = await getPurchaseReturnById(
      purchase_invoice_id
    );
    if (!existing_purchase_return) {
      logger.error(
        `--- Purchase return not found for purchase_invoice_id: ${purchase_invoice_id} ---`
      );
      return returnError(
        res,
        StatusCodes.NOT_FOUND,
        `Purchase return not found`
      );
    }
    logger.info(
      `--- Purchase return found for purchase_invoice_id: ${purchase_invoice_id} ---`
    );

    logger.info(
      `--- Fetching purchase return transactions for purchase_invoice_id: ${purchase_invoice_id} ---`
    );
    const existing_transactions = await getPurchaseReturnTransactions(
      purchase_invoice_id
    );
    if (!existing_transactions) {
      logger.error(
        `--- Purchase return transactions not found for purchase_invoice_id: ${purchase_invoice_id} ---`
      );
      return returnError(
        res,
        StatusCodes.NOT_FOUND,
        `Purchase return transactions not found`
      );
    }
    logger.info(
      `--- Purchase return transactions found for purchase_invoice_id: ${purchase_invoice_id} ---`
    );

    const existing_paid_amount = existing_transactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );
    logger.info(`--- Existing paid amount: ${existing_paid_amount} ---`);

    const old_parts = existing_purchase_return.PurchasePart || [];
    logger.info(`--- Old parts: ${JSON.stringify(old_parts)} ---`);

    logger.info(`--- Restoring franchise inventory for old parts ---`);
    for (const old_part of old_parts) {
      // For purchase returns, we need to INCREASE inventory (restore what was returned)
      await restoreFranchiseInventory(
        old_part.franchise_inventory_id,
        old_part.part_quantity
      );
    }

    logger.info(
      `--- Clearing purchase return for purchase_invoice_id: ${purchase_invoice_id} ---`
    );
    await clearPurchaseReturn(purchase_invoice_id);
    logger.info(
      `--- Purchase return cleared for purchase_invoice_id: ${purchase_invoice_id} ---`
    );

    logger.info(`--- Fetching data from request body ---`);
    let {
      provider_customer_id,
      //   franchise_id,
      bill_to,
      ship_to,
      // original_invoice_number,
      invoice_type = "Purchase_Return",
      invoice_status = "New",
      invoice_date,
      is_invoice_fully_paid,
      invoice_additional_discount_percentage,
      invoice_additional_discount_amount,
      invoice_tds_percentage,
      invoice_tcs_percentage,
      invoice_tds_amount,
      invoice_tcs_amount,
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
      PurchaseParts,
      PurchaseServices,
      PurchaseAdditionalCharges,
      link_to,
      apply_tcs,
      apply_tds,
    } = data;

    logger.info(`--- Processing data from request body ---`);
    let invoice_total_amount = 0;
    let invoice_discount_amount = 0;
    let invoice_gst_amount = 0;
    let invoice_pending_amount = 0;
    let invoice_paid_amount = 0;
    let invoice_total_tax_amount = 0;
    let invoice_total_parts_amount = 0;
    let invoice_total_parts_tax_amount = 0;
    let invoice_total_services_amount = 0;
    let invoice_total_services_tax_amount = 0;
    let invoice_total_parts_services_amount = 0;
    let invoice_total_parts_services_tax_amount = 0;

    let processed_parts = [];
    logger.info(`--- Processing parts ---`);
    for (const part of PurchaseParts) {
      let {
        franchise_inventory_id,
        part_name,
        part_hsn_code,
        part_description,
        part_quantity = part.part_quantity ? part.part_quantity : 1,
        part_discount_percentage = part.part_discount_percentage
          ? part.part_discount_percentage
          : 0,
        part_discount_amount = part.part_discount_amount
          ? part.part_discount_amount
          : 0,
        part_mesuring_unit,
        part_gst_percentage = part.part_gst_percentage
          ? part.part_gst_percentage
          : 0,
        part_gst_amount,
        part_total_price,
        rateType,
        originalRate,
        originalGst,
        part_purchase_price
      } = part;

      logger.info(
        `--- Fetching franchise inventory for part: ${part.franchise_inventory_id} ---`
      );
      const franchiseInventory = await getFranchiseInventoryById(
        part.franchise_inventory_id
      );
      if (!franchiseInventory) {
        logger.error(
          `--- Franchise inventory not found for part: ${part.franchise_inventory_id} ---`
        );
        return returnError(
          res,
          StatusCodes.BAD_REQUEST,
          `Franchise inventory not found`
        );
      }
      logger.info(
        `--- Franchise inventory found for part: ${part.franchise_inventory_id} ---`
      );

      logger.info(`--- Processing part discount ---`);
      if (part_discount_percentage && !part_discount_amount) {
        part_discount_amount =
          (part_purchase_price * part_discount_percentage) / 100;
      } else if (!part_discount_percentage && part_discount_amount) {
        part_discount_percentage =
          (part_discount_amount / part_purchase_price) * 100;
      } else {
        part_discount_percentage = 0;
        part_discount_amount = 0;
      }

      logger.info(`--- Calculating part GST amount ---`);
      // let part_gst_amount =
      //   (part_purchase_price * part_quantity -
      //     part_discount_amount * part_quantity) *
      //   (part_gst_percentage / 100);
      // let part_total_price =
      //   part_purchase_price * part_quantity -
      //   part_discount_amount * part_quantity +
      //   part_gst_amount;

      logger.info(`--- Calculating part total price ---`);
      invoice_total_amount += part_total_price;
      invoice_discount_amount += part_discount_amount;
      invoice_gst_amount += part_gst_amount;
      invoice_total_tax_amount += part_gst_amount;
      invoice_total_parts_amount += part_purchase_price * part_quantity;
      invoice_total_parts_tax_amount += part_gst_amount;
      invoice_total_parts_services_amount += part_purchase_price * part_quantity;
      invoice_total_parts_services_tax_amount += part_gst_amount;

      logger.info(`--- Adding part to processed parts ---`);
      processed_parts.push({
        franchise_inventory_id,
        part_name,
        part_hsn_code,
        part_description,
        part_purchase_price,
        part_quantity,
        part_discount_percentage,
        part_discount_amount,
        part_mesuring_unit,
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
    for (const service of PurchaseServices) {
      let {
        franchise_service_id,
        service_name,
        service_description,
        service_discount_percentage = service.service_discount_percentage
          ? service.service_discount_percentage
          : 0,
        service_discount_amount = service.service_discount_amount
          ? service.service_discount_amount
          : 0,
        service_price,
        service_gst_percentage = service.service_gst_percentage
          ? service.service_gst_percentage
          : 0,
        service_gst_amount,
        service_total_price,
        rateType,
        originalRate,
        originalGst
      } = service;

      logger.info(`--- Processing service discount ---`);
      if (service_discount_percentage && !service_discount_amount) {
        service_discount_amount =
          (service_price * service_discount_percentage) / 100;
      } else if (!service_discount_percentage && service_discount_amount) {
        service_discount_percentage =
          (service_discount_amount / service_price) * 100;
      } else {
        service_discount_percentage = 0;
        service_discount_amount = 0;
      }

      logger.info(`--- Calculating service GST amount ---`);
      // let service_gst_amount =
      //   (service_price - service_discount_amount) *
      //   (service_gst_percentage / 100);
      // let service_total_price =
      //   service_price - service_discount_amount + service_gst_amount;

      logger.info(`--- Calculating service total price ---`);
      invoice_total_amount += service_total_price;
      invoice_discount_amount += service_discount_amount;
      invoice_gst_amount += service_gst_amount;
      invoice_total_tax_amount += service_gst_amount;
      invoice_total_services_amount += service_price;
      invoice_total_services_tax_amount += service_gst_amount;
      invoice_total_parts_services_amount += service_price;
      invoice_total_parts_services_tax_amount += service_gst_amount;

      logger.info(`--- Adding service to processed services ---`);
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
    for (const charge of PurchaseAdditionalCharges) {
      let { name, amount, gst_percentage } = charge;
      logger.info(`--- Calculating additional charge GST amount ---`);
      let gst_amount = (amount * gst_percentage) / 100;
      let total_amount = amount + gst_amount;
      invoice_total_amount += total_amount;
      invoice_gst_amount += gst_amount;
      invoice_total_tax_amount += gst_amount;
      processed_additional_charges.push({
        name,
        amount,
        gst_percentage,
        gst_amount,
        total_amount,
      });
    }

    // logger.info(`--- Processing additional discount ---`);
    // if (
    //   invoice_additional_discount_percentage &&
    //   !invoice_additional_discount_amount
    // ) {
    //   invoice_additional_discount_amount =
    //     invoice_total_parts_services_amount *
    //     (invoice_additional_discount_percentage / 100);
    // } else if (
    //   !invoice_additional_discount_percentage &&
    //   invoice_additional_discount_amount
    // ) {
    //   invoice_additional_discount_percentage =
    //     (invoice_additional_discount_amount /
    //       invoice_total_parts_services_amount) *
    //     100;
    // } else {
    //   invoice_additional_discount_percentage = 0;
    //   invoice_additional_discount_amount = 0;
    // }

    // // Apply additional discount
    // invoice_total_amount =
    //   invoice_total_parts_services_amount +
    //   invoice_total_parts_services_tax_amount -
    //   invoice_additional_discount_amount;

    if (
      invoice_additional_discount_amount
    ) {
      invoice_additional_discount_percentage =
        invoice_total_amount> 0
          ? (invoice_additional_discount_amount /
              invoice_total_amount) *
            100
          : 0;
    }

    console.log("invoice_additional_discount_amount", invoice_additional_discount_amount);
    console.log("invoice_additional_discount_percentage", invoice_additional_discount_percentage);
    
    
    invoice_total_amount = invoice_total_amount - invoice_additional_discount_amount;

      console.log("invoice_total_amount", invoice_total_amount);

    logger.info(`--- Processing shipping charges ---`);
    if (invoice_shipping_charges) {
      invoice_total_amount += invoice_shipping_charges;
    }

    logger.info(`--- Processing TDS percentage ---`);
    if (invoice_tds_percentage) {
      invoice_tds_amount =
        invoice_total_amount * (invoice_tds_percentage / 100);
      invoice_total_tax_amount += invoice_tds_amount;
    }

    logger.info(`--- Processing TCS percentage ---`);
    if (invoice_tcs_percentage) {
      invoice_tcs_amount =
        invoice_total_amount * (invoice_tcs_percentage / 100);
      invoice_total_amount += invoice_tcs_amount;
      invoice_total_tax_amount += invoice_tcs_amount;
    }

    logger.info(`--- Processing auto round off ---`);
    if (is_auto_round_off === true) {
      auto_round_off_amount =
        invoice_total_amount - Math.round(invoice_total_amount);
      invoice_total_amount = Math.round(invoice_total_amount);
    } else if (
      is_auto_round_off === false &&
      auto_round_off_amount !== undefined &&
      auto_round_off_amount !== 0
    ) {
      invoice_total_amount += auto_round_off_amount;
    }

    logger.info(`--- Processing invoice fully paid ---`);
    let customer_final_balance = 0;
    if (is_invoice_fully_paid === true) {
      invoice_payment_status = "Paid";
      // invoice_status = "Fully_Paid";
      invoice_paid_amount = invoice_total_amount;
      invoice_pending_amount = 0;
      customer_final_balance = -invoice_total_amount; // For purchase return, this is the amount to be returned to supplier (negative because we're getting money back)
    } else if (is_invoice_fully_paid === false && invoice_advance_amount) {
      invoice_payment_status = "Partially_Paid";
      invoice_paid_amount = invoice_advance_amount;
      invoice_pending_amount = invoice_total_amount - invoice_paid_amount;
      customer_final_balance = -invoice_pending_amount;
    } else {
      invoice_payment_status = "Unpaid";
      invoice_paid_amount = 0;
      invoice_pending_amount = invoice_total_amount;
      customer_final_balance = -invoice_pending_amount;
    }

    logger.info(`--- Wrapping all database operations in a transaction ---`);
    const result = await prisma.$transaction(async (tx) => {
      logger.info(`--- Starting transaction for purchase return update ---`);

      logger.info(`--- Updating purchase return ---`);
      const updated_purchase_return = await updatePurchaseReturn(
        purchase_invoice_id,
        staff_id,
        franchise_id,
        {
          provider_customer_id,
          //   franchise_id,
          // original_invoice_number,
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
          invoice_total_amount,
          invoice_discount_amount,
          invoice_gst_amount,
          invoice_tds_amount,
          invoice_tcs_amount,
          invoice_pending_amount,
          invoice_paid_amount,
          invoice_total_tax_amount,
          invoice_total_parts_amount,
          invoice_total_parts_tax_amount,
          invoice_total_services_amount,
          invoice_total_services_tax_amount,
          invoice_total_parts_services_amount,
          invoice_total_parts_services_tax_amount,
          link_to,
          apply_tds,
          apply_tcs
        },
        tx
      );

      if (!updated_purchase_return) {
        throw new Error("Failed to update purchase return");
      }
      logger.info(`--- Purchase return updated ---`);

      logger.info(`--- Updating customer final balance ---`);
      const balance_difference =
        customer_final_balance -
        existing_purchase_return.invoice_pending_amount;
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

      logger.info(`--- Creating purchase return party ---`);
      const invoice_provider_data = await createPurchaseInvoiceParty(
        purchase_invoice_id,
        {
          purchase_invoice_id: purchase_invoice_id,
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
        throw new Error("Failed to create purchase return party");
      }
      logger.info(`--- Purchase return party created ---`);

      logger.info(`--- Creating bill to ---`);
      const bill_to_created = await createPurchaseInvoiceParty(
        purchase_invoice_id,
        {
          purchase_invoice_id: purchase_invoice_id,
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
      const ship_to_created = await createPurchaseInvoiceParty(
        purchase_invoice_id,
        {
          purchase_invoice_id: purchase_invoice_id,
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

      logger.info(`--- Creating parts ---`);
      for (const part of processed_parts) {
        logger.info(`--- Creating part ---`);
        await createPurchaseParts(
          purchase_invoice_id,
          {
            ...part,
            purchase_invoice_id: purchase_invoice_id,
          },
          tx
        );

        // For purchase returns, DECREASE inventory quantity (we're returning items)
        await updateFranchiseInventory(
          part.franchise_inventory_id,
          -part.part_quantity,
          tx
        );
      }

      for (const service of processed_services) {
        logger.info(`--- Creating service ---`);
        await createPurchaseServices(
          purchase_invoice_id,
          {
            ...service,
            purchase_invoice_id: purchase_invoice_id,
          },
          tx
        );
      }

      logger.info(`--- Creating additional charges ---`);

      for (const charge of processed_additional_charges) {
        logger.info(`--- Creating additional charge ---`);
        await createPurchaseAdditionalCharges(
          purchase_invoice_id,
          {
            ...charge,
            purchase_invoice_id: purchase_invoice_id,
          },
          tx
        );
      }

      logger.info(`--- Transaction completed successfully ---`);

      return updated_purchase_return;
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
    if(link_to){
      const purchaseInvoiceId1 = link_to;
    const purchaseInvoice1 = await getAllDataPurchaseInvoiceById1(purchaseInvoiceId1,result.id);
    if (!purchaseInvoice1) {
        return returnError(res, StatusCodes.NOT_FOUND, "Purchase invoice not found");
    }
    console.log("purchaseInvoice: ", purchaseInvoice1);
      const plainInvoice1 = JSON.parse(JSON.stringify(purchaseInvoice1));
      console.log("plainInvoice: ", plainInvoice1);

      const pdfBuffer1 = await pdfGenerator(provider.id, plainInvoice1, "Purchase");

      const fileName1 = `invoice_${purchaseInvoiceId1}_provider_${franchise_id}`;
      const s3Url1 = await uploadPdfToS3(pdfBuffer1, fileName1, 'invoices');
      logger.info(`Invoice uploaded to S3: ${s3Url1}`);

      const updated_invoice1 = await updateUrl(purchaseInvoiceId1, s3Url1);
  }

    logger.info(`--- Transaction completed successfully ---`);
    return returnResponse(
      res,
      StatusCodes.OK,
      "Purchase return updated successfully",
      result
    );
  } catch (error) {
    logger.error(`Error in updatePurchaseReturnEndpoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in updatePurchaseReturnEndpoint: ${error.message}`
    );
  } finally {
    await prisma.$disconnect();
  }
};

export { updatePurchaseReturnEndpoint };
