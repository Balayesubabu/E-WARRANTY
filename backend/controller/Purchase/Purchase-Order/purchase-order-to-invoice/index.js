import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import {
  getProviderByUserId,
  getPurchaseOrderById,
  updatePurchaseInvoiceStatus,
  updateFranchiseInventory,
  updateCustomerBalance,
  createPurchaseInvoice,
  createPurchaseInvoiceParty,
  createTransactions,
  getLatestInvoiceNumber,
  updateQuickSettings,
  createPurchaseParts,
  createPurchaseServices,
  createFranchiseInventoryTransaction,
  getAllDataPurchaseInvoiceById,
  updateUrl  
} from "./query.js";
import { prisma } from "../../../../prisma/db-models.js";
import { pdfGenerator } from "../../../InvoiceSettings/pdfGenerator.js";
import { uploadPdfToS3 } from "../../../../services/upload.js";

const purchaseOrderToPurchaseInvoiceEndpoint = async (req, res) => {
  try {
    logger.info(`purchaseOrderToPurchaseInvoiceEndpoint`);

    let user_id;
    let staff_id;
    if(req.type == 'staff'){
       user_id = req.user_id;
        staff_id = req.staff_id;
    }
    if(req.type == 'provider'){
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
    const purchase_order = await getPurchaseOrderById(provider.id, franchise_id, purchase_invoice_id);
    if (!purchase_order) {
      logger.error(`--- Purchase order not found for id: ${purchase_invoice_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, `Purchase order not found`);
    }
    logger.info(`--- Purchase order found for id: ${purchase_invoice_id} ---`);

    if (purchase_order.invoice_type !== "Purchase_Order") {
      logger.error(`--- Invalid invoice type: ${purchase_order.invoice_type} ---`);
      return returnError(res, StatusCodes.BAD_REQUEST, `Invalid invoice type`);
    }

    if (purchase_order.invoice_status === "Purchase_Order_Converted") {
      logger.error(`--- Purchase order already converted ---`);
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        `Purchase order already converted`
      );
    }
    console.log("purchase_order", purchase_order);

    // ⭐ FIXED: Find the correct parties from the array by type
    const bill_to = purchase_order.PurchaseInvoiceParty.find(party => party.type === "Bill_To");
    const ship_to = purchase_order.PurchaseInvoiceParty.find(party => party.type === "Ship_To");

    // Validate that both parties exist
    if (!bill_to) {
      logger.error(`--- Bill_To party not found in purchase order ---`);
      return returnError(res, StatusCodes.BAD_REQUEST, `Bill_To party not found`);
    }
    if (!ship_to) {
      logger.error(`--- Ship_To party not found in purchase order ---`);
      return returnError(res, StatusCodes.BAD_REQUEST, `Ship_To party not found`);
    }

    console.log("bill_to", bill_to);
    console.log("ship_to", ship_to);
    
    
    logger.info(`--- Wrapping all database operations in a transaction ---`);
    const result = await prisma.$transaction(async (tx) => {
      logger.info(`--- Starting transaction for purchase order conversion ---`);

      logger.info(`--- Updating purchase order status ---`);
      const updated_purchase_order = await updatePurchaseInvoiceStatus(
        purchase_invoice_id,
        tx
      );
      if (!updated_purchase_order) {
        throw new Error("Failed to update purchase order status");
      }
      logger.info(`--- Purchase order status updated ---`);

      logger.info(`get latest invoice number `);
      const invoice_num = await getLatestInvoiceNumber(provider.id, franchise_id);
      logger.info(`invoice number ${invoice_num}`);

      let invoice_number;
      let sequence_number;
      let prefix;
      if(!invoice_num){
         invoice_number = `PO001`;
      }else {
          sequence_number = invoice_num.sequence_number + 1;
          prefix = invoice_num.prefix;
           invoice_number = (`${prefix}${sequence_number}`) 
      }

      
      console.log("invoice_number", invoice_number);
      logger.info(`--- Creating purchase invoice ---`);
      const purchase_invoice = await createPurchaseInvoice(provider.id, franchise_id, staff_id, purchase_order, invoice_number, tx);
      logger.info(`--- Purchase invoice created ---`);
      if (!purchase_invoice) {
        throw new Error("Failed to create purchase invoice");
      }
      logger.info(`--- Purchase invoice created ---`);

      // Create Provider party
      await createPurchaseInvoiceParty(
        purchase_invoice.id,
        {
          type: "Provider",
          party_name: provider.company_name,
          party_country_code: provider.user.country_code,
          party_phone: provider.user.phone_number,
          party_email: provider.user.email,
          party_address: provider.company_address,
          party_city: provider.user.city,
          party_state: provider.user.state,
          party_pincode: provider.user.pincode || null,
          party_gstin_number: provider.gst_number,
          party_vehicle_number: null,
        },
        tx
      );

      // Create Bill_To party
      await createPurchaseInvoiceParty(
        purchase_invoice.id,
        {
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

      // Create Ship_To party
      await createPurchaseInvoiceParty(
        purchase_invoice.id,
        {
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

      logger.info(`--- Updating franchise inventory ---`);
      const purchaseParts = await tx.PurchasePart.findMany({
        where: {
          purchase_invoice_id: purchase_invoice_id,
        },
      });
      let franchise_inventory_product_quantity = 0;
      for (const part of purchaseParts) {
        logger.info(
          `--- Updating inventory for part: ${part.franchise_inventory_id} ---`
        );
        await createPurchaseParts(
          purchase_invoice.id,
          {
            ...part,
            purchase_invoice_id: purchase_invoice.id,
          },
          tx
        );

        await updateFranchiseInventory(
          part.franchise_inventory_id,
          provider.id,
          franchise_id,
          part.part_quantity,
          tx
        );

        await createFranchiseInventoryTransaction(
          provider.id,
          purchase_invoice.id,
          {
            franchise_inventory_id: part.franchise_inventory_id,
            franchise_id: franchise_id,
            provider_id: provider.id,
            quantity: part.part_quantity,
            action: "add",
            stock_changed_by: "invoice",
            closing_stock: franchise_inventory_product_quantity + part.part_quantity
          },
          tx
        );
      }
      logger.info(`--- Franchise inventory updated ---`);

      const purchaseServices = await tx.PurchaseService.findMany({
        where: {
          purchase_invoice_id: purchase_invoice_id,
        },
      });

      for (const service of purchaseServices) {
        logger.info(`--- Creating service ---`);
        await createPurchaseServices(
          purchase_invoice.id,
          {
            ...service,
            purchase_invoice_id: purchase_invoice.id,
          },
          tx
        );
      }

      logger.info(`--- Updating customer balance ---`);
      await updateCustomerBalance(
        purchase_order.provider_customer_id,
        purchase_order.invoice_total_amount,
        tx
      );
      logger.info(`--- Customer balance updated ---`);

      console.log("Creating transaction table");
      await createTransactions(
        purchase_invoice.id, purchase_order.invoice_total_amount, provider.id, purchase_order.provider_customer_id, tx
      );
      logger.info(`--- Transaction created ---`);

      logger.info(`--- Transaction completed successfully ---`);

      logger.info(`--- update Quick settings after delivery challan to purchase invoice conversion ---`);
    const quickSettings = await updateQuickSettings(provider.id, franchise_id, sequence_number, prefix, tx);
    if (!quickSettings) {
        logger.error(`--- Quick settings not updated ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Quick settings not updated");
    }
    logger.info(`--- Quick settings updated ---`);
      return purchase_invoice;
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
      "purchase order converted to purchase invoice successfully",
      result
    );
  } catch (error) {
    logger.error(`Error in purchaseOrderToPurchaseInvoiceEndpoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in purchaseOrderToPurchaseInvoiceEndpoint: ${error.message}`
    );
  } finally {
    await prisma.$disconnect();
  }
};

export { purchaseOrderToPurchaseInvoiceEndpoint };
