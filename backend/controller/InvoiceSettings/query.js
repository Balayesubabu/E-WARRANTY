import { Provider, InvoiceSettings } from "../../prisma/db-models.js";

// ✅ Get provider by user_id
const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: { user_id, is_deleted: false },
    include: {
      user: true,
      InvoiceSettings: {
        // ⚠️ Use exact field name from Prisma schema
        include: {
          colors: true,
          invoiceDetails: true,
          customFields: true,
        },
      },
    },
  });
  return provider;
};

// ✅ Create InvoiceSettings for a provider
const createInvoiceSettings = async (provider_id, data) => {
  console.log("Creating InvoiceSettings with data:", data);

  const invoiceSettings = await InvoiceSettings.create({
    data: {
      provider_id,
      selectedTheme: data.selectedTheme,
      selectedColor: data.selectedColor,
      colors: {
        create: data.colors.map((c) => ({ value: c })),
      },
      invoiceDetails: {
        create: data.invoiceDetails.map((d) => ({
          name: d.name,
          flag: d.flag,
        })),
      },
      customFields: {
        create: data.customFields.map((f) => ({
          name: f.name,
          value: f.value,
        })),
      },
    },
    include: {
      colors: true,
      invoiceDetails: true,
      customFields: true,
    },
  });

  console.log("InvoiceSettings created:", invoiceSettings);
  return invoiceSettings;
};

// ✅ Get all InvoiceSettings for a provider
const getInvoiceSettings = async (provider_id) => {
  const invoiceSettings = await InvoiceSettings.findFirst({
    where: { provider_id },
    include: {
      colors: true,
      invoiceDetails: true,
      customFields: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return invoiceSettings; // returns object or null
};

// Update InvoiceSettings by id and provider_id
const updateInvoiceSettings = async (id, provider_id, data) => {
  // Ensure the record exists
  const existing = await InvoiceSettings.findFirst({
    where: { id, provider_id },
  });

  if (!existing) return null;

  const updatedInvoiceSettings = await InvoiceSettings.update({
    where: { id },
    data: {
      selectedTheme: data.selectedTheme,
      selectedColor: data.selectedColor,
      colors: {
        deleteMany: {}, // delete all previous colors
        create: data.colors.map((c) => ({ value: c })),
      },
      invoiceDetails: {
        deleteMany: {},
        create: data.invoiceDetails.map((d) => ({
          name: d.name,
          flag: d.flag,
        })),
      },
      customFields: {
        deleteMany: {},
        create: data.customFields.map((f) => ({
          name: f.name,
          value: f.value,
        })),
      },
    },
    include: {
      colors: true,
      invoiceDetails: true,
      customFields: true,
    },
  });

  return updatedInvoiceSettings;
};

// ✅ Delete InvoiceSettings by id and provider_id
const deleteInvoiceSettings = async (id, provider_id) => {
  console.log(
    `Deleting InvoiceSettings with id: ${id} for provider_id: ${provider_id}`
  );

  // Ensure the record exists
  const existing = await InvoiceSettings.findFirst({
    where: { id, provider_id },
    include: {
      colors: true,
      invoiceDetails: true,
      customFields: true,
    },
  });

  if (!existing) {
    console.log("InvoiceSettings not found");
    return null;
  }

  // Delete the InvoiceSettings
  const deletedInvoiceSettings = await InvoiceSettings.delete({
    where: { id },
    include: {
      colors: true,
      invoiceDetails: true,
      customFields: true,
    },
  });

  console.log("InvoiceSettings deleted:", deletedInvoiceSettings);
  return deletedInvoiceSettings;
};

export {
  getProviderByUserId,
  createInvoiceSettings,
  getInvoiceSettings,
  updateInvoiceSettings,
  deleteInvoiceSettings,
};
