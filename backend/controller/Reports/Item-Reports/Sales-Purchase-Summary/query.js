
import { parseDate } from "../../../../services/parse-date.js";
import { Provider, FranchiseInventory, PurchaseInvoice, PurchasePart } from "../../../../prisma/db-models.js";


const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    })
    return provider;
};


const getProviderProducts = async (provider_id,franchise_id, category_id, start_date, end_date) => {

    const whereClause = {
        provider_id: provider_id,
        franchise_id: franchise_id,
        product_status: 'active'
    }
    if (category_id) {
        whereClause.category_id = category_id
    }
    
    const today = new Date()
    let startDateFilter, endDateFilter

    if (!start_date && !end_date) {
        startDateFilter = parseDate(today)
        startDateFilter.setDate(startDateFilter.getDate() - 30)
        endDateFilter = parseDate(today)
    }
    else if (start_date && !end_date) {
        startDateFilter = parseDate(start_date)
        endDateFilter = parseDate(today, true)
    }
    else if (!start_date && end_date) {
        startDateFilter = new Date('1970-01-01');
        endDateFilter = parseDate(end_date, true)
    }
    else {
        startDateFilter = parseDate(start_date);
        endDateFilter = parseDate(end_date, true);
    }


    const products = await FranchiseInventory.findMany({
        where: whereClause,
        include: {
            // category: {
            //     select: {
            //         id: true,
            //         category_name: true
            //     }
            // },
            PurchasePart: {
                where: {
                    purchase_invoice: {
                        invoice_type: "Purchase"
                    },
                    created_at: {
                        gte: startDateFilter,
                        lte: endDateFilter
                    }
                }
            },
            SalesPart: {
                where: {
                    sales_invoice: {
                        invoice_type: "Sales"
                    }, created_at: {
                        gte: startDateFilter,
                        lte: endDateFilter
                    }
                }
            }
        },

    })
    return products;
};


export { getProviderByUserId, getProviderProducts };