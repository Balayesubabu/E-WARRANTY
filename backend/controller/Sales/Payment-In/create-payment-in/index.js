import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import {
  getProviderByUserId,
  getSalesInvoiceById,
  createPaymentIn,
  updateSalesInvoice,
  createTransaction,
  updateCustomerFinalBalance,
  getAllDataSalesInvoiceById,
  updateUrl,
  getAllDataSalesInvoiceById1,
  updateUrl1,
  getAllDataBooking
} from "./query.js";
import { pdfGenerator } from "../../../InvoiceSettings/pdfGenerator.js";
import { uploadPdfToS3 } from "../../../../services/upload.js";

const createPaymentInEndpoint = async (req, res) => {
  try {
    logger.info(`createPaymentInEndpoint`);

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
        const franchise_id = req.franchise_id
    let data = req.body;
    let {
      sales_invoice_id,
      invoice_type,
      amount,
      transaction_type,
      transaction_status,
      transaction_id,
      tds_percentage,
      payment_in_number,
      is_apply_tds,
      tds_amount = 0,
      notes,
      is_linked,
      linked_invoice_id
    } = data;

    // 1. Get provider & sales invoice
    const provider = await getProviderByUserId(user_id);
    const salesInvoice = await getSalesInvoiceById(sales_invoice_id);

    if (!salesInvoice) {
      return returnError(res, StatusCodes.NOT_FOUND, `Sales invoice not found`);
    }

    // 2. TDS validation
    if (
      salesInvoice.SalesInvoiceTransactions.length > 1 &&
      salesInvoice.invoice_tds_percentage &&
      salesInvoice.invoice_tds_amount &&
      tds_percentage
    ) {
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        `TDS percentage is not allowed after first payment in`
      );
    }

    // 3. Calculate TDS amount
    // let tds_amount = 0;
    if (tds_percentage) {
      tds_amount = (salesInvoice.invoice_total_parts_services_amount * tds_percentage) / 100;
    }

    // 4. Disallowed invoice types
    if (
      ["Quotation", "Delivery_Challan", "Proforma_Invoice"].includes(
        salesInvoice.invoice_type
      )
    ) {
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        `Invoice type is not allowed for payment in`
      );
    }

    // 5. Prevent overpayment
    if (amount > salesInvoice.invoice_pending_amount) {
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        `Payment amount cannot be greater than pending amount`
      );
    }

    // 6. Create Payment In entry
    const created_payment_in = await createPaymentIn(provider.id, staff_id,salesInvoice.id, {
      sales_invoice_id,
      invoice_type,
      amount,
      total_amount: salesInvoice.invoice_total_amount,
      pending_amount: salesInvoice.invoice_pending_amount - amount,
      paid_amount: salesInvoice.invoice_paid_amount + amount,
      transaction_type,
      transaction_status,
      transaction_id,
      payment_in_number,
      is_apply_tds,
      tds_amount,
      tds_percentage,
      notes
    });

    // 7. Update Sales Invoice
    const new_pending = salesInvoice.invoice_pending_amount - amount - tds_amount;
    const new_paid = salesInvoice.invoice_paid_amount + amount ;

    let payment_status = "Pending";
    let payment_in_status = false;
    if (new_paid === salesInvoice.invoice_total_amount) {
      payment_status = "Paid";
      payment_in_status = true;
    } else if (new_paid > 0 && new_paid < salesInvoice.invoice_total_amount) {
      payment_status = "Partially_Paid";
      payment_in_status = true;
    }

    let total_amount_payable = 0

    if(tds_percentage){
      total_amount_payable = salesInvoice.total_amount_payable - amount - tds_amount
    }
    else{
      total_amount_payable = salesInvoice.total_amount_payable - amount
    }

    if(new_pending <= 0){
      payment_status = "Paid";
      total_amount_payable = 0;
    }

    const updated_sales_invoice = await updateSalesInvoice(salesInvoice.id, {
      
      invoice_pending_amount: new_pending,
      invoice_paid_amount: new_paid,
      is_invoice_fully_paid: new_pending <= 0,
      invoice_payment_status: payment_status,
      invoice_tds_percentage: tds_percentage ? tds_percentage : salesInvoice.invoice_tds_percentage,
      invoice_tds_amount: tds_amount ? tds_amount : salesInvoice.invoice_tds_amount,
     total_amount_payable: total_amount_payable,
     payment_in_status: payment_in_status
    });

    // 8. Create Transaction
    console.log("creating transaction table")
    const created_transaction = await createTransaction(salesInvoice.id, {
      provider_id: provider.id,
      provider_customer_id: salesInvoice.provider_customer_id,
      sales_invoice_id: salesInvoice.id,
      invoice_type: invoice_type,
      amount: amount,
      money_in : amount,
      money_out : 0,
      transaction_type: transaction_type,
      transaction_status: transaction_status,
      transaction_id: transaction_id,
    });

    // 9. Update Customer Final Balance
    const updated_customer_final_balance = await updateCustomerFinalBalance(
      salesInvoice.provider_customer_id,
      {
        customer_final_balance:
          (salesInvoice.customer_final_balance || 0) +
          (invoice_type === "Sales_Return" || invoice_type === "Credit_Note"
            ? amount
            : -amount),
      });

    if(salesInvoice.invoice_type === 'Booking' && salesInvoice.booking_id){
      const salesInvoiceId = salesInvoice.id;
    const booking = await getAllDataBooking(salesInvoice.booking_id, provider.id, franchise_id);
    if (!booking) {
        return returnError(res, StatusCodes.NOT_FOUND, "Sales invoice not found");
    }
    console.log("salesInvoice: ", booking);

    const plainInvoice = JSON.parse(JSON.stringify(booking));
    console.log("plainInvoice: ", plainInvoice);

    const pdfBuffer = await pdfGenerator(provider.id, plainInvoice, "Booking");

    const fileName = `invoice_${salesInvoice.booking_id}_provider_${franchise_id}`;
    const s3Url = await uploadPdfToS3(pdfBuffer, fileName, 'invoices');
    logger.info(`Invoice uploaded to S3: ${s3Url}`);

    const updated_invoice = await updateUrl(salesInvoiceId, s3Url);

    // 10. Success Response
    return returnResponse(
      res,
      StatusCodes.OK,
      `Payment in created successfully`,
      {
        created_payment_in,
        updated_sales_invoice,
        created_transaction,
        updated_customer_final_balance,
      }
    );

    }
    else{
      if(is_linked){
        const salesInvoiceId1 = salesInvoice.id;
      const salesInvoice1 = await getAllDataSalesInvoiceById1(salesInvoiceId1, linked_invoice_id);
      if (!salesInvoice1) {
          return returnError(res, StatusCodes.NOT_FOUND, "Sales invoice not found");
      }
      console.log("salesInvoice1: ", salesInvoice1);

       let linked_invoice_balance = 0;
      if(salesInvoice1.linked_invoice_number){
        linked_invoice_balance = salesInvoice1.invoice_pending_amount.toFixed(2) - salesInvoice1.linked_invoice_total_amount.toFixed(2);
        if(linked_invoice_balance < 0){
          linked_invoice_balance = 0;
        }
      }
      salesInvoice1.linked_invoice_balance = linked_invoice_balance;
      let updated_payment_status;
      if(salesInvoice1.linked_invoice_balance === 0) {
        updated_payment_status = "Paid";
      }
      else if(salesInvoice1.linked_invoice_balance > 0) {
        updated_payment_status = "Partially_Paid";
      }
      else{
        updated_payment_status = "Unpaid";
      }

      const plainInvoice1 = JSON.parse(JSON.stringify(salesInvoice1));
      console.log("plainInvoice1: ", plainInvoice1);

      const pdfBuffer1 = await pdfGenerator(provider.id, plainInvoice1, "Sales");

      const fileName1 = `invoice_${salesInvoiceId1}_provider_${franchise_id}`;
      const s3Url1 = await uploadPdfToS3(pdfBuffer1, fileName1, 'invoices');
      logger.info(`Invoice uploaded to S3: ${s3Url1}`);
      const updated_invoice1 = await updateUrl1(salesInvoiceId1, s3Url1, updated_payment_status);

      return returnResponse(
      res,
      StatusCodes.OK,
      `Payment in created successfully`,
      {
        created_payment_in,
        updated_sales_invoice,
        created_transaction,
        updated_customer_final_balance,
      }
    );
      
    }
    else{
      const salesInvoiceId = salesInvoice.id;
    const salesInvoice_id = await getAllDataSalesInvoiceById(salesInvoiceId);
    if (!salesInvoice_id) {
        return returnError(res, StatusCodes.NOT_FOUND, "Sales invoice not found");
    }
    console.log("salesInvoice: ", salesInvoice_id);

    const plainInvoice = JSON.parse(JSON.stringify(salesInvoice_id));
    console.log("plainInvoice: ", plainInvoice);

    const pdfBuffer = await pdfGenerator(provider.id, plainInvoice, "Sales");

    const fileName = `invoice_${salesInvoiceId}_provider_${franchise_id}`;
    const s3Url = await uploadPdfToS3(pdfBuffer, fileName, 'invoices');
    logger.info(`Invoice uploaded to S3: ${s3Url}`);

    const updated_invoice = await updateUrl(salesInvoiceId, s3Url);

    // 10. Success Response
    return returnResponse(
      res,
      StatusCodes.OK,
      `Payment in created successfully`,
      {
        created_payment_in,
        updated_sales_invoice,
        created_transaction,
        updated_customer_final_balance,
      }
    );

  }

    }

    
  } catch (error) {
    logger.error(`Error in createPaymentInEndpoint:`, error);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in createPaymentInEndpoint`
    );
  }
};

export { createPaymentInEndpoint };
