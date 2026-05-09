import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import {
  getProviderByUserId,
  getSalesInvoiceById,
  updateQuotationStatus,
  createSalesInvoice,
  updateFranchiseInventory,
  updateCustomerBalance,
  // createSalesInvoiceTransactions,
  createTransactions,
  getLatestInvoiceNumber,
  createSalesInvoiceParty,
  updateQuickSettings,
  createSalesParts,
  createSalesServices,
  createFranchiseInventoryTransaction,
  getAllDataSalesInvoiceById,
  updateUrl
} from "./query.js";
import { prisma, Provider } from "../../../../prisma/db-models.js";
import { pdfGenerator } from "../../../InvoiceSettings/pdfGenerator.js";
import { uploadPdfToS3 } from "../../../../services/upload.js";

const quotationToSalesInvoiceEndpoint = async (req, res) => {
  try {
    logger.info(`quotationToSalesInvoiceEndpoint`);

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
    const sales_invoice_id = req.params.id;

    logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found for user_id: ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
    }
    logger.info(`--- Provider found for user_id: ${user_id} ---`);

    logger.info(
      `--- Fetching quotation details for id: ${sales_invoice_id} ---`
    );
    const quotation = await getSalesInvoiceById(provider.id, franchise_id, sales_invoice_id);
    if (!quotation) {
      logger.error(`--- Quotation not found for id: ${sales_invoice_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, `Quotation not found`);
    }
    logger.info(`--- Quotation found for id: ${sales_invoice_id} ---`);

    if (quotation.invoice_type !== "Quotation") {
      logger.error(`--- Invalid invoice type: ${quotation.invoice_type} ---`);
      return returnError(res, StatusCodes.BAD_REQUEST, `Invalid invoice type`);
    }

    if (quotation.invoice_status === "Quotation_Converted") {
      logger.error(`--- Quotation already converted ---`);
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        `Quotation already converted`
      );
    }

    // ⭐ FIXED: Find the correct parties from the array by type
    const bill_to = quotation.SalesInvoiceParty.find(party => party.type === "Bill_To");
    const ship_to = quotation.SalesInvoiceParty.find(party => party.type === "Ship_To");

    // Validate that both parties exist
    if (!bill_to) {
      logger.error(`--- Bill_To party not found in quotation ---`);
      return returnError(res, StatusCodes.BAD_REQUEST, `Bill_To party not found`);
    }
    if (!ship_to) {
      logger.error(`--- Ship_To party not found in quotation ---`);
      return returnError(res, StatusCodes.BAD_REQUEST, `Ship_To party not found`);
    }

    console.log("bill_to", bill_to);
    console.log("ship_to", ship_to);
    
    
    logger.info(`--- Wrapping all database operations in a transaction ---`);
    const result = await prisma.$transaction(async (tx) => {
      logger.info(`--- Starting transaction for quotation conversion ---`);

      logger.info(`--- Updating quotation status ---`);
      const updated_quotation = await updateQuotationStatus(
        sales_invoice_id,
        tx
      );
      if (!updated_quotation) {
        throw new Error("Failed to update quotation status");
      }
      logger.info(`--- Quotation status updated ---`);

      logger.info(`get latest invoice number `);
      const invoice_num = await getLatestInvoiceNumber(provider.id, franchise_id);
      logger.info(`invoice number ${invoice_num}`);

      let invoice_number;
      let sequence_number;
      let prefix;
      if(!invoice_num){
         invoice_number = `QTN001`;
      }else {
          sequence_number = invoice_num.sequence_number + 1;
          prefix = invoice_num.prefix;
           invoice_number = (`${invoice_num.prefix}${invoice_num.sequence_number + 1}`) 
      }

      
      console.log("invoice_number", invoice_number);
      logger.info(`--- Creating sales invoice ---`);
      const sales_invoice = await createSalesInvoice(provider.id, staff_id, quotation, invoice_number, tx);
      logger.info(`--- Sales invoice created ---`);
      if (!sales_invoice) {
        throw new Error("Failed to create sales invoice");
      }
      logger.info(`--- Sales invoice created ---`);

      // Create Provider party
      await createSalesInvoiceParty(
        sales_invoice.id,
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
      await createSalesInvoiceParty(
        sales_invoice.id,
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
      await createSalesInvoiceParty(
        sales_invoice.id,
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
      const salesParts = await tx.salesPart.findMany({
        where: {
          sales_invoice_id: sales_invoice_id,
        },
      });
      let franchise_inventory_product_quantity = 0;
      for (const part of salesParts) {
        await createSalesParts(
          sales_invoice.id,
          { ...part, sales_invoice_id: sales_invoice.id },
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
          provider.id,{
          franchise_inventory_id: part.franchise_inventory_id,
          franchise_id: franchise_id,
          provider_id: provider.id,
          quantity:  part.part_quantity,
          action: "reduce",
          stock_changed_by: "invoice",
          closing_stock : franchise_inventory_product_quantity - part.part_quantity
        },
        tx
        );
      }

      logger.info(`--- Franchise inventory updated ---`);

      logger.info(`--- get sales service ---`);
      const salesServices = await tx.salesService.findMany({
        where: {
          sales_invoice_id: sales_invoice_id,
        },
      });
      logger.info(`--- Sales services found ---`);
      for (const service of salesServices) {
        await createSalesServices(
          sales_invoice.id,
          { ...service, sales_invoice_id: sales_invoice.id },
          tx
        );
      }

      logger.info(`--- Updating customer balance ---`);
      await updateCustomerBalance(
        quotation.provider_customer_id,
        quotation.invoice_total_amount,
        tx
      );
      logger.info(`--- Customer balance updated ---`);

      console.log("Creating transaction table");
      await createTransactions(
        sales_invoice.id,
        {
          provider_id: provider.id,
          provider_customer_id: sales_invoice.provider_customer_id,
          invoice_type: "Sales",
          amount: sales_invoice.invoice_total_amount,
          money_in: 0,
          money_out: 0,
          transaction_type: "Cash",
          transaction_status: "Paid",
          transaction_id: null,
        },
        tx
      );
      logger.info(`--- Transaction created ---`);

      logger.info(`--- Transaction completed successfully ---`);
      logger.info(`--- update Quick settings after delivery challan to sales invoice conversion ---`);
    const quickSettings = await updateQuickSettings(provider.id, franchise_id, sequence_number, prefix, tx);
    if (!quickSettings) {
        logger.error(`--- Quick settings not updated ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Quick settings not updated");
    }
    logger.info(`--- Quick settings updated ---`);

    return  sales_invoice;
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
      "Quotation converted to sales invoice successfully",
      result
    );
  } catch (error) {
    logger.error(`Error in quotationToSalesInvoiceEndpoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in quotationToSalesInvoiceEndpoint: ${error.message}`
    );
  } finally {
    await prisma.$disconnect();
  }
};

export { quotationToSalesInvoiceEndpoint };