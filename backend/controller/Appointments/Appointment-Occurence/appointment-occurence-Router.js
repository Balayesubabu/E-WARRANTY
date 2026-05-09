import { Router } from "express";
import createAppointmentOccurenceEndpoint from "./create-appointment-occurence/index.js";
import deleteAppointmentOccurenceEndpoint from "./delete-appointment-occurence/index.js";
import getAppointmentOccurenceEndpoint from "./get-appointment-occurence/index.js";
import updateAppointmentOccurenceByIdEndpoint from "./update-appointment-occurence-by-id/index.js";

const appointmentOccurenceRouter = Router();

appointmentOccurenceRouter.post("/:appointment_id", createAppointmentOccurenceEndpoint);
appointmentOccurenceRouter.delete("/", deleteAppointmentOccurenceEndpoint);
appointmentOccurenceRouter.get("/", getAppointmentOccurenceEndpoint);
appointmentOccurenceRouter.put("/:occurrence_id", updateAppointmentOccurenceByIdEndpoint);

export default appointmentOccurenceRouter;