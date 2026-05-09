// import { getProviderByUserId, getAllTransactions } from "./query.js";
// import { logger, returnError, returnResponse } from "../../../../services/logger.js";
// import { StatusCodes } from "http-status-codes";

// const getPartyStatementLedger = async (req, res) => {
//     try {
//           logger.info(`get user id`);
//            let user_id;
//         let staff_id;
//         if(req.type == 'staff'){
//            user_id = req.provider_id;
//             staff_id = req.staff_id;
//         }
//         if(req.type == 'provider'){
//             user_id = req.user_id;
//             staff_id = null;
//         }
//         const franchise_id = req.franchise_id;
//         logger.info(`user id is ${user_id}`);

//         logger.info(`--- Fetching provider id from the user id ${user_id} ---`);
//         const provider = await getProviderByUserId(user_id);
//         if (!provider) {
//             logger.error(`--- Provider not found with user id ${user_id} ---`);
//             return returnError(res, StatusCodes.NOT_FOUND, `Provider not found with user id ${req.user_id}`);
//         }
//         logger.info(`--- Provider found with user id ${user_id} ---`);

//         const { start_date, end_date ,provider_customer_id} = req.query;
//         logger.info(`--- Fetching transactions from the provider id ${provider.id} ---`);
//         const transactions = await getAllTransactions(provider.id , franchise_id,start_date, end_date, provider_customer_id);
//         if (!transactions) {
//             logger.error(`--- transactions not found for provider id ${provider.id} ---`);
//             return returnError(res, StatusCodes.NOT_FOUND, `transactions not found for provider id ${provider.id}`);
//         }
//         logger.info(`--- transactions found for provider id ${provider.id} ---`);
//         return returnResponse(res, StatusCodes.OK, transactions);
//     } catch (error) {
//         return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
//     }
// }

// export { getPartyStatementLedger };

import { getProviderByUserId, getCustomerById, getLedgerStatementByDate } from "./query.js";
import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";

const getPartyStatementLedger = async (req, res) => {
    try {
        logger.info(`get user id`);
        let user_id;
        let staff_id;
        if(req.type == 'staff'){
            user_id = req.provider_id;
            staff_id = req.staff_id;
        }
        if(req.type == 'provider'){
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
        
                const { provider_customer_id} = req.query;
        
                // Validate required parameters
                if (!provider_customer_id) {
                    logger.error(`--- Missing provider_customer_id parameter ---`);
                    return returnError(res, StatusCodes.BAD_REQUEST, `provider_customer_id is required`);
                }
                // Validate date format
                logger.info(`--- Fetching customer details for provider_customer_id: ${provider_customer_id} ---`);
                const customer = await getCustomerById(provider_customer_id, provider.id);
                if (!customer) {
                    logger.error(`--- Customer not found for provider_customer_id: ${provider_customer_id} ---`);
                    return returnError(res, StatusCodes.NOT_FOUND, `Customer not found`);
                }
                logger.info(`--- Customer found for provider_customer_id: ${provider_customer_id} ---`);
        
                logger.info(`--- Fetching ledger statement for provider_customer_id: ${provider_customer_id} ---`);
                const ledgerStatement = await getLedgerStatementByDate(provider_customer_id, provider.id, franchise_id);
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
                        balance: Number(balance.toFixed(2))
                    })
                }
        
                const ledgerData = balance_ledger_statement;
        
                return returnResponse(res, StatusCodes.OK, `Ledger statement fetched successfully`, ledgerData);
            } catch (error) {
                logger.error(`Error in getCustomerLedgerByDateEndpoint: ${error}`);
                return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in getCustomerLedgerByDateEndpoint`);
            }
        };

export { getPartyStatementLedger };