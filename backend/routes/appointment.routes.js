// import express from "express";
// import appointmentController from "../controllers/appointment.controller.js";
// import authMiddleware from "../middlewares/auth.middleware.js";

// const router = express.Router();

// router.post("/", appointmentController.handleCreateAppointment);

// router.get("/doctor/:doctorId", authMiddleware("doctor"), appointmentController.handleGetAppointmentsByDoctor);
// router.get("/doctor/:doctorId/next", authMiddleware("doctor"), appointmentController.handleGetNextPatientByDoctor);
// router.get("/doctor/:doctorId/urgent-queue", authMiddleware("doctor"), appointmentController.handleGetUrgentQueueByDoctor);
// router.get("/doctor/:doctorId/find-target", authMiddleware("doctor"), appointmentController.handleFindDoctorCancellationTarget);

// router.get("/patient/:patientId", appointmentController.handleGetAppointmentsByPatient);

// router.get("/", appointmentController.handleGetAllAppointments);
// router.get("/:id", appointmentController.handleGetAppointment);

// router.put("/:id", appointmentController.handleUpdateAppointment);
// router.patch("/:id/cancel", appointmentController.handleCancelAppointment);

// router.put("/:id/doctor-complete", authMiddleware("doctor"), appointmentController.handleMarkCompletedByDoctor);
// router.put("/:id/doctor-cancel", authMiddleware("doctor"), appointmentController.handleCancelByDoctor);

// router.delete("/:id", appointmentController.handleDeleteAppointment);

// export default router;





import express from "express";
import appointmentController from "../controllers/appointment.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", appointmentController.handleCreateAppointment);

router.get(
  "/doctor/:doctorId",
  authMiddleware("doctor"),
  appointmentController.handleGetAppointmentsByDoctor
);
router.get(
  "/doctor/:doctorId/next",
  authMiddleware("doctor"),
  appointmentController.handleGetNextPatientByDoctor
);
router.get(
  "/doctor/:doctorId/urgent-queue",
  authMiddleware("doctor"),
  appointmentController.handleGetUrgentQueueByDoctor
);
router.get(
  "/doctor/:doctorId/find-target",
  authMiddleware("doctor"),
  appointmentController.handleFindDoctorCancellationTarget
);

router.get(
  "/patient/:patientId",
  appointmentController.handleGetAppointmentsByPatient
);
router.get(
  "/patient/:patientId/find-target",
  appointmentController.handleFindPatientCancellationTarget
);

router.get("/", appointmentController.handleGetAllAppointments);
router.get("/:id", appointmentController.handleGetAppointment);

router.put("/:id", appointmentController.handleUpdateAppointment);
router.patch("/:id/cancel", appointmentController.handleCancelAppointment);

router.put(
  "/:id/doctor-complete",
  authMiddleware("doctor"),
  appointmentController.handleMarkCompletedByDoctor
);
router.put(
  "/:id/doctor-cancel",
  authMiddleware("doctor"),
  appointmentController.handleCancelByDoctor
);

router.delete("/:id", appointmentController.handleDeleteAppointment);

export default router;