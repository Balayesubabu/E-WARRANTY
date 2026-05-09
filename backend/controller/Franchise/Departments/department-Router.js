import { Router } from "express";
import { verifyToken } from "../../../middleware/verify-token.js";
import { createDepartment } from "./create-department/index.js";
import { getAllDepartment } from "./get-department/index.js";
import { updateDepartment } from "./update-department/index.js";

const departmentRouter = Router();

departmentRouter.post("/create", verifyToken, createDepartment);
// departmentRouter.post("/", verifyToken, createProviderFranchise);
departmentRouter.get("/getAllDepartments", verifyToken, getAllDepartment);
departmentRouter.put("/update", verifyToken, updateDepartment);

export default departmentRouter;
