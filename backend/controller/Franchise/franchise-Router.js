import { Router } from "express";
import { verifyToken, verifyLoginToken } from "../../middleware/verify-token.js";
import { getAllProviderFranchise } from "./get-all-provider-franchise/index.js";
import { createProviderFranchise } from "./create-provider-franchise/index.js";
import departmentRouter from "./Departments/department-Router.js";
import supportTicketRouter from "./SupportTickets/supportTicket-Router.js";
import supportTicketHistoryRouter from "./supportTicket-History/supportTicket-History-Router.js";
import { getProviderFranchise } from "./get-provider-franchise/index.js";
import {updateProviderFranchise} from "./update-provider-franchise/index.js";

const franchiseRouter = Router();

franchiseRouter.get("/",verifyLoginToken,getAllProviderFranchise);
franchiseRouter.post("/",verifyToken, createProviderFranchise);
franchiseRouter.use("/department", departmentRouter);
franchiseRouter.use("/supportTicket", supportTicketRouter);
franchiseRouter.use("/supportTicketHistory", supportTicketHistoryRouter);
franchiseRouter.get("/get/:franchise_id", verifyToken, getProviderFranchise);
franchiseRouter.put("/update", verifyToken, updateProviderFranchise);

export default franchiseRouter;
