import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import {
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
} from "./query.js";
import { prisma } from "../../../../prisma/db-models.js";
import { pdfGenerator } from "../../../InvoiceSettings/pdfGenerator.js";
import { uploadPdfToS3 } from "../../../../services/upload.js";

const updatePurchaseOrderEndpoint = async (req, res) => {
  try {
    logger.info(`updatePurchaseOrderEndpoint`);

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

    const purchase_invoice_id = req.params.purchase_invoice_id;

    logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found for user_id: ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
    }
    logger.info(`--- Provider found for user_id: ${user_id} ---`);

    logger.info(
      `--- Fetching purchase order details for id: ${purchase_invoice_id} ---`
    );
    const purchase_order = await getPurchaseInvoiceById(purchase_invoice_id);
    if (!purchase_order) {
      logger.error(
        `--- Purchase order not found for id: ${purchase_invoice_id} ---`
      );
      return returnError(
        res,
        StatusCodes.NOT_FOUND,
        `Purchase order not found`
      );
    }
    logger.info(`--- Purchase order found for id: ${purchase_invoice_id} ---`);

    if (purchase_order.invoice_type !== "Purchase_Order") {
      logger.error(
        `--- Invalid invoice type: ${purchase_order.invoice_type} ---`
      );
      return returnError(res, StatusCodes.BAD_REQUEST, `Invalid invoice type`);
    }

    const data = req.body;
    let {
    //   provider_customer_id,
      // franchise_id,
      bill_to,
      ship_to,
      invoice_date,
      invoice_number,
      invoice_type,
      terms_and_conditions=[],
      additional_notes,
      due_date_terms,
      due_date,
      PurchaseParts=[],
      PurchaseServices=[],
      PurchaseAdditionalCharges=[],
    } = data;

    logger.info(`--- Processing data from request body ---`);
    let invoice_total_amount = 0;
    let invoice_gst_amount = 0;
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
        part_quantity = 1,
        part_mesuring_unit,
        part_gst_percentage = 0,
        part_gst_amount,
        part_discount_amount,
        part_discount_percentage,
        part_total_price,
        part_purchase_price,
        rateType,
        originalRate,
        originalGst
      } = part;

      logger.info(
        `--- Fetching franchise inventory for part: ${franchise_inventory_id} ---`
      );
      const franchiseInventory = await getFranchiseInventoryById(
        franchise_inventory_id
      );
      if (!franchiseInventory) {
        logger.error(
          `--- Franchise inventory not found for part: ${franchise_inventory_id} ---`
        );
        return returnError(
          res,
          StatusCodes.BAD_REQUEST,
          `Franchise inventory not found`
        );
      }
      logger.info(
        `--- Franchise inventory found for part: ${franchise_inventory_id} ---`
      );

      logger.info(`--- Calculating part GST amount ---`);
      // let part_gst_amount =
      //   part_purchase_price * part_quantity * (part_gst_percentage / 100);
      // let part_total_price =
      //   part_purchase_price * part_quantity + part_gst_amount;

      logger.info(`--- Calculating part total price ---`);
      invoice_total_amount += part_total_price;
      invoice_gst_amount += part_gst_amount;
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
        part_quantity,
        part_mesuring_unit,
        part_gst_percentage,
        part_gst_amount,
        part_discount_amount,
        part_discount_percentage,
        part_total_price,
        part_purchase_price,
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
        service_sac_number,
        service_description,
        service_price,
        service_gst_percentage = 0,
        service_gst_amount,
        service_discount_amount,
        service_discount_percentage,
        service_total_price,
        rateType,
        originalRate,
        originalGst
      } = service;

      logger.info(`--- Calculating service GST amount ---`);
      // let service_gst_amount = service_price * (service_gst_percentage / 100);
      // let service_total_price = service_price + service_gst_amount;

      logger.info(`--- Calculating service total price ---`);
      invoice_total_amount += service_total_price;
      invoice_gst_amount += service_gst_amount;
      invoice_total_services_amount += service_price;
      invoice_total_services_tax_amount += service_gst_amount;
      invoice_total_parts_services_amount += service_price;
      invoice_total_parts_services_tax_amount += service_gst_amount;

      logger.info(`--- Adding service to processed services ---`);
      processed_services.push({
        franchise_service_id,
        service_name,
        service_sac_number,
        service_description,
        service_price,
        service_gst_percentage,
        service_gst_amount,
        service_discount_amount,
        service_discount_percentage,
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
      invoice_total_amount =
      invoice_total_amount - invoice_additional_discount_amount;

    logger.info(`--- Wrapping all database operations in a transaction ---`);
    const result = await prisma.$transaction(async (tx) => {
      logger.info(`--- Starting transaction for purchase order update ---`);

            const existingInvoice = await tx.purchaseInvoice.findFirst({
        where: {
          provider_id: provider.id,
          franchise_id: franchise_id,
          invoice_number: invoice_number,
          invoice_type: invoice_type,
          NOT: {
            id: purchase_invoice_id,
          },
        },
      });
      console.log("existingInvoice", existingInvoice);

      if (existingInvoice) {
        throw new Error(`Invoice number already exists`);
      }

      

      logger.info(`--- Updating purchase order ---`);
      const updated_purchase_order = await updatePurchaseInvoice(
        purchase_invoice_id,
        provider.id,
        staff_id,
        franchise_id,
        {
          provider_customer_id,
        //   franchise_id,
          invoice_date: new Date(invoice_date),
          invoice_number,
          invoice_type,
          terms_and_conditions,
          additional_notes,
          due_date_terms,
          due_date: due_date ? new Date(due_date) : null,
          invoice_total_amount,
          invoice_gst_amount,
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

      if (!updated_purchase_order) {
        throw new Error("Failed to update purchase order");
      }
      logger.info(`--- Purchase order updated ---`);

      logger.info(`--- Updating bill to ---`);
      const bill_to_updated = await updatePurchaseInvoiceParty(
        purchase_invoice_id,
        "Bill_To",
        {
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

      if (!bill_to_updated) {
        throw new Error("Failed to update bill to");
      }
      logger.info(`--- Bill to updated ---`);

      logger.info(`--- Updating ship to ---`);
      const ship_to_updated = await updatePurchaseInvoiceParty(
        purchase_invoice_id,
        "Ship_To",
        {
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

      if (!ship_to_updated) {
        throw new Error("Failed to update ship to");
      }
      logger.info(`--- Ship to updated ---`);

      logger.info(`--- Deleting existing parts ---`);
      await deletePurchaseParts(purchase_invoice_id, tx);

      logger.info(`--- Deleting existing services ---`);
      await deletePurchaseServices(purchase_invoice_id, tx);

      logger.info(`--- Deleting existing additional charges ---`);
      await deletePurchaseAdditionalCharges(purchase_invoice_id, tx);

      logger.info(`--- Creating new parts ---`);
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
      }

      logger.info(`--- Creating new services ---`);
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

      return updated_purchase_order;
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
      StatusCodes.OK,
      "Purchase order updated successfully",
      result
    );
  } catch (error) {
    logger.error(`Error in updatePurchaseOrderEndpoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in updatePurchaseOrderEndpoint: ${error.message}`
    );
  } finally {
    await prisma.$disconnect();
  }
};

export { updatePurchaseOrderEndpoint };
