import {
  Provider, ProviderDealer, DealerPurchaseOrder, DealerPurchaseItem,
  DealerSalesEntry, DealerLedger, ProviderWarrantyCustomer, ProviderProductWarrantyCode,
} from "../../../prisma/db-models.js";

// ─── Provider / Dealer lookups ───

export const getProviderByUserId = async (user_id) => {
  return Provider.findFirst({ where: { user_id } });
};

export const getDealerById = async (dealer_id) => {
  return ProviderDealer.findUnique({ where: { id: dealer_id } });
};

export const getDealerByLoginEmail = async (email) => {
  return ProviderDealer.findFirst({ where: { email, is_deleted: false } });
};

// ─── Dashboard Stats ───

export const getDealerDashboardStats = async (dealer_id, provider_id) => {
  const purchaseOrders = await DealerPurchaseOrder.findMany({
    where: { dealer_id },
    include: { items: true },
  });

  const salesEntries = await DealerSalesEntry.findMany({ where: { dealer_id } });

  const warrantyCount = await ProviderWarrantyCustomer.count({ where: { dealer_id } });

  // Pending registration approvals: customer self-registrations awaiting dealer approval
  const pendingApprovals = await ProviderWarrantyCustomer.count({
    where: { dealer_id, is_active: false },
  });

  const dealer = await ProviderDealer.findUnique({
    where: { id: dealer_id },
    select: { credit_limit: true, opening_balance: true },
  });

  let totalPurchased = 0;
  let totalPurchaseAmount = 0;
  let totalOutstanding = 0;
  purchaseOrders.forEach((po) => {
    po.items.forEach((item) => { totalPurchased += item.quantity; });
    totalPurchaseAmount += po.total_amount;
    totalOutstanding += po.pending_amount;
  });

  const totalSold = salesEntries.length;
  const availableStock = totalPurchased - totalSold;

  return {
    totalPurchased,
    totalSold,
    availableStock: Math.max(0, availableStock),
    totalWarranties: warrantyCount,
    pendingApprovals,
    totalPurchaseAmount,
    totalOutstanding,
    creditLimit: dealer?.credit_limit || 0,
    availableCredit: Math.max(0, (dealer?.credit_limit || 0) - totalOutstanding),
  };
};

// ─── Purchase Orders ───

export const createPurchaseOrder = async (data) => {
  const order = await DealerPurchaseOrder.create({
    data: {
      dealer_id: data.dealer_id,
      provider_id: data.provider_id,
      order_number: data.order_number,
      order_date: data.order_date ? new Date(data.order_date) : new Date(),
      total_amount: data.total_amount,
      discount_amount: data.discount_amount || 0,
      tax_amount: data.tax_amount || 0,
      pending_amount: data.total_amount,
      due_date: data.due_date ? new Date(data.due_date) : null,
      notes: data.notes,
      items: {
        create: (data.items || []).map((item) => ({
          product_name: item.product_name,
          model_number: item.model_number || null,
          serial_numbers: item.serial_numbers || [],
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.quantity * item.unit_price,
        })),
      },
    },
    include: { items: true, dealer: { select: { name: true, email: true } } },
  });
  return order;
};

export const getPurchaseOrdersByDealer = async (dealer_id) => {
  return DealerPurchaseOrder.findMany({
    where: { dealer_id },
    include: { items: true },
    orderBy: { order_date: "desc" },
  });
};

export const getPurchaseOrderById = async (order_id) => {
  return DealerPurchaseOrder.findUnique({
    where: { id: order_id },
    include: { items: true, dealer: { select: { name: true, email: true, phone_number: true } } },
  });
};

// ─── Sales Entry ───

export const createSalesEntry = async (data) => {
  return DealerSalesEntry.create({
    data: {
      dealer_id: data.dealer_id,
      provider_id: data.provider_id,
      product_name: data.product_name,
      model_number: data.model_number || null,
      serial_number: data.serial_number || null,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      customer_email: data.customer_email || null,
      invoice_number: data.invoice_number || null,
      sale_date: data.sale_date ? new Date(data.sale_date) : new Date(),
      sale_amount: data.sale_amount || 0,
      invoice_file: data.invoice_file || null,
      warranty_customer_id: data.warranty_customer_id || null,
      notes: data.notes || null,
    },
  });
};

