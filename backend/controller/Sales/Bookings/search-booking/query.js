import { Provider, SalesInvoice } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
};

const searchBookingQuery = async (search_query, provider_id) => {
    const bookings = await SalesInvoice.findMany({
        where: {
            provider_id: provider_id,
            invoice_type: "Booking",
            OR: [
                {
                    provider_customer: {
                        customer_name: {
                            contains: search_query,
                            mode: 'insensitive'
                        }
                    }
                },
                {
                    provider_customer: {
                        customer_phone: {
                            contains: search_query,
                            mode: 'insensitive'
                        }
                    }
                },
                {
                    invoice_number: {
                        contains: search_query,
                        mode: 'insensitive'
                    }
                }
            ]
        }
    });
    return bookings;
};

export { getProviderByUserId, searchBookingQuery };