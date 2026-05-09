import { Router } from "express";
import { verifyToken } from "../../../middleware/verify-token.js";
import { createSupportTicket } from "./create-supportTicket/index.js";
import { updateSupportTicket } from "./update-supportTicket/index.js";
import { getSupportTicket } from "./get-supportTicket/index.js";
import { getAllSupportTicket } from "./get-all-supportTicket/index.js";
import multer from "multer";
const upload = multer({ storage: multer.memoryStorage() });

const supportTicketRouter = Router();

supportTicketRouter.post("/create", upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]), verifyToken, createSupportTicket);
supportTicketRouter.post("/update", upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]), verifyToken, updateSupportTicket);
// supportTicketRouter.get("/getAllDepartments", verifyToken, getAllSupportTicket);
// supportTicketRouter.put("/update", verifyToken, updateSupportTicket);
supportTicketRouter.get("/get/:supportTicket_id", verifyToken, getSupportTicket);
supportTicketRouter.get("/getAll", verifyToken, getAllSupportTicket);

export default supportTicketRouter;
