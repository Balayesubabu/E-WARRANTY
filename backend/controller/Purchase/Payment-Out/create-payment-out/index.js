import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import {
  getProviderByUserId,
  getPurchaseInvoiceById,
  createPaymentOut,
  updatePurchaseInvoice,
  createTransaction,
  updateCustomerFinalBalance,
  getAllDataPurchaseInvoiceById,
  updateUrl,
  updateUrlWithStatus,
  getAllDataPurchaseInvoiceById1
} from "./query.js";
import { pdfGenerator } from "../../../InvoiceSettings/pdfGenerator.js";
import { uploadPdfToS3 } from "../../../../services/upload.js";

const createPaymentOutEndpoint = async (req, res) => {
  try {
    logger.info(`createPaymentOutEndpoint`);

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
    
    const data = req.body;
    const {
      purchase_invoice_id,
      invoice_type,
      amount,
      transaction_type,
      transaction_status,
      transaction_id,
      tds_percentage,
      notes,
      payment_out_number,
      is_linked,
      linked_invoice_id
    } = data;

    // Validate required fields
    if (!purchase_invoice_id) {
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        "purchase_invoice_id is required"
      );
    }
    if (!amount || amount <= 0) {
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        "amount must be greater than 0"
      );
    }
    if (!transaction_type) {
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        "transaction_type is required"
      );
    }

    logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found for user_id: ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
    }
    logger.info(`--- Provider found for user_id: ${user_id} ---`);

    logger.info(
      `--- Fetching purchase invoice details for purchase_invoice_id: ${purchase_invoice_id} ---`
    );
    const purchaseInvoice = await getPurchaseInvoiceById(purchase_invoice_id);
    if (!purchaseInvoice) {
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
    logger.info(`--- Invoice details: ---`);
    logger.info(`--- Invoice type: ${purchaseInvoice.invoice_type} ---`);
    logger.info(
      `--- Total amount: ${purchaseInvoice.invoice_total_amount} ---`
    );
    logger.info(`--- Paid amount: ${purchaseInvoice.invoice_paid_amount} ---`);
    logger.info(
      `--- Pending amount: ${purchaseInvoice.invoice_pending_amount} ---`
    );
    logger.info(
      `--- Is fully paid: ${purchaseInvoice.is_invoice_fully_paid} ---`
    );
    logger.info(
      `--- Payment status: ${purchaseInvoice.invoice_payment_status} ---`
    );

    // Check if purchase invoice belongs to the provider
    if (purchaseInvoice.provider_id !== provider.id) {
      logger.error(`--- Purchase invoice does not belong to provider ---`);
      return returnError(
        res,
        StatusCodes.FORBIDDEN,
        `Purchase invoice does not belong to this provider`
      );
    }

    // Check if purchase invoice is already fully paid
    if (purchaseInvoice.is_invoice_fully_paid === true) {
      logger.error(`--- Purchase invoice is already fully paid ---`);
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        `Purchase invoice is already fully paid`
      );
    }

    // Check if there's any pending amount to pay
    if (purchaseInvoice.invoice_pending_amount <= 0) {
      logger.error(`--- Purchase invoice has no pending amount to pay ---`);
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        `Purchase invoice has no pending amount to pay`
      );
    }

    // Additional check for payment status
    if (purchaseInvoice.invoice_payment_status === "Paid") {
      logger.error(`--- Purchase invoice payment status is already Paid ---`);
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        `Purchase invoice payment status is already Paid`
      );
    }

    // Check if purchase invoice is deleted
    if (purchaseInvoice.is_deleted === true) {
      logger.error(`--- Purchase invoice is deleted ---`);
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        `Purchase invoice is deleted`
      );
    }

    // Validate invoice types that are not allowed for payment out
    if (
      purchaseInvoice.invoice_type === "Purchase_Order" ||
      purchaseInvoice.invoice_type === "Quotation" ||
      purchaseInvoice.invoice_type === "Delivery_Challan" ||
      purchaseInvoice.invoice_type === "Proforma_Invoice"
    ) {
      logger.error(
        `--- Invoice type ${purchaseInvoice.invoice_type} is not allowed for payment out ---`
      );
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        `Invoice type ${purchaseInvoice.invoice_type} is not allowed for payment out`
      );
    }

    // Check TDS percentage validation
    if (
      purchaseInvoice.PurchaseInvoiceTransactions.length > 1 &&
      purchaseInvoice.invoice_tds_percentage &&
      purchaseInvoice.invoice_tds_amount &&
      tds_percentage
    ) {
      logger.error(
        `--- TDS percentage is not allowed after first payment out ---`
      );
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        `TDS percentage is not allowed after first payment out`
      );
    }

    // Calculate TDS amount
    let tds_amount = 0;
    if (tds_percentage) {
      tds_amount =
        (purchaseInvoice.invoice_total_amount * tds_percentage) / 100;
      logger.info(`--- TDS amount calculated: ${tds_amount} ---`);
    }

    // Validate payment amount
    const total_payment_amount = amount + tds_amount;
    if (total_payment_amount > purchaseInvoice.invoice_pending_amount) {
      logger.error(
        `--- Payment amount (${total_payment_amount}) cannot be greater than pending amount (${purchaseInvoice.invoice_pending_amount}) ---`
      );
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        `Payment amount cannot be greater than pending amount`
      );
    }

    logger.info(`--- Processing payment out ---`);
    logger.info(
      `--- Amount: ${amount}, TDS Amount: ${tds_amount}, Total Payment: ${total_payment_amount} ---`
    );

    // Calculate new pending and paid amounts
    const new_pending_amount =
      purchaseInvoice.invoice_pending_amount - total_payment_amount;
    const new_paid_amount =
      purchaseInvoice.invoice_paid_amount + total_payment_amount;
    const is_fully_paid = new_pending_amount === 0;

    console.log("is fully paid status", is_fully_paid);
    

    logger.info(
      `--- New pending amount: ${new_pending_amount}, New paid amount: ${new_paid_amount}, Fully paid: ${is_fully_paid} ---`
    );

    // Create payment out transaction
    logger.info(`--- Creating payment out transaction ---`);
    const created_payment_out = await createPaymentOut(purchaseInvoice.id, {
      purchase_invoice_id,
      invoice_type: purchaseInvoice.invoice_type,
      amount,
      total_amount: purchaseInvoice.invoice_total_amount,
      pending_amount: new_pending_amount,
      paid_amount: new_paid_amount,
      transaction_type,
      transaction_status,
      transaction_id,
      notes,
      payment_out_number
    });

    if (!created_payment_out) {
      throw new Error("Failed to create payment out transaction");
    }
    logger.info(`--- Payment out transaction created successfully ---`);

    // Update purchase invoice
    logger.info(`--- Updating purchase invoice ---`);
    const updated_purchase_invoice = await updatePurchaseInvoice(
      purchaseInvoice.id,
      {
        invoice_pending_amount: new_pending_amount,
        invoice_paid_amount: new_paid_amount,
        is_invoice_fully_paid: is_fully_paid,
        invoice_payment_status: is_fully_paid ? "Paid" : "Partially_Paid",
        invoice_tds_percentage:
          tds_percentage || purchaseInvoice.invoice_tds_percentage,
        invoice_tds_amount:
          (purchaseInvoice.invoice_tds_amount || 0) + tds_amount,
        payment_out_status: true
      }
    );

    if (!updated_purchase_invoice) {
      throw new Error("Failed to update purchase invoice");
    }
    logger.info(`--- Purchase invoice updated successfully ---`);

    // Create transaction record
    logger.info(`--- Creating transaction record ---`);
    const created_transaction = await createTransaction(purchaseInvoice.id, {
      provider_id: provider.id,
      provider_customer_id: purchaseInvoice.provider_customer_id,
      purchase_invoice_id: purchaseInvoice.id,
      invoice_type: purchaseInvoice.invoice_type,
      amount: total_payment_amount,
      transaction_type: transaction_type,
      transaction_status: transaction_status,
      transaction_id: transaction_id,
    });

    if (!created_transaction) {
      throw new Error("Failed to create transaction record");
    }
    logger.info(`--- Transaction record created successfully ---`);

    // Update customer final balance
    logger.info(`--- Updating customer final balance ---`);
    let balance_adjustment = 0;

    // For different invoice types, adjust balance accordingly
    switch (purchaseInvoice.invoice_type) {
      case "Purchase_Return":
      case "Debit_Note":
        // For returns/debit notes, we're getting money back, so decrease balance
        balance_adjustment = -total_payment_amount;
        break;
      case "Purchase":
      case "Purchase_Invoice":
      default:
        // For regular purchases, we're paying money, so increase balance
        balance_adjustment = total_payment_amount;
        break;
    }

    const updated_customer_final_balance = await updateCustomerFinalBalance(
      purchaseInvoice.provider_customer_id,
      {
        customer_final_balance:
          (purchaseInvoice.provider_customer.customer_final_balance || 0) +
          balance_adjustment,
      }
    );

    if (!updated_customer_final_balance) {
      throw new Error("Failed to update customer final balance");
    }
    logger.info(`--- Customer final balance updated successfully ---`);
    if(!is_linked){
    const purchaseInvoiceId = purchaseInvoice.id;
    const purchaseInvoice_id = await getAllDataPurchaseInvoiceById(purchaseInvoiceId);
    if (!purchaseInvoice_id) {
        return returnError(res, StatusCodes.NOT_FOUND, "Purchase invoice not found");
    }
    console.log("purchaseInvoice: ", purchaseInvoice_id);

      const plainInvoice = JSON.parse(JSON.stringify(purchaseInvoice_id));
      console.log("plainInvoice: ", plainInvoice);

      const pdfBuffer = await pdfGenerator(provider.id, plainInvoice, "Purchase");

      const fileName = `invoice_${purchaseInvoiceId}_provider_${franchise_id}`;
      const s3Url = await uploadPdfToS3(pdfBuffer, fileName, 'invoices');
      logger.info(`Invoice uploaded to S3: ${s3Url}`);

      const updated_invoice = await updateUrl(purchaseInvoiceId, s3Url);

    logger.info(`--- Payment out created successfully ---`);
    return returnResponse(
      res,
      StatusCodes.CREATED,
      `Payment out created successfully`,
      {
        payment_out: created_payment_out,
        updated_invoice: updated_purchase_invoice,
        transaction: created_transaction,
        balance_adjustment: balance_adjustment,
      }
    );
  }
  else{
    const purchaseInvoiceId1 = purchaseInvoice.id;
    const purchaseInvoice1 = await getAllDataPurchaseInvoiceById1(purchaseInvoiceId1,linked_invoice_id);
    if (!purchaseInvoice1) {
        return returnError(res, StatusCodes.NOT_FOUND, "Purchase invoice not found");
    }
    console.log("purchaseInvoice: ", purchaseInvoice1);
    let linked_invoice_balance = 0;
      if(purchaseInvoice1.linked_invoice_number){
        linked_invoice_balance = purchaseInvoice1.invoice_pending_amount.toFixed(2) - purchaseInvoice1.linked_invoice_total_amount.toFixed(2);
        if(linked_invoice_balance < 0){
          linked_invoice_balance = 0;
        }
      }
      purchaseInvoice1.linked_invoice_balance = linked_invoice_balance;
      let updated_payment_status;
      if(purchaseInvoice1.linked_invoice_balance === 0) {
        updated_payment_status = "Paid";
      }
      else if(purchaseInvoice1.linked_invoice_balance > 0) {
        updated_payment_status = "Partially_Paid";
      }
      else{
        updated_payment_status = "Unpaid";
      }
      const plainInvoice1 = JSON.parse(JSON.stringify(purchaseInvoice1));
      console.log("plainInvoice: ", plainInvoice1);

      const pdfBuffer1 = await pdfGenerator(provider.id, plainInvoice1, "Purchase");

      const fileName1 = `invoice_${purchaseInvoiceId1}_provider_${franchise_id}`;
      const s3Url1 = await uploadPdfToS3(pdfBuffer1, fileName1, 'invoices');
      logger.info(`Invoice uploaded to S3: ${s3Url1}`);

      const updated_invoice1 = await updateUrlWithStatus(purchaseInvoiceId1, s3Url1,updated_payment_status)

    logger.info(`--- Payment out created successfully ---`);
    return returnResponse(
      res,
      StatusCodes.CREATED,
      `Payment out created successfully`,
      {
        payment_out: created_payment_out,
        updated_invoice: updated_purchase_invoice,
        transaction: created_transaction,
        balance_adjustment: balance_adjustment,
      }
    );
  }
  } catch (error) {
    logger.error(`Error in createPaymentOutEndpoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in createPaymentOutEndpoint: ${error.message}`
    );
  }
};

export { createPaymentOutEndpoint };
