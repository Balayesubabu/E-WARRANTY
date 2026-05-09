import { getProviderByUserId, getCustomersOutStanding,getLedgerStatementByDate } from "./query.js";
import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";

const getCustomersOutStandingEndpoint = async (req , res) => {
    try {
        logger.info(`get user id`);
           let user_id;
        let staff_id;
        if(req.type == 'staff'){
           user_id = req.user_id;
            staff_id = req.staff_id;
        }
        if(req.type == 'provider'){
            user_id = req.user_id;
            staff_id = null;
        }
        const franchise_id = req.franchise_id;
        logger.info(`user id is ${user_id}`);

        logger.info(`--- Fetching provider id from the user id ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user id ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found with user id ${req.user_id}`);
        }
        logger.info(`--- Provider found with user id ${user_id} ---`);

        const {customer_category_id, start_date, end_date} = req.query;
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        logger.info(`--- Fetching customersOutStanding from the provider id ${provider.id} ---`);
        const customersOutStanding = await getCustomersOutStanding(provider.id,  customer_category_id);
        if (!customersOutStanding) {
            logger.error(`---customersOutStanding not found provider id ${provider.id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `customersOutStanding not found for provider id ${provider.id}`);
        }
        logger.info(`--- customersOutStanding found for provider id ${provider.id} ---`);

        for (let i = 0; i < customersOutStanding.length; i++) {
        const ledgerStatement = await getLedgerStatementByDate( customersOutStanding[i].id, provider.id, franchise_id, startDate, endDate);
        console.log(ledgerStatement);
        

        logger.info(`--- Sorting ledger statement according to date ---`);
        ledgerStatement.sort((a, b) => new Date(a.date) - new Date(b.date));

        logger.info(`--- Ledger statement sorted according to date ---`);

        logger.info(`--- Adding balance to each Ledger Statement ---`);
        let balance = 0;

        let balance_ledger_statement = [];
        for (const statement of ledgerStatement) {
            const { date, voucher, invoice_number, credit, debit, tds_by_self, tds_by_party, } = statement;
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
        customersOutStanding[i].customer_final_balance = balance_ledger_statement.length > 0 ? Number(balance_ledger_statement[balance_ledger_statement.length - 1].balance).toFixed(2) : "0.00";
    }
    const result = customersOutStanding.map(({ customer_category_id, id, ...rest }) => rest);
        return returnResponse(res, StatusCodes.OK, `customersOutStanding fetched successfully`, result);
    } catch (error) {
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
}

export { getCustomersOutStandingEndpoint };