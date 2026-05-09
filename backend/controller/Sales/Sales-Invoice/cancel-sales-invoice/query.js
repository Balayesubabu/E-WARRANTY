import { Provider,
  ProviderCustomers,
  SalesInvoice,
  SalesPart,
  SalesService,
  SalesInvoiceTransactions,
  Transaction,
  FranchiseInventory,
  SalesInvoiceParty, } from "../../../../prisma/db-models.js";

  const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
      where: {
        user_id: user_id,
      },
    });
    return provider;
  };

  const getSalesInvoiceById = async(provider_id, sales_invoice_id) => {
      const sales_invoice = await SalesInvoice.findFirst({
          where: {
              id: sales_invoice_id,
              provider_id: provider_id
          },
          include: {
        SalesPart: true,
        SalesService: true,
        SalesInvoiceTransactions: true,
        Transaction: true,
      },
      })
      return sales_invoice
  }

  const updateCustomerBalance = async (provider_id, provider_customer_id, balance_difference) => {
      const customer_final_balance = await ProviderCustomers.update({
          where: {
              id: provider_customer_id,
              provider_id: provider_id
          },
          data: {
              customer_final_balance: {
                  increment: balance_difference,
              },
          },
      })
  }
  
  const restoreFranchiseInventory = async (franchise_inventory_id, quantity) => {
      const franchiseInventory = await FranchiseInventory.update({
          where: {
              id: franchise_inventory_id,
          },
          data: {
              product_quantity: {
                  increment: quantity,
              },
          },
      })
  }

  const changeStatusOfSalesInvoice = async(provider_id , sales_invoice_id) => {
      const sales_invoice = await SalesInvoice.update({
          where: {
              id: sales_invoice_id,
              provider_id: provider_id
          },
          data : {
           invoice_status : "Cancelled"
          }
      })
  }

  const changeStatusOfSalesTransaction = async( sales_invoice_id) => {
      const sales_invoice_Transaction = await SalesInvoiceTransactions.updateMany({
          where: {
              sales_invoice_id: sales_invoice_id
          },
          data : {
           isActive : false
          }
      })
  }

  const changeStatusOfTransaction = async(provider_id , sales_invoice_id) => {
      const transaction = await Transaction.updateMany({
          where: {
              sales_invoice_id: sales_invoice_id,
              provider_id: provider_id
              
          },
          data : {
           isActive : false
          }
      })
  }
  
  export { getProviderByUserId , getSalesInvoiceById,updateCustomerBalance, restoreFranchiseInventory,changeStatusOfSalesInvoice,changeStatusOfSalesTransaction ,changeStatusOfTransaction};