import { Provider, Booking, ProviderCustomers, ProviderCustomerVehicle, VehicleBookingOthers, BookingTransactional, BookingCustomerRequirements, BookingParts, BookingServices, BookingServicePackages, BookingTechnicians,FranchiseOpenInventoryTransaction,SalesInvoice} from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: {
      user_id: user_id,
    },
  });
  return provider;
};

const getBookingByDateQuery = async (provider_id, franchise_id, start_date, end_date) => {
  const bookings = await Booking.findMany({
    where: {
      provider_id: provider_id,
      franchise_id: franchise_id,
      created_at: {
        gte: new Date(start_date),
        lte: new Date(end_date),
      },
    },
    orderBy: { created_at: 'desc' }
  });
  return bookings;
};

const getBookings = async (booking_id, provider_id, franchise_id) => {
    const booking = await Booking.findFirst({
        where: { id: booking_id, provider_id: provider_id, franchise_id: franchise_id },
    });
    return booking;
}
const getProviderCustomer = async (customer_id, provider_id) => {
    const customer = await ProviderCustomers.findFirst({
        where: { id: customer_id, provider_id: provider_id},
    });
    return customer;
}
  const getProviderCustomerVehicle = async (vehicle_id, customer_id) => {
      const vehicle = await ProviderCustomerVehicle.findFirst({
          where: { id: vehicle_id, provider_customer_id: customer_id},
      });
      return vehicle;
  }
const getVehicleBookingOthers = async (booking_id, provider_id, franchise_id) => {
    const vehicleBooking = await VehicleBookingOthers.findMany({
        where: { booking_id: booking_id, provider_id: provider_id, franchise_id: franchise_id },
    });
    return vehicleBooking;
}
const getBookingTransactional = async (booking_id, provider_id, franchise_id) => {
    const bookingTransactional = await BookingTransactional.findMany({
        where: { booking_id: booking_id, provider_id: provider_id, franchise_id: franchise_id },
    });
    if (bookingTransactional.length === 0) {
    return null;
  }

  // Assuming total_amount and due_amount are consistent across entries
  const total_estimated_cost = bookingTransactional[0].total_amount;
  const total_paid_amount = bookingTransactional.reduce((sum, t) => sum + t.amount, 0);
  const total_due_amount = bookingTransactional[bookingTransactional.length - 1].due_amount; // or: total_amount - paid_amount

  return {
    bookingTransactional,
    total_estimated_cost,
    total_paid_amount,
    total_due_amount,
  };
}
const getBookingCustomerRequirements = async (booking_id, provider_id, franchise_id) => {
    const requirements = await BookingCustomerRequirements.findMany({
        where: { booking_id: booking_id, provider_id: provider_id, franchise_id: franchise_id },
    });
    return requirements;
}
const getBookingParts = async (booking_id, provider_id, franchise_id) => {
    const parts = await BookingParts.findMany({
        where: { booking_id: booking_id, provider_id: provider_id, franchise_id: franchise_id },
    });
    return parts;
}
const getBookingService = async (booking_id, provider_id, franchise_id) => {
    const services = await BookingServices.findMany({
        where: { booking_id: booking_id, provider_id: provider_id, franchise_id: franchise_id },
        include: {
            franchise_service: true
        }
    });
    return services;
}
const getBookingServicesPackage = async (booking_id, provider_id, franchise_id) => {
    const servicePackages = await BookingServicePackages.findMany({
        where: { booking_id: booking_id, provider_id: provider_id, franchise_id: franchise_id },
    });
    return servicePackages;
}
const getBookingTechnicians = async (booking_id, provider_id, franchise_id) => {
    const technicians = await BookingTechnicians.findMany({
        where: { booking_id: booking_id, provider_id: provider_id, franchise_id: franchise_id },
    });
    return technicians;
}

const getConsumedParts = async (booking_id, provider_id, franchise_id) => {
    const consumedParts = await FranchiseOpenInventoryTransaction.findMany({
        where: { booking_id: booking_id, provider_id: provider_id, franchise_id: franchise_id, action: 'reduce' },
        include: { franchise_open_inventory: true }
    });
    return consumedParts;
}

const getSalesInvoiceFromBooking = async (booking_id, provider_id, franchise_id) => {
    const salesInvoice = await SalesInvoice.findFirst({
        where: { booking_id: booking_id, provider_id: provider_id, franchise_id: franchise_id },
        include:{
            SalesInvoiceTransactions:true
        }
    });
    return salesInvoice;
}

export { getBookingByDateQuery, getProviderByUserId, getBookings, getProviderCustomer, getProviderCustomerVehicle, getVehicleBookingOthers, getBookingTransactional, getBookingCustomerRequirements, getBookingParts, getBookingService, getBookingServicesPackage, getBookingTechnicians, getConsumedParts,getSalesInvoiceFromBooking };
