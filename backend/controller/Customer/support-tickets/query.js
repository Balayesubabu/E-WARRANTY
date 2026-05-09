import { User, Provider, SupportTicket, Franchise } from "../../../prisma/db-models.js";

export const getUserById = async (userId) => {
  return User.findUnique({ where: { id: userId } });
};

export const getProviderById = async (providerId) => {
  return Provider.findFirst({
    where: { id: providerId },
    include: { user: true },
  });
};

export const getFranchiseByProviderId = async (providerId) => {
  return Franchise.findFirst({
    where: { provider_id: providerId },
  });
};

export const createSupportTicket = async ({ provider_id, franchise_id, title, description, customer_name, customer_phone, customer_email }) => {
  return SupportTicket.create({
    data: {
      provider_id,
      franchise_id,
      title,
      description: `Customer: ${customer_name}\nPhone: ${customer_phone}\nEmail: ${customer_email}\n\n${description}`,
      status: "New",
      staff_id: null,
    },
  });
};

export const getCustomerSupportTickets = async (phone, email, providerId) => {
  if (!phone && !email) return [];

  const phoneDigits = phone ? phone.replace(/\D/g, "").slice(-10) : null;
  
  const tickets = await SupportTicket.findMany({
    where: {
      ...(providerId ? { provider_id: providerId } : {}),
      OR: [
        ...(phoneDigits ? [{ description: { contains: phoneDigits } }] : []),
        ...(email ? [{ description: { contains: email, mode: "insensitive" } }] : []),
      ],
    },
    include: {
      provider: { include: { user: { select: { first_name: true, last_name: true } } } },
    },
    orderBy: { created_at: "desc" },
    take: 50,
  });

  return tickets;
};
