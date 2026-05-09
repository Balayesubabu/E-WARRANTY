import express from "express";
import { createDebitNoteEndpoint } from "./create-debit-note/index.js";
import { updateDebitNoteEndpoint } from "./update-debit-note/index.js";
import { getProviderDebitNotesEndpoint } from "./get-all-debit-notes/index.js";
import {
  getDebitNoteByIdEndpoint,
  downloadDebitNoteEndpoint,
} from "./get-debit-note-by-id/index.js";
import { getDebitNoteByDateEndpoint } from "./get-debit-note-by-date/index.js";
import { deleteDebitNoteEndpoint } from "./delete-debit-note/index.js";
import { verifyToken } from "../../../middleware/verify-token.js";
import searchDebitNoteEndpoint from "./search-debit-note/index.js";

const router = express.Router();

router.post("/create-debit-note", verifyToken, createDebitNoteEndpoint);
router.get("/get-all-debit-notes", verifyToken, getProviderDebitNotesEndpoint);
router.get("/get-debit-note/:id", verifyToken, getDebitNoteByIdEndpoint);
router.get("/get-debit-note-by-date", verifyToken, getDebitNoteByDateEndpoint);
router.put("/update-debit-note/:id", verifyToken, updateDebitNoteEndpoint);
router.delete("/delete-debit-note/:id", verifyToken, deleteDebitNoteEndpoint);
router.get("/search-debit-note", verifyToken, searchDebitNoteEndpoint);
router.get(
  "/download-debit-note/:debit_note_id",
  verifyToken,
  downloadDebitNoteEndpoint
);

export default router;