export const getSalesEntriesByDealer = async (dealer_id) => {
  return DealerSalesEntry.findMany({
    where: { dealer_id },
    orderBy: { sale_date: "desc" },
  });
};

// ─── Inventory (Computed) ───

export const getDealerInventory = async (dealer_id) => {
  const purchaseOrders = await DealerPurchaseOrder.findMany({
    where: { dealer_id },
    include: { items: true },
  });

  const salesEntries = await DealerSalesEntry.findMany({
    where: { dealer_id },
    select: { product_name: true, model_number: true },
  });

  const inventory = {};

  purchaseOrders.forEach((po) => {
    po.items.forEach((item) => {
      const key = `${item.product_name}||${item.model_number || ""}`;
      if (!inventory[key]) {
        inventory[key] = { product_name: item.product_name, model_number: item.model_number || "", purchased: 0, sold: 0 };
      }
      inventory[key].purchased += item.quantity;
    });
  });

  salesEntries.forEach((sale) => {
    const key = `${sale.product_name}||${sale.model_number || ""}`;
    if (inventory[key]) {
      inventory[key].sold += 1;
    } else {
      inventory[key] = { product_name: sale.product_name, model_number: sale.model_number || "", purchased: 0, sold: 1 };
    }
  });

  return Object.values(inventory).map((item) => ({
    ...item,
    available: Math.max(0, item.purchased - item.sold),
  }));
};

// ─── Ledger ───

export const createLedgerEntry = async (data) => {
  const entry = await DealerLedger.create({
    data: {
      dealer_id: data.dealer_id,
      provider_id: data.provider_id,
      purchase_order_id: data.purchase_order_id || null,
      transaction_type: data.transaction_type || "PAYMENT",
      amount: data.amount,
      payment_mode: data.payment_mode || "OTHER",
      transaction_date: data.transaction_date ? new Date(data.transaction_date) : new Date(),
      reference_number: data.reference_number || null,
      notes: data.notes || null,
    },
  });

  if (data.purchase_order_id && data.transaction_type === "PAYMENT") {
    const po = await DealerPurchaseOrder.findUnique({ where: { id: data.purchase_order_id } });
    if (po) {
      const newPaid = po.paid_amount + data.amount;
      const newPending = Math.max(0, po.total_amount - newPaid);
      const newStatus = newPending <= 0 ? "PAID" : newPaid > 0 ? "PARTIAL" : "UNPAID";
      await DealerPurchaseOrder.update({
        where: { id: data.purchase_order_id },
        data: { paid_amount: newPaid, pending_amount: newPending, payment_status: newStatus },
      });
    }
  }

  return entry;
};

export const getLedgerByDealer = async (dealer_id) => {
  return DealerLedger.findMany({
    where: { dealer_id },
    include: { purchase_order: { select: { order_number: true, total_amount: true } } },
    orderBy: { transaction_date: "desc" },
  });
};

export const getDealerLedgerSummary = async (dealer_id) => {
  const dealer = await ProviderDealer.findUnique({
    where: { id: dealer_id },
    select: { credit_limit: true, opening_balance: true },
  });

  const orders = await DealerPurchaseOrder.findMany({ where: { dealer_id } });

  let totalInvoiced = 0;
  let totalPaid = 0;
  let totalOutstanding = 0;
  let overdueAmount = 0;
  const now = new Date();

  orders.forEach((o) => {
    totalInvoiced += o.total_amount;
    totalPaid += o.paid_amount;
    totalOutstanding += o.pending_amount;
    if (o.due_date && new Date(o.due_date) < now && o.pending_amount > 0) {
      overdueAmount += o.pending_amount;
    }
  });

  return {
    creditLimit: dealer?.credit_limit || 0,
    totalInvoiced,
    totalPaid,
    totalOutstanding,
    overdueAmount,
    availableCredit: Math.max(0, (dealer?.credit_limit || 0) - totalOutstanding),
  };
};

// ─── Business Profile ───

export const updateDealerBusinessProfile = async (dealer_id, data) => {
  return ProviderDealer.update({
    where: { id: dealer_id },
    data: {
      ...(data.gst_number !== undefined && { gst_number: data.gst_number }),
      ...(data.pan_number !== undefined && { pan_number: data.pan_number }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.city !== undefined && { city: data.city }),
      ...(data.state !== undefined && { state: data.state }),
      ...(data.country !== undefined && { country: data.country }),
      ...(data.pin_code !== undefined && { pin_code: data.pin_code }),
      ...(data.bank_name !== undefined && { bank_name: data.bank_name }),
      ...(data.bank_account_number !== undefined && { bank_account_number: data.bank_account_number }),
      ...(data.bank_ifsc_code !== undefined && { bank_ifsc_code: data.bank_ifsc_code }),
    },
  });
};

