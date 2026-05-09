import { getProviderByUserId, getCustomerById, getLedgerStatementByDate } from "./query.js";
import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";

const getCustomerLedgerByDateEndpoint = async (req, res) => {
    logger.info(`getCustomerLedgerByDateEndpoint`);
    try {
        let user_id;
    let staff_id;
    if (req.type === "staff") {
      user_id = req.user_id;
      staff_id = req.staff_id;
    } else {
      user_id = req.user_id;
      staff_id = null;
    }

    const franchise_id = req.franchise_id;

        logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        console.log(provider);
        if (!provider) {
            logger.error(`--- Provider not found for user_id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found for user_id: ${user_id} ---`);

        const { provider_customer_id, start_date, end_date } = req.query;

        // Validate required parameters
        if (!provider_customer_id) {
            logger.error(`--- Missing provider_customer_id parameter ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `provider_customer_id is required`);
        }

        if (!start_date || !end_date) {
            logger.error(`--- Missing start_date or end_date parameter ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `start_date and end_date are required`);
        }

        // Validate date format
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            logger.error(`--- Invalid date format ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Invalid date format. Use YYYY-MM-DD format`);
        }

        // Validate date range
        if (startDate > endDate) {
            logger.error(`--- Start date cannot be after end date ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Start date cannot be after end date`);
        }

        logger.info(`--- Fetching customer details for provider_customer_id: ${provider_customer_id} ---`);
        const customer = await getCustomerById(provider_customer_id, provider.id);
        if (!customer) {
            logger.error(`--- Customer not found for provider_customer_id: ${provider_customer_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Customer not found`);
        }
        logger.info(`--- Customer found for provider_customer_id: ${provider_customer_id} ---`);

        logger.info(`--- Fetching ledger statement for provider_customer_id: ${provider_customer_id} from ${start_date} to ${end_date} ---`);
        const ledgerStatement = await getLedgerStatementByDate(provider_customer_id, provider.id, franchise_id, startDate, endDate);
        logger.info(`--- Ledger statement fetched for provider_customer_id: ${provider_customer_id} ---`);
        

        logger.info(`--- Sorting ledger statement according to date ---`);
        ledgerStatement.sort((a, b) => new Date(a.date) - new Date(b.date));

        logger.info(`--- Ledger statement sorted according to date ---`);

        logger.info(`--- Adding balance to each Ledger Statement ---`);
        let balance = 0;

        let balance_ledger_statement = [];
        for (const statement of ledgerStatement) {
            const { date, voucher, invoice_number, credit, debit, tds_by_self, tds_by_party, } = statement;
            // if (credit > 0) {
            //     balance -= credit;
            // } else if (debit > 0) {
            //     balance += debit;
            // }
            if (debit > 0) {
                balance += debit;
            }
            if (credit > 0) {
                balance -= credit;
            }

            balance_ledger_statement.push({
                date,
                voucher,
                invoice_number,
                credit,
                debit,
                tds_by_self,
                tds_by_party,
                balance
            })
        }

        return returnResponse(res, StatusCodes.OK, `Ledger statement fetched successfully`, {balance_ledger_statement, customer});
    } catch (error) {
        logger.error(`Error in getCustomerLedgerByDateEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in getCustomerLedgerByDateEndpoint`);
    }
};

export default getCustomerLedgerByDateEndpoint;