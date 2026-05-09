import { Router } from "express";
import { verifyToken } from "../../../middleware/verify-token.js";

import { createSupportTicketHistory } from "./create-supportTicket-History/index.js";
import { getAllSupportTicketHistory } from "./get-all-supportTicket-History/index.js";

const supportTicketHistoryRouter = Router();
supportTicketHistoryRouter.post("/create", verifyToken, createSupportTicketHistory);
supportTicketHistoryRouter.get("/getAll/:supportTicket_id", verifyToken, getAllSupportTicketHistory);
export default supportTicketHistoryRouter;
;
