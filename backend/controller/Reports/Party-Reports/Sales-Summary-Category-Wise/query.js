import { CustomerCategory, Provider , SalesInvoice } from "../../../../prisma/db-models.js";
import { parseDate } from "../../../../services/parse-date.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    })
    return provider;
};

// const getSalesSummaryCategoryWise = async (provider_id, category_id, start_date, end_date ) => {
//     const today =  new Date()
//             let startDateFilter  , endDateFilter

//             if(!start_date && !end_date){
//                 startDateFilter = parseDate(today)
//                 startDateFilter.setDate(startDateFilter.getDate() - 30)
//                 endDateFilter = parseDate(today)
//             }
//             else if(start_date && !end_date){
//                 startDateFilter = parseDate(start_date)
//                 endDateFilter = parseDate(today ,  true)
//             }
//            else if(!start_date && end_date){
//                 startDateFilter = new Date('1970-01-01');
//                 endDateFilter = parseDate(end_date , true)
//             }
//             else {
//     startDateFilter = parseDate(start_date);
//     endDateFilter = parseDate(end_date, true);
//             }
//     const whereClause = { provider_id: provider_id ,
//         created_at : {gte: startDateFilter, lte:endDateFilter},
//         invoice_type : 'Sales'
//     };

//     if (category_id) {
//    whereClause.provider_customer = {
//    is: {
//         customer_category_id: category_id, 
//       },
// };
//   }
//     const sales_summary = await SalesInvoice.findMany({
//         where: whereClause,
//         include: {
//       provider_customer: {
//         select: {
//           id: true,
//           customer_category_id: true,
//         },
//       },
//     },
        
//     })
//     return sales_summary;
// }

const getSalesSummaryCategoryWise = async (provider_id, franchise_id, start_date, end_date ) => {
    const today = new Date();
    let startDateFilter, endDateFilter;

    if (!start_date && !end_date) {
        startDateFilter = parseDate(today);
        startDateFilter.setDate(startDateFilter.getDate() - 30);
        endDateFilter = parseDate(today);
    } else if (start_date && !end_date) {
        startDateFilter = parseDate(start_date);
        endDateFilter = parseDate(today, true);
    } else if (!start_date && end_date) {
        startDateFilter = new Date('1970-01-01');
        endDateFilter = parseDate(end_date, true);
    } else {
        startDateFilter = parseDate(start_date);
        endDateFilter = parseDate(end_date, true);
    }

    const whereClause = { 
        provider_id: provider_id,
        franchise_id: franchise_id,
        created_at: { gte: startDateFilter, lte: endDateFilter },
        invoice_type: 'Sales'
    };

    const sales_summary = await SalesInvoice.findMany({
        where: whereClause,
        include: {
            provider_customer: {
                select: {
                    id: true,
                    customer_name: true,
                    customer_category_id: true,
                }
            },
        },
    });

    // ✅ GROUP BY category_id (including null → "uncategorized")

    // Then group the results
    const grouped = sales_summary.reduce((acc, item) => {
        const categoryId = item.provider_customer?.customer_category_id || "No-Category";

        if (!acc[categoryId]) {
            acc[categoryId] = [];
        }

        acc[categoryId].push(item);
        return acc;
    }, {});
    // console.log('Grouped Sales Summary:', grouped);
    return grouped;
};


export { getProviderByUserId, getSalesSummaryCategoryWise };