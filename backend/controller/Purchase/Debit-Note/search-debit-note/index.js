import { StatusCodes } from "http-status-codes";
import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { getProviderByUserId, searchDebitNoteQuery } from "./query.js";

const searchDebitNoteEndpoint = async (req, res) => {
  try {
    logger.info(`searchDebitNoteEndpoint`);

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

    logger.info(`--- Getting provider details with user_id : ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found with user_id : ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
    }
    logger.info(`--- Provider found with id : ${provider.id} ---`);

    const { search_query } = req.query;

    logger.info(
      `--- Searching debit notes with search_query : ${search_query} ---`
    );
    const debit_notes = await searchDebitNoteQuery(search_query, provider.id, staff_id, franchise_id);

    if (debit_notes.length === 0) {
      logger.info(
        `--- No debit notes found with search_query : ${search_query} and provider_id : ${provider.id} ---`
      );
      return returnResponse(res, StatusCodes.OK, `No debit notes found`, []);
    }

    logger.info(
      `--- Debit notes found with search_query : ${search_query} and provider_id : ${provider.id} ---`
    );
    return returnResponse(
      res,
      StatusCodes.OK,
      `Debit notes fetched successfully`,
      debit_notes
    );
  } catch (error) {
    logger.error(`Error in searchDebitNoteEndpoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in searchDebitNoteEndpoint`
    );
  }
};

export default searchDebitNoteEndpoint;
