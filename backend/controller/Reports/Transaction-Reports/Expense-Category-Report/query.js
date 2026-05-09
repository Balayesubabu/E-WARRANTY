import { parseDate } from "../../../../services/parse-date.js";
import { Provider , Expenses, ExpenseCategory } from "../../../../prisma/db-models.js";
import { logger } from "../../../../services/logger.js";


const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    })
    return provider;
};


const getExpenseCategory = async (provider_id,franchise_id, start_date, end_date) => {
 
  // Date filter logic
  const today = new Date(); // May 29, 2025, 17:27 IST
  let startDateFilter, endDateFilter;

  logger.info(`Raw query params: start_date=${start_date}, end_date=${end_date}`);

  if (!start_date && !end_date) {
    // Default: last 30 days
    startDateFilter = new Date(today);
    startDateFilter.setDate(today.getDate() - 30);
    endDateFilter = new Date(today);
  } else if (start_date && !end_date) {
    // From start_date to today
    startDateFilter = parseDate(start_date ); ;
    endDateFilter = new Date(today);
  } else if (!start_date && end_date) {
    // From earliest date to end_date
    startDateFilter = new Date('1970-01-01');
    endDateFilter = parseDate(end_date, true);
  } else {
    // Both start_date and end_date provided
    startDateFilter = parseDate(start_date);
    endDateFilter = parseDate(end_date);
  }

logger.info(`Filtered query params: start_date=${startDateFilter}, end_date=${endDateFilter}`);

  const expenses = await ExpenseCategory.findMany({
    where: {
      provider_id: provider_id,
      franchise_id: franchise_id,
      created_at: {
        gte: startDateFilter,
        lte: endDateFilter,
      },
      is_active: true,
      is_deleted: false,
    },
    include: {
      Expenses: {
        where:{
          is_active: true,
          is_deleted: false,
        },
        select: {
          id: true,
          price: true,
        },
      },
    },
    orderBy: {
      created_at: 'asc',
    },
  });

  return expenses;
};

export { getProviderByUserId, getExpenseCategory };