import { Provider, ProviderCustomers } from "../../../../prisma/db-models.js";
import { logger } from "../../../../services/logger.js";


const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: {
      user_id: user_id
    }
  })
  return provider
}

const getRecievableAgeingReport = async (provider_id, franchise_id, provider_customer_id) => {

  if(provider_customer_id)
  {
    const recievableAgeingReport = await ProviderCustomers.findMany({
    where: {
      provider_id: provider_id,
      id:provider_customer_id
    },
    include: {
      SalesInvoice: {
        where: {
          provider_id: provider_id,
          franchise_id: franchise_id,
          invoice_type: {"in":["Sales","Booking"]},
          invoice_status : {"in":["New","Open","In_Progress","Booking_Converted"]},
          invoice_payment_status: {"notIn":["Paid"]},
        },
        include: {
          SalesInvoiceTransactions: true
        }
      }
    }
  })
  logger.info(`Processing ${recievableAgeingReport.length} recievableAgeingReport for provider_id = ${provider_id}`);

  return recievableAgeingReport.map(customer => {
    logger.info(`customer_name = ${customer.customer_name}`);

    let days1_15 = 0;
    let days16_30 = 0;
    let days31_45 = 0;
    let daysMore45 = 0;

    customer.SalesInvoice.forEach(invoice => {
      const refDate = invoice.due_date || invoice.created_at;
      const daysDiff = Math.floor((new Date() - new Date(refDate)) / (1000 * 60 * 60 * 24));
      console.log(daysDiff," days diff")

      const pendingAmount = invoice.invoice_pending_amount;
      logger.info(`pendingAmount = ${pendingAmount}`);

      if (daysDiff >= 1 && daysDiff <= 15) {
        days1_15 += pendingAmount;
      } else if (daysDiff >= 16 && daysDiff <= 30) {
        days16_30 += pendingAmount;
      } else if (daysDiff >= 31 && daysDiff <= 45) {
        days31_45 += pendingAmount;
      } else if (daysDiff > 45) {
        daysMore45 += pendingAmount;
      }
    });

    const total = days1_15 + days16_30 + days31_45 + daysMore45;

    return {
      'Customer Name': customer.customer_name,
      'Days(1-15)': days1_15.toFixed(2),
      'Days(16-30)': days16_30.toFixed(2),
      'Days(31-45)': days31_45.toFixed(2),
      'Days(>45)': daysMore45.toFixed(2),
      'Total': total.toFixed(2)
    };
  }).filter(report => parseFloat(report.Total) > 0);
  }
else{
  const recievableAgeingReport = await ProviderCustomers.findMany({
    where: {
      provider_id: provider_id
    },
    include: {
      SalesInvoice: {
        where: {
          provider_id: provider_id,
          franchise_id: franchise_id,
          invoice_type: {"in":["Sales","Booking"]},
          invoice_status : {"in":["New","Open","In_Progress","Booking_Converted"]},
          invoice_payment_status: {"notIn":["Paid"]},
        },
        include: {
          SalesInvoiceTransactions: true
        }
      }
    }
  })
  logger.info(`Processing ${recievableAgeingReport.length} recievableAgeingReport for provider_id = ${provider_id}`);

  return recievableAgeingReport.map(customer => {
    logger.info(`customer_name = ${customer.customer_name}`);

    let days1_15 = 0;
    let days16_30 = 0;
    let days31_45 = 0;
    let daysMore45 = 0;

    customer.SalesInvoice.forEach(invoice => {
      const refDate = invoice.due_date || invoice.created_at;
      const daysDiff = Math.floor((new Date() - new Date(refDate)) / (1000 * 60 * 60 * 24));

      const pendingAmount = invoice.invoice_pending_amount;
      logger.info(`pendingAmount = ${pendingAmount}`);

      if (daysDiff >= 1 && daysDiff <= 15) {
        days1_15 += pendingAmount;
      } else if (daysDiff >= 16 && daysDiff <= 30) {
        days16_30 += pendingAmount;
      } else if (daysDiff >= 31 && daysDiff <= 45) {
        days31_45 += pendingAmount;
      } else if (daysDiff > 45) {
        daysMore45 += pendingAmount;
      }
    });

    const total = days1_15 + days16_30 + days31_45 + daysMore45;

    return {
      'Customer Name': customer.customer_name,
      'Days(1-15)': days1_15.toFixed(2),
      'Days(16-30)': days16_30.toFixed(2),
      'Days(31-45)': days31_45.toFixed(2),
      'Days(>45)': daysMore45.toFixed(2),
      'Total': total.toFixed(2)
    };
  }).filter(report => parseFloat(report.Total) > 0);
}
  
}


export { getProviderByUserId, getRecievableAgeingReport }