// ─── Dealer Warranty Codes ───

export const getDealerWarrantyCodes = async (dealer_id, options = {}) => {
  const { 
    page = 1, 
    limit = 20, 
    status = null,
    search = null,
    sort_by = "created_at",
    sort_order = "desc"
  } = options;

  const skip = (page - 1) * limit;

  const where = {
    assigned_dealer_id: dealer_id,
    is_deleted: false,
  };

  if (status) {
    where.warranty_code_status = status;
  }

  if (search) {
    where.OR = [
      { warranty_code: { contains: search, mode: "insensitive" } },
      { product_name: { contains: search, mode: "insensitive" } },
      { serial_no: { contains: search, mode: "insensitive" } },
    ];
  }

  const [codes, total] = await Promise.all([
    ProviderProductWarrantyCode.findMany({
      where,
      orderBy: { [sort_by]: sort_order },
      skip,
      take: limit,
      select: {
        id: true,
        warranty_code: true,
        product_name: true,
        serial_no: true,
        warranty_code_status: true,
        type: true,
        warranty_days: true,
        warranty_from: true,
        warranty_to: true,
        warranty_period_readable: true,
        created_at: true,
        updated_at: true,
        batch: {
          select: {
            id: true,
            batch_name: true,
          }
        },
        ProviderWarrantyCustomer: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            phone: true,
            email: true,
            date_of_installation: true,
            created_at: true,
          },
          take: 1,
        }
      }
    }),
    ProviderProductWarrantyCode.count({ where })
  ]);

  return {
    codes: codes.map(code => {
      const customer = code.ProviderWarrantyCustomer?.[0] || null;
      return {
        ...code,
        customer: customer ? {
          id: customer.id,
          customer_name: `${customer.first_name}${customer.last_name ? ' ' + customer.last_name : ''}`,
          customer_phone: customer.phone,
          customer_email: customer.email,
          activation_date: customer.date_of_installation || customer.created_at,
        } : null,
        is_activated: code.ProviderWarrantyCustomer?.length > 0,
      };
    }),
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    }
  };
};

export const getDealerWarrantyCodeStats = async (dealer_id) => {
  const [total, active, pending, activated] = await Promise.all([
    ProviderProductWarrantyCode.count({
      where: { assigned_dealer_id: dealer_id, is_deleted: false }
    }),
    ProviderProductWarrantyCode.count({
      where: { assigned_dealer_id: dealer_id, is_deleted: false, warranty_code_status: "Active" }
    }),
    ProviderProductWarrantyCode.count({
      where: { assigned_dealer_id: dealer_id, is_deleted: false, warranty_code_status: "Pending" }
    }),
    ProviderProductWarrantyCode.count({
      where: { 
        assigned_dealer_id: dealer_id, 
        is_deleted: false,
        ProviderWarrantyCustomer: { some: {} }
      }
    }),
  ]);

  return {
    total_codes: total,
    active_codes: active,
    pending_codes: pending,
    activated_codes: activated,
    unused_codes: total - activated,
  };
};

export const getDealerWarrantyCodesForPDF = async (dealer_id, options = {}) => {
  const { status = null, search = null } = options;

  const where = {
    assigned_dealer_id: dealer_id,
    is_deleted: false,
  };

  if (status) {
    where.warranty_code_status = status;
  }

  if (search) {
    where.OR = [
      { warranty_code: { contains: search, mode: "insensitive" } },
      { product_name: { contains: search, mode: "insensitive" } },
      { serial_no: { contains: search, mode: "insensitive" } },
    ];
  }

  const codes = await ProviderProductWarrantyCode.findMany({
    where,
    orderBy: { created_at: 'asc' },
    select: {
      id: true,
      warranty_code: true,
      product_name: true,
      product_id: true,
      service_id: true,
      serial_no: true,
      warranty_code_status: true,
      warranty_days: true,
      warranty_from: true,
      warranty_to: true,
      warranty_period_readable: true,
      custom_value1: true,
      custom_value2: true,
      provider_id: true,
    }
  });

  return codes;
};
