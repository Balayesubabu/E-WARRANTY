import express from "express";
import createAppointmentEndpoint from "./create-appointment/index.js";
import getProviderAppointmentsEndpoint from "./get-provider-appointments/index.js";
import getAppointmentDateFilterEndpoint from "./get-appointment-date-filter/index.js";
import deleteAppointmentEndpoint from "./delete-appointment/index.js";
import appointmentOccurenceRouter from "./Appointment-Occurence/appointment-occurence-Router.js";
import updateAppointmentEndpoint from "./update-appointment/index.js";

const appointmentRouter = express.Router();

appointmentRouter.use("/occurrence", appointmentOccurenceRouter);

appointmentRouter.post("/", createAppointmentEndpoint);
appointmentRouter.get("/", getProviderAppointmentsEndpoint);
appointmentRouter.get("/date-filter", getAppointmentDateFilterEndpoint);
appointmentRouter.delete("/:appointment_id", deleteAppointmentEndpoint);
appointmentRouter.put("/:appointment_id", updateAppointmentEndpoint);

export default appointmentRouter;
