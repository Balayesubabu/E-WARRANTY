import {
  Provider,
  SalesInvoice,
  prisma,
} from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
  return Provider.findFirst({
    where: {
      user_id: user_id,
    },
  });
};

const getBookingById = async (booking_id) => {
  return SalesInvoice.findFirst({
    where: {
      id: booking_id,
      invoice_type: "Booking",
    },
    include: {
      SalesCustomerVehicle: true,
      SalesInvoiceParty: true,
      SalesPart: true,
      SalesService: true,
      SalesPackage: true,
      SalesInvoiceTransactions: true,
      Transaction: true,
    },
  });
};

const deleteBookingById = async (booking_id) => {
  return prisma.$transaction(async (tx) => {
    // Delete all dependent/related records first
    await tx.salesCustomerVehicle.deleteMany({
      where: { sales_invoice_id: booking_id },
    });
    await tx.salesInvoiceParty.deleteMany({
      where: { sales_invoice_id: booking_id },
    });
    await tx.salesPart.deleteMany({
      where: { sales_invoice_id: booking_id },
    });
    await tx.salesService.deleteMany({
      where: { sales_invoice_id: booking_id },
    });
    await tx.salesPackage.deleteMany({
      where: { sales_invoice_id: booking_id },
    });
    await tx.salesInvoiceTransactions.deleteMany({
      where: { sales_invoice_id: booking_id },
    });
    await tx.transaction.deleteMany({
      where: { sales_invoice_id: booking_id },
    });

    // Finally delete the booking itself
    return tx.salesInvoice.delete({
      where: { id: booking_id },
    });
  });
};

export { getProviderByUserId, getBookingById, deleteBookingById };
