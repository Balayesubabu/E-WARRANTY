import express from "express";
import { verifyToken } from "../../../middleware/verify-token.js";
import { createCreditNoteEndpoint } from "./create-credit-note/index.js";
import { updateCreditNoteEndpoint } from "./update-credit-note/index.js";
import { getProviderCreditNoteEndpoint } from "./get-provider-credit-note/index.js";
import {
  getCreditNoteByIdEndpoint,
  downloadCreditNoteByIdEndpoint,
} from "./get-credit-note-by-id/index.js";
import { deleteCreditNoteEndpoint } from "./delete-credit-note/index.js";
import searchCreditNoteEndpoint from "./search-credit-note/index.js";
import getCreditNoteByDateEndpoint from "./get-credit-note-by-date/index.js";

const creditNoteRouter = express.Router();

creditNoteRouter.get(
  "/get-provider-credit-note",
  verifyToken,
  getProviderCreditNoteEndpoint
);
creditNoteRouter.get(
  "/get-credit-note-by-id/:credit_note_id",
  verifyToken,
  getCreditNoteByIdEndpoint
);
creditNoteRouter.post(
  "/create-credit-note",
  verifyToken,
  createCreditNoteEndpoint
);
creditNoteRouter.put(
  "/update-credit-note/:credit_note_id",
  verifyToken,
  updateCreditNoteEndpoint
);
creditNoteRouter.get(
  "/search-credit-note",
  verifyToken,
  searchCreditNoteEndpoint
);
creditNoteRouter.get(
  "/get-credit-note-by-date",
  verifyToken,
  getCreditNoteByDateEndpoint
);
creditNoteRouter.delete(
  "/delete-credit-note/:credit_note_id",
  verifyToken,
  deleteCreditNoteEndpoint
);
creditNoteRouter.get(
  "/download-credit-note/:credit_note_id",
  verifyToken,
  downloadCreditNoteByIdEndpoint
);

export default creditNoteRouter;
