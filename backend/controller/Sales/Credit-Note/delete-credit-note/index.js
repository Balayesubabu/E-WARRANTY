import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { PrismaClient } from "@prisma/client";
import {
  getProviderByUserId,
  getCreditNoteById,
  clearCreditNoteRecords,
  deleteCreditNote,
} from "./query.js";

const prisma = new PrismaClient();

const deleteCreditNoteEndpoint = async (req, res) => {
  try {
    logger.info(`deleteCreditNoteEndpoint`);
    const { credit_note_id } = req.params;
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
        const franchise_id = req.franchise_id  

    logger.info(`--- Fetching provider by user id ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found with user id: ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
    }

    logger.info(`--- Starting DB transaction for credit note deletion ---`);
    const result = await prisma.$transaction(async (tx) => {
      logger.info(`--- Fetching credit note by id ---`);
      const creditNote = await getCreditNoteById(
        credit_note_id,
        provider.id,
        tx
      );
      if (!creditNote) {
        throw new Error(`Credit note not found with id: ${credit_note_id}`);
      }

      logger.info(`--- Clearing related records ---`);
      await clearCreditNoteRecords(credit_note_id, tx);

      logger.info(`--- Deleting credit note ---`);
      const deleted = await deleteCreditNote(credit_note_id, tx);
      if (!deleted) {
        throw new Error("Failed to delete credit note");
      }

      return deleted;
    });

    logger.info(`--- Credit note deleted successfully ---`);
    return returnResponse(
      res,
      StatusCodes.OK,
      `Credit note deleted successfully`,
      result
    );
  } catch (error) {
    logger.error(`--- Error in deleting credit note ---`, error);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in deleting credit note: ${error.message}`
    );
  } finally {
    await prisma.$disconnect();
  }
};

export { deleteCreditNoteEndpoint };
