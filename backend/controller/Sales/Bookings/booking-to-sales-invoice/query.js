import { Provider, SalesInvoice } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    })
    return provider;
}

const getBookingById = async (booking_id) => {
    const booking = await SalesInvoice.findFirst({
        where: {
            id: booking_id,
            invoice_type: "Booking"
        }
    })
    return booking;
}

const bookingToSalesInvoice = async (booking) => {
    const sales_invoice = await SalesInvoice.update({
        where: {
            id: booking.id
        },
        data: {
            invoice_status: "Booking_Converted"
        }
    })
    return sales_invoice;
}

export { getProviderByUserId, getBookingById, bookingToSalesInvoice